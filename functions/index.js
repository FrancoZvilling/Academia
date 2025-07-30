// --- IMPORTS (SIN CAMBIOS) ---
const { user } = require("firebase-functions/v1/auth");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

// --- INICIALIZACIÓN (SIN CAMBIOS) ---
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const geminiApiKey = defineSecret("GEMINI_API_KEY");


// --- FUNCIÓN: Borrar Año y su Contenido (CON REGIÓN AÑADIDA) ---
exports.deleteYearAndContent = onDocumentDeleted({
    document: "users/{userId}/years/{yearId}",
    region: "southamerica-east1"
}, async (event) => {
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


// --- FUNCIÓN: Borrar Usuario y su Contenido (CON REGIÓN AÑADIDA) ---
exports.deleteUserAndContent = user()
    .region("southamerica-east1")
    .onDelete(async (userRecord) => {
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


// --- FUNCIÓN: Generar Resumen con Gemini (CON REGIÓN AÑADIDA) ---
exports.generateSummary = onCall({ 
    secrets: [geminiApiKey],
    region: "southamerica-east1"
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "La función debe ser llamada por un usuario autenticado.");
  }

  const textToSummarize = request.data.text;
  if (!textToSummarize || typeof textToSummarize !== "string" || textToSummarize.length === 0) {
    throw new HttpsError("invalid-argument", "La función debe ser llamada con un campo 'text' válido.");
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey.value());
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Eres un asistente académico experto llamado Estud-IA. Tu tarea es analizar el siguiente texto extraído de los apuntes de un estudiante universitario y generar un resumen claro, conciso y bien estructurado.
    El resumen debe capturar las ideas principales, los conceptos clave y las definiciones importantes.
    Utiliza un lenguaje formal pero accesible. Formatea el resumen usando encabezados (con ##), listas con viñetas (con *) o numeradas.
    No incluyas opiniones ni información que no esté presente en el texto original.
    Al final, añade una sección titulada "### Conceptos Clave" con una lista de 3 a 5 términos fundamentales del texto.

    Aquí está el texto a resumir:
    ---
    ${textToSummarize}
    ---
  `;

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
