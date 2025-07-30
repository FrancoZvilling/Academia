// --- IMPORTS ---
// API de Auth v1 (para el trigger de eliminación de usuarios)
const { user } = require("firebase-functions/v1/auth");

// Triggers de Firestore (API v2)
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");

// Funciones HTTPS (API v2)
const { onCall, HttpsError } = require("firebase-functions/v2/https");

// Otros módulos de Firebase Functions
const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");

// Librerías externas
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

// --- INICIALIZACIÓN ---
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Secreto para la API de Gemini
const geminiApiKey = defineSecret("GEMINI_API_KEY");

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
  if (!textToSummarize || typeof textToSummarize !== "string" || textToSummarize.length === 0) {
    throw new HttpsError("invalid-argument", "La función debe ser llamada con un campo 'text' válido.");
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey.value());
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
     **ROL Y OBJETIVO:**
    Eres un asistente académico experto llamado Estud-IA. Tu misión es analizar el siguiente texto, que corresponde a un apunte o libro para una materia universitaria, y generar un resumen de estudio exhaustivo. El objetivo final del estudiante es prepararse para un examen de opción múltiple (múltiple choice) que puede ser muy detallado y textual. Por lo tanto, es crucial no omitir información relevante.

    **CONTEXTO DEL EXAMEN:**
    - El examen es de opción múltiple.
    - Las preguntas pueden ser muy específicas ("puntillosas") y a veces se basan en frases textuales del material.
    - Se evalúan tanto ideas principales como ideas secundarias importantes.

    **INSTRUCCIONES DE CONTENIDO:**

    1.  **RESUMEN EXTENSO DE IDEAS PRINCIPALES:**
        -   Genera un resumen completo de todas las ideas y teorías principales presentadas en el texto.
        -   Organiza el resumen con títulos y subtítulos claros.
        -   **CITA AUTORES:** Si el texto menciona autores de frases o teorías, DEBES incluirlos en el resumen junto a sus respectivas ideas.

    2.  **INCLUSIÓN DE IDEAS SECUNDARIAS:**
        -   Identifica las ideas secundarias que apoyan o complementan a las ideas principales.
        -   Intégralas de forma concisa y lógica dentro del resumen, justo después de la idea principal a la que se refieren. No las presentes como una lista separada.

    3.  **EJEMPLOS PARA IDEAS TERCIARIAS:**
        -   Si encuentras ideas o conceptos más pequeños pero que consideras importantes para la comprensión, resúmelos como un ejemplo corto y simple.

    **INSTRUCCIONES DE FORMATO (OBLIGATORIO):**
    -   Usa "##" para los títulos principales.
    -   Usa "###" para los subtítulos.
    -   Usa "*" para crear listas con viñetas.
    -   Usa **negrita** (con **) para resaltar los nombres de los autores y los conceptos clave.

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
