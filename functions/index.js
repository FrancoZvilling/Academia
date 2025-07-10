// functions/index.js (CÓDIGO CORREGIDO CON API v2)

// Importamos los módulos específicos de la v2
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

/**
 * Función v2 que se dispara cuando un documento 'Year' es eliminado.
 * Realiza una limpieza en cascada de materias, eventos y archivos asociados.
 */
exports.deleteYearAndContent = onDocumentDeleted("users/{userId}/years/{yearId}", async (event) => {
  const { userId, yearId } = event.params;
  
  logger.info(`Iniciando limpieza para el año ${yearId} del usuario ${userId}`);

  // 1. Obtener todas las materias de este año
  const subjectsRef = db.collection("users").doc(userId).collection("years").doc(yearId).collection("subjects");
  const subjectsSnap = await subjectsRef.get();

  if (subjectsSnap.empty) {
    logger.info("No hay materias que limpiar para este año.");
    return null;
  }

  const batch = db.batch();
  const deletePromises = [];

  for (const subjectDoc of subjectsSnap.docs) {
    const subjectId = subjectDoc.id;

    // --- Borrar Subcolección de Eventos ---
    const eventsRef = subjectsRef.doc(subjectId).collection("events");
    const eventsSnap = await eventsRef.get();
    eventsSnap.forEach(eventDoc => {
      batch.delete(eventDoc.ref);
    });

    // --- Borrar Archivos en Storage ---
    const bucket = storage.bucket();
    const folderPath = `users/${userId}/subjects/${subjectId}/`;
    
    logger.info(`Borrando archivos de Storage en la ruta: ${folderPath}`);
    deletePromises.push(
      bucket.deleteFiles({ prefix: folderPath })
        .catch(err => logger.error(`Error al borrar archivos de Storage para la materia ${subjectId}:`, err))
    );

    // --- Borrar el Documento de la Materia ---
    batch.delete(subjectDoc.ref);
  }

  // Ejecutar el lote de borrado de Firestore
  deletePromises.push(batch.commit());

  return Promise.all(deletePromises)
    .then(() => logger.info(`Limpieza completada para el año ${yearId}.`))
    .catch(err => logger.error(`Error durante la limpieza del año ${yearId}:`, err));
});