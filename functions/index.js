const functions = require("firebase-functions");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const geminiApiKey = defineSecret("GEMINI_API_KEY");

exports.deleteYearAndContent = onDocumentDeleted({
    document: "users/{userId}/years/{yearId}",
    region: "southamerica-east1"
}, async (event) => {
  const { userId, yearId } = event.params;
  logger.info(`(V2) Iniciando limpieza para el año ${yearId}`);
  const subjectsRef = db.collection("users").doc(userId).collection("years").doc(yearId).collection("subjects");
  const subjectsSnap = await subjectsRef.get();
  if (subjectsSnap.empty) { logger.info("No hay materias que limpiar."); return; }
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

exports.deleteUserAndContent = functions.region("southamerica-east1").auth.user().onDelete(async (userRecord) => {
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
    if (error.code === 5) { logger.info(`(Auth v1) No se encontraron datos para el usuario ${uid}.`);
    } else { logger.error(`(Auth v1) Error en limpieza de usuario ${uid}:`, error); }
  }
});

exports.generateSummary = onCall({ 
    secrets: [geminiApiKey],
    region: "southamerica-east1"
}, async (request) => {
  if (!request.auth) { throw new HttpsError("unauthenticated", "..."); }
  const textToSummarize = request.data.text;
  if (!textToSummarize) { throw new HttpsError("invalid-argument", "..."); }
  const genAI = new GoogleGenerativeAI(geminiApiKey.value());
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `...${textToSummarize}...`; // Tu prompt
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
