// --- IMPORTACIÓN V2 (SOLO PARA FIRESTORE, QUE SABEMOS QUE FUNCIONA) ---
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");

// --- IMPORTACIONES V1 (PARA AUTH, HTTPS Y CONFIGURACIÓN) ---
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// --- DEPENDENCIAS COMUNES ---
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- INICIALIZACIÓN ---
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// --- SECRETO (leído con el método V1, que es más estable) ---
const GEMINI_API_KEY = functions.config().gemini.key;


// --- FUNCIÓN: Borrar Año y su Contenido (Se mantiene en V2 porque funciona) ---
exports.deleteYearAndContent = onDocumentDeleted("users/{userId}/years/{yearId}", async (event) => {
  const { userId, yearId } = event.params;
  functions.logger.info(`(V2) Iniciando limpieza para el año ${yearId}`);

  const subjectsRef = db.collection("users").doc(userId).collection("years").doc(yearId).collection("subjects");
  const subjectsSnap = await subjectsRef.get();

  if (subjectsSnap.empty) {
    functions.logger.info("No hay materias que limpiar para este año.");
    return;
  }
  
  const batch = db.batch();
  const deletePromises = [];
  for (const doc of subjectsSnap.docs) {
    const eventsRef = doc.ref.collection("events");
    const eventsSnap = await eventsRef.get();
    eventsSnap.forEach(d => batch.delete(d.ref));
    
    const bucket = storage.bucket();
    const folderPath = `users/${userId}/subjects/${doc.id}/`;
    deletePromises.push(bucket.deleteFiles({ prefix: folderPath }));
    
    batch.delete(doc.ref);
  }
  
  deletePromises.push(batch.commit());
  await Promise.all(deletePromises);
  functions.logger.info(`(V2) Limpieza de año completada.`);
});


// --- FUNCIÓN: Borrar Usuario y su Contenido (Pasada a SINTAXIS V1 ESTABLE) ---
exports.deleteUserAndContent = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  functions.logger.info(`(V1) Iniciando limpieza completa para usuario ${uid}`);
  try {
    const userDocRef = db.collection("users").doc(uid);
    await db.recursiveDelete(userDocRef);
    functions.logger.info(`(V1) Documentos de Firestore eliminados.`);

    const bucket = storage.bucket();
    const folderPath = `users/${uid}/`;
    await bucket.deleteFiles({ prefix: folderPath });
    functions.logger.info(`(V1) Archivos de Storage eliminados.`);
  } catch (error) {
    if (error.code === 5) {
      functions.logger.info(`(V1) No se encontraron datos para el usuario ${uid}.`);
    } else {
      functions.logger.error(`(V1) Error en limpieza de usuario ${uid}:`, error);
    }
  }
});


// --- FUNCIÓN: Generar Resumen con Gemini (Pasada a SINTAXIS V1 ESTABLE) ---
exports.generateSummary = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "La función debe ser llamada por un usuario autenticado.");
  }

  const textToSummarize = data.text;
  if (!textToSummarize || typeof textToSummarize !== 'string' || textToSummarize.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "La función debe ser llamada con un campo 'text' válido.");
  }
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
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

  functions.logger.info("Llamando a la API de Gemini (V1)...");
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = response.text();
    
    return { summary: summary };
  } catch (error) {
    functions.logger.error("Error al llamar a la API de Gemini:", error);
    throw new functions.https.HttpsError("internal", "No se pudo generar el resumen.");
  }
});