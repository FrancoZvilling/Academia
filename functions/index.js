// --- IMPORTS ---
const { user } = require("firebase-functions/v1/auth");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
const mercadopago = require("mercadopago");
const { onSchedule } = require("firebase-functions/v2/scheduler");

// --- INICIALIZACIÓN ---
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const mpAccessToken = defineSecret("MERCADOPAGO_ACCESS_TOKEN");


// --- FUNCIÓN: Borrar Año y su Contenido (V2) ---
exports.deleteYearAndContent = onDocumentDeleted("users/{userId}/years/{yearId}", async (event) => {
    const { userId, yearId } = event.params;
    logger.info(`(V2) Iniciando limpieza para el año ${yearId}`);

    const subjectsRef = db.collection("users").doc(userId).collection("years").doc(yearId).collection("subjects");
    const subjectsSnap = await subjectsRef.get();

    if (subjectsSnap.empty) {
        logger.info("No hay materias que limpiar para este año.");
        return;
    }

    const batch = db.batch();
    const deletePromises = [];

    for (const doc of subjectsSnap.docs) {
        const eventsRef = doc.ref.collection("events");
        const eventsSnap = await eventsRef.get();
        eventsSnap.forEach((d) => batch.delete(d.ref));

        const bucket = storage.bucket();
        const folderPath = `users/${userId}/subjects/${doc.id}/`;
        deletePromises.push(bucket.deleteFiles({ prefix: folderPath }));

        batch.delete(doc.ref);
    }

    deletePromises.push(batch.commit());
    await Promise.all(deletePromises);
    logger.info(`(V2) Limpieza de año completada.`);
});


// --- FUNCIÓN: Borrar Usuario y su Contenido (usando v1/auth) ---
exports.deleteUserAndContent = user().onDelete(async (userRecord) => {
    const uid = userRecord.uid;
    logger.info(`(Auth v1) Iniciando limpieza completa para usuario ${uid}`);
    try {
        const userDocRef = db.collection("users").doc(uid);
        await db.recursiveDelete(userDocRef);
        logger.info(`(Auth v1) Documentos de Firestore eliminados.`);

        const bucket = storage.bucket();
        const folderPath = `users/${uid}/`;
        await bucket.deleteFiles({ prefix: folderPath });
        logger.info(`(Auth v1) Archivos de Storage eliminados.`);
    } catch (error) {
        if (error.code === 5) {
            logger.info(`(Auth v1) No se encontraron datos para el usuario ${uid}.`);
        } else {
            logger.error(`(Auth v1) Error en limpieza de usuario ${uid}:`, error);
        }
    }
});


// --- FUNCIÓN: Generar Resumen con Gemini (V2) ---
exports.generateSummary = onCall({ secrets: [geminiApiKey] }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "La función debe ser llamada por un usuario autenticado.");
    }

    const textToSummarize = request.data.text;
    const mode = request.data.mode || 'standard'; // 'standard', 'explanatory', 'math'

    if (!textToSummarize || typeof textToSummarize !== "string" || textToSummarize.length === 0) {
        throw new HttpsError("invalid-argument", "La función debe ser llamada con un campo 'text' válido.");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    // --- CORRECCIÓN ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    // --------------------

    let prompt = "";

    if (mode === 'math') {
        prompt = `
        *ROL Y OBJETIVO:*
        Eres un profesor experto en matemáticas y ciencias exactas llamado Estud-IA. Tu función es explicar el contenido del texto proporcionado utilizando ejemplos matemáticos claros, paso a paso y analogías simples.
        
        *INSTRUCCIONES:*
        1. Analiza el texto proporcionado.
        2. Identifica los conceptos clave.
        3. Para cada concepto, proporciona una explicación teórica breve seguida de un EJEMPLO MATEMÁTICO o numérico concreto.
        4. Si el texto no contiene matemáticas explícitas, usa analogías lógicas o numéricas para explicar los conceptos.
        5. Usa formato Markdown. Usa negritas para conceptos clave y bloques de código para fórmulas o pasos de cálculo.
        
        *FORMATO DE SALIDA:*
        ## [Título del Concepto]
        **Explicación:** [Breve explicación teórica]
        **Ejemplo Matemático:**
        [Ejemplo paso a paso con números o variables]
        
        ---
        
        *TEXTO A PROCESAR:*
        ${textToSummarize}
        `;
    } else if (mode === 'explanatory') {
        prompt = `
        *ROL Y OBJETIVO:*
        Eres un profesor particular paciente y didáctico llamado Estud-IA. Tu objetivo es explicar el contenido del texto de manera profunda pero fácil de entender, como si le estuvieras enseñando a un estudiante que necesita claridad.
        
        *INSTRUCCIONES:*
        1. No solo resumas, EXPLICA. Desglosa las ideas complejas en partes más simples.
        2. Usa analogías y ejemplos de la vida real siempre que sea posible.
        3. Anticipa posibles dudas y acláralas.
        4. Usa un tono conversacional pero académico y alentador.
        5. Usa formato Markdown con títulos, subtítulos y listas.
        
        *FORMATO DE SALIDA:*
        ## [Concepto Principal]
        **¿Qué es?** [Explicación simple]
        **¿Por qué es importante?** [Contexto y relevancia]
        **Ejemplo:** [Analogía o caso práctico]
        
        ---
        
        *TEXTO A PROCESAR:*
        ${textToSummarize}
        `;
    } else {
        // STANDARD MODE (El original)
        prompt = `
        *ROL Y OBJETIVO:*
        Eres una herramienta de procesamiento de texto llamada Estud-IA. Tu única función es transformar un texto académico en un formato de resumen estructurado para facilitar el estudio. NO debes actuar como un editor ni omitir información. Tu objetivo es reestructurar y condensar el 100% del contenido original.
        
        *CONTEXTO DEL EXAMEN:*
        
        -El examen es de opción múltiple.
        
        *INSTRUCCIONES DE FORMATO:*
        
        1.  **Título Principal:** Comienza con el título del tema en H2 (## Título).
        2.  **Subtítulos:** Usa H3 (### Subtítulo) para dividir las secciones principales.
        3.  **Puntos Clave:** Usa viñetas (*) para listar la información.
        4.  **Negritas:** Usa **negritas** para resaltar términos clave, fechas, nombres y definiciones importantes.
        5.  **Concisión:** Sé directo. Elimina la paja, pero mantén el significado completo.
        
        *REGLAS:*
        
        *   NO agregues introducciones ni conclusiones (ej: "Aquí tienes el resumen...").
        *   NO uses frases como "El texto menciona..." o "El autor dice...".
        *   Mantén el idioma original del texto.
        
        *TEXTO A RESUMIR:*
        ${textToSummarize}
        `;
    }

    logger.info("Llamando a la API de Gemini...");
    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const summary = response.text();

        return { summary };
    } catch (error) {
        logger.error("Error al llamar a la API de Gemini:", error);
        throw new HttpsError("internal", "No se pudo generar el resumen.");
    }
});


// --- FUNCIÓN: Generar Modelo de Parcial (V2) ---
exports.generateExam = onCall({ secrets: [geminiApiKey] }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "La función debe ser llamada por un usuario autenticado.");
    }

    const textForExam = request.data.text;
    const questionsCount = request.data.questions || 10;

    if (!textForExam || typeof textForExam !== "string" || textForExam.length === 0) {
        throw new HttpsError("invalid-argument", "La función debe ser llamada con un campo 'text' válido.");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    // --- CORRECCIÓN ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    // --------------------

    const prompt = `
    ROL: Eres un experto creador de exámenes universitarios.
    TAREA: Analiza el siguiente texto de un apunte universitario y genera un examen de opción múltiple (multiple choice) de ${questionsCount} preguntas.

    INSTRUCCIONES CLAVE:
-Crea preguntas de comprensión y aplicación del conocimiento, como las que haría un profesor para evaluar si el alumno entendió el contenido.
-Nunca hagas preguntas que hagan referencia explícita al texto, tablas, figuras o secciones (ejemplo: "según la tabla 2", "como menciona el párrafo 3").
-Formula preguntas como si fueras un profesor que enseña el tema, no como un lector del texto.
-Cada pregunta debe ser clara, relevante y tener una sola respuesta correcta, sin ambigüedades.
-Evita preguntas triviales o que solo pidan repetir frases del texto.

Al generar las preguntas de opción múltiple, asegurate de que:
-Las respuestas incorrectas no sean obvias ni triviales.
-Los distractores se construyan mezclando conceptos, definiciones o ejemplos de otras partes del mismo texto, para que sean plausibles aunque incorrectos.
-No todos los distractores deben ser definiciones inventadas, algunos deben ser reales pero aplicados en un contexto equivocado.
-Variá entre preguntas fáciles, medias y difíciles, pero en las fáciles evitá que la respuesta correcta sea demasiado evidente.
-En las difíciles, asegurate de que todas las opciones requieran atención y comprensión del contenido, no solo memoria mecánica.
-Las preguntas deben cubrir distintas partes y conceptos importantes del texto.
-Mezcla preguntas de distintos niveles de dificultad (fáciles, intermedias, difíciles). 
-Todas las preguntas deben basarse en el contenido del texto, pero redactadas como lo haría un profesor.

CONTROL DE DISTRIBUCIÓN DE RESPUESTAS:
-Al generar las ${questionsCount} preguntas, asegúrate de que la letra de la respuesta correcta esté distribuida de manera equilibrada entre 'a', 'b', 'c' y 'd'. 
-No concentres la mayoría de respuestas correctas en una misma opción (ejemplo: no más de 3 respuestas en la misma letra). 
-Si al terminar detectas que hay un desbalance, reasigna de forma interna las letras de las respuestas correctas hasta lograr una distribución equitativa (aproximadamente 2 o 3 en cada letra). 
-La reasignación de letras no debe alterar el contenido de las opciones, solo cuál de ellas es considerada la correcta. 


REGLAS ESTRICTAS DE SALIDA:
Tu respuesta debe ser EXCLUSIVAMENTE un string JSON válido, sin ningún texto antes o después.
El JSON debe ser un array de ${questionsCount} objetos.
Cada objeto debe tener EXACTAMENTE la siguiente estructura:
{ "question": "El texto completo de la pregunta", "options": ["Texto opción A", "Texto opción B", "Texto opción C", "Texto opción D"], "answer": "La letra de la opción correcta en minúscula, ej: 'a', 'b', 'c' o 'd'" }



TEXTO A ANALIZAR:
    ---
    ${textForExam}
    ---
  `;

    logger.info(`Llamando a la API de Gemini para generar un examen de ${questionsCount} preguntas...`);
    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const jsonText = response.text();

        return { examData: jsonText };

    } catch (error) {
        logger.error("Error al llamar a la API de Gemini para generar el examen:", error);
        if (error.message && error.message.toLowerCase().includes('overloaded')) {
            throw new HttpsError("resource-exhausted", "Nuestros servidores de IA están ocupados. Por favor, inténtalo de nuevo en unos minutos.");
        }
        throw new HttpsError("internal", "No se pudo generar el modelo de parcial.");
    }
});


// --- FUNCIÓN PARA CREAR LINK DE SUSCRIPCIÓN (V2) ---
exports.createSubscriptionLink = onCall({
    secrets: [mpAccessToken],
    region: "southamerica-east1"
}, async (request) => {
    // 1. Loguear inicio y datos del usuario
    logger.info("Iniciando 'createSubscriptionLink'...");
    if (!request.auth) {
        logger.error("Error: La función fue llamada sin autenticación.");
        throw new HttpsError("unauthenticated", "Debes estar logueado para suscribirte.");
    }
    const userId = request.auth.uid;
    const userEmail = request.auth.token.email;
    logger.info(`Llamada autenticada por usuario: ${userId} (${userEmail})`);

    if (!userEmail) {
        throw new HttpsError("failed-precondition", "El usuario no tiene un email asociado.");
    }

    // 2. Loguear el Access Token (solo los primeros caracteres por seguridad)
    const accessToken = mpAccessToken.value();
    if (!accessToken) {
        logger.error("FATAL: El secreto MERCADOPAGO_ACCESS_TOKEN no se pudo leer.");
        throw new HttpsError("internal", "Error de configuración del servidor.");
    }
    logger.info(`Access Token cargado correctamente.Comienza con: ${accessToken.substring(0, 15)}...`);

    // 3. Configurar el cliente de Mercado Pago
    const client = new mercadopago.MercadoPagoConfig({
        accessToken: accessToken,
        options: { timeout: 5000 }
    });
    const preapproval = new mercadopago.PreApproval(client);

    const planData = {
        reason: "Suscripción Premium Estud-IA",
        auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: 4800,
            currency_id: "ARS"
        },
        back_url: "https://www.estud-ia.com.ar/premium",
        external_reference: userId,
        payer_email: userEmail,
        status: "pending"
    };

    try {
        // 4. Loguear los datos exactos que se envían a Mercado Pago
        logger.info("Enviando los siguientes datos a la API de Mercado Pago:", JSON.stringify(planData, null, 2));

        const result = await preapproval.create({ body: planData });

        logger.info("Respuesta exitosa recibida de Mercado Pago:", result);

        if (result && result.init_point) {
            return { url: result.init_point };
        } else {
            logger.error("La respuesta de Mercado Pago fue exitosa pero no contenía una URL 'init_point'.", result);
            throw new Error("Respuesta inválida de Mercado Pago.");
        }
    } catch (error) {
        // 5. Loguear el error detallado que hemos estado buscando
        const mpError = error.cause || error;
        logger.error("---- ERROR DETALLADO DE MERCADO PAGO ----", mpError);
        const errorMessage = mpError.message || "No se pudo generar el link de pago.";
        throw new HttpsError("internal", `Error de Mercado Pago: ${errorMessage} `);
    }
});

exports.adminTasks = onCall({
    secrets: [/* ... */],
    region: "southamerica-east1"
}, async (request) => {
    const adminUID = "40HuVxGw1KfO73hqJDiOb9OERIp1";
    if (request.auth?.uid !== adminUID) {
        throw new HttpsError("permission-denied", "No tienes permisos de administrador.");
    }

    const action = request.data.action;
    const payload = request.data.payload;

    switch (action) {
        case 'LIST_USERS':
            try {
                // Obtenemos los usuarios de Auth
                const listUsersResult = await admin.auth().listUsers(1000);

                // Obtenemos los datos adicionales de Firestore
                const firestoreUsersSnap = await db.collection('users').get();
                const firestoreUsersData = {};
                firestoreUsersSnap.forEach(doc => {
                    firestoreUsersData[doc.id] = doc.data();
                });

                // Combinamos los datos de Auth y Firestore
                const users = listUsersResult.users.map(user => ({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    // Añadimos los datos de Firestore (plan, premiumUntil, etc.)
                    ...firestoreUsersData[user.uid]
                }));
                return { users };
            } catch (error) {
                logger.error("Error al listar usuarios:", error);
                throw new HttpsError("internal", "No se pudo listar los usuarios.");
            }

        case 'UPDATE_USER_PLAN':
            try {
                const { userId, plan, mercadopagoEmail } = payload;
                if (!userId || !plan) throw new HttpsError("invalid-argument", "Faltan datos.");

                const userDocRef = db.collection("users").doc(userId);

                const dataToUpdate = { plan };

                if (plan === 'premium') {
                    // Si el plan es premium, seteamos o reseteamos la fecha de vencimiento a 31 días
                    const newExpiryDate = new Date();
                    newExpiryDate.setDate(newExpiryDate.getDate() + 31);
                    dataToUpdate.premiumUntil = admin.firestore.Timestamp.fromDate(newExpiryDate);
                } else {
                    // Si lo pasamos a free, podemos borrar la fecha de vencimiento
                    dataToUpdate.premiumUntil = admin.firestore.FieldValue.delete();
                }

                // Si se nos pasa un email de MP, lo guardamos
                if (mercadopagoEmail) {
                    dataToUpdate.mercadopagoEmail = mercadopagoEmail;
                }

                await userDocRef.update(dataToUpdate);
                logger.info(`Plan del usuario ${userId} actualizado.`, dataToUpdate);
                return { success: true };

            } catch (error) {
                logger.error("Error al actualizar el plan del usuario:", error);
                throw new HttpsError("internal", "No se pudo actualizar el plan.");
            }

        default:
            throw new HttpsError("invalid-argument", "Acción no reconocida.");
    }
});

// --- ¡NUEVA FUNCIÓN PROGRAMADA PARA NOTIFICACIONES! ---

// Se ejecutará cada hora, en el minuto 0. ("0 * * * *")
exports.checkScheduledNotifications = onSchedule({
    schedule: "every 1 hours",
    region: "southamerica-east1",
    timeZone: "America/Argentina/Buenos_Aires"
}, async (event) => {
    // Generamos un ID único para esta ejecución para rastrearla en los logs
    const executionId = Math.random().toString(36).substring(7);
    logger.info(`[EXEC_ID: ${executionId}] INICIO de chequeo de notificaciones.`);

    const now = new Date();

    // 1. Obtener todos los usuarios
    const usersSnap = await db.collection('users').get();

    const notificationPromises = [];

    for (const userDoc of usersSnap.docs) {
        const user = userDoc.data();
        const userId = user.uid;

        if (!user.fcmTokens || user.fcmTokens.length === 0) {
            continue;
        }

        // --- Lógica de comprobación para cada tipo de recordatorio ---

        // A. Eventos de Materia y Generales
        const eventsCollections = ['events', 'generalEvents'];
        for (const coll of eventsCollections) {
            const eventsSnap = await db.collectionGroup(coll).where('userId', '==', userId).orderBy('start').get();

            eventsSnap.forEach(async (eventDoc) => { // Async para poder hacer await adentro
                const eventData = eventDoc.data();
                if (!eventData.start || typeof eventData.start !== 'string') return;

                let dateString = eventData.start;
                if (dateString.length === 10) dateString += "T00:00:00";
                if (!dateString.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateString)) dateString += "-03:00";

                const eventStart = new Date(dateString);
                if (isNaN(eventStart.getTime())) return;

                const hoursUntil = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);

                let message = null;
                let title = "Recordatorio de Evento";
                let color = null; // Variable para el color

                const isSubjectEvent = coll === 'events';
                const isGeneralEvent = coll === 'generalEvents';

                if (hoursUntil > 23.5 && hoursUntil <= 24.5) {
                    message = `Mañana tienes "${eventData.title}"`;
                    title = isSubjectEvent ? "Examen / Entrega" : "Evento General";
                } else if (isSubjectEvent && hoursUntil > 71.5 && hoursUntil <= 72.5) {
                    message = `En 3 días tienes "${eventData.title}"`;
                    title = "Examen / Entrega";
                } else if (isSubjectEvent && hoursUntil > 167.5 && hoursUntil <= 168.5) {
                    message = `En una semana tienes "${eventData.title}"`;
                    title = "Examen / Entrega";
                } else if (isGeneralEvent && hoursUntil > 11.5 && hoursUntil <= 12.5) {
                    message = `En 12 horas: "${eventData.title}"`;
                    title = "Evento General";
                }

                if (message) {
                    // Si es un evento de materia, intentamos buscar el color de la materia
                    if (isSubjectEvent) {
                        try {
                            const subjectDoc = await eventDoc.ref.parent.parent.get();
                            if (subjectDoc.exists) {
                                color = subjectDoc.data().color;
                            }
                        } catch (e) {
                            logger.warn(`No se pudo obtener el color de la materia para el evento ${eventDoc.id}`, e);
                        }
                    } else {
                        color = eventData.color; // Color directo para eventos generales
                    }

                    // Enviamos la notificación a TODOS los tokens del usuario
                    const tokens = user.fcmTokens;
                    const payload = {
                        notification: {
                            title: title,
                            body: message,
                        },
                        data: {
                            url: "/calendar", // O la URL que quieras abrir
                            // Puedes agregar más datos aquí si lo necesitas
                        }
                    };
                    // Si tenemos color, lo agregamos al payload (Android lo soporta en 'color')
                    if (color) {
                        payload.android = {
                            notification: {
                                color: color
                            }
                        }
                    }

                    logger.info(`Enviando notificación a usuario ${userId}: ${message}`);
                    notificationPromises.push(admin.messaging().sendToDevice(tokens, payload));
                }
            });
        }
    }

    await Promise.all(notificationPromises);
    logger.info(`[EXEC_ID: ${executionId}] Chequeo de notificaciones finalizado.`);
});