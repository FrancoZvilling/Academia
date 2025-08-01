import { db } from '../config/firebase-config';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    doc, 
    deleteDoc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    collectionGroup,
    where,
    serverTimestamp,
    Timestamp, 
    writeBatch,
    setDoc
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";

// --- GESTIÓN DE NOTAS (AÑADIMOS UNA NUEVA FUNCIÓN) ---

/**
 * [NUEVA FUNCIÓN] Elimina TODAS las notas asociadas a un subjectId específico.
 * @param {string} userId
 * @param {string} subjectId
 */
export const deleteSubjectAndItsGrades = async (userId, subjectId) => {
  const gradesRef = collection(db, 'users', userId, 'notebook');
  // 1. Creamos una consulta para encontrar todas las notas de esa materia
  const q = query(gradesRef, where('subjectId', '==', subjectId));
  
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.log("No hay notas que borrar para esta materia.");
    return; // No hay nada que hacer
  }

  // 2. Usamos un lote (batch) para borrar todos los documentos encontrados en una sola operación
  const batch = writeBatch(db); // writeBatch es más adecuado para borrados
  querySnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  // 3. Ejecutamos el lote
  return batch.commit();
};

// --- GESTIÓN DE AÑOS ---
export const addYearForUser = (userId, yearName) => {
    const yearsCollectionRef = collection(db, 'users', userId, 'years');
    return addDoc(yearsCollectionRef, { name: yearName, createdAt: serverTimestamp() });
};
export const getYearsForUser = (userId) => {
    const yearsCollectionRef = collection(db, 'users', userId, 'years');
    const q = query(yearsCollectionRef, orderBy('createdAt', 'asc'));
    return getDocs(q);
};
export const deleteYear = (userId, yearId) => {
  const yearDocRef = doc(db, 'users', userId, 'years', yearId);
  return deleteDoc(yearDocRef);
};

/**
 * [NUEVA FUNCIÓN] Actualiza el nombre de un año existente.
 * @param {string} userId
 * @param {string} yearId
 * @param {string} newName - El nuevo nombre para el año.
 */
export const updateYearName = (userId, yearId, newName) => {
  const yearDocRef = doc(db, 'users', userId, 'years', yearId);
  return updateDoc(yearDocRef, {
    name: newName
  });
};

// --- GESTIÓN DE MATERIAS ---
export const addSubjectToYear = (userId, yearId, subjectData) => {
    const subjectsCollectionRef = collection(db, 'users', userId, 'years', yearId, 'subjects');
    return addDoc(subjectsCollectionRef, { ...subjectData, yearId, createdAt: serverTimestamp() });
};
export const getSubjectsForYear = (userId, yearId) => {
    const subjectsCollectionRef = collection(db, 'users', userId, 'years', yearId, 'subjects');
    const q = query(subjectsCollectionRef, orderBy('name', 'asc'));
    return getDocs(q);
};
export const getSubjectById = async (userId, subjectId) => {
    const yearsSnapshot = await getYearsForUser(userId);
    for (const yearDoc of yearsSnapshot.docs) {
        const subjectDocRef = doc(db, 'users', userId, 'years', yearDoc.id, 'subjects', subjectId);
        const subjectDoc = await getDoc(subjectDocRef);
        if (subjectDoc.exists()) { return { id: subjectDoc.id, ...subjectDoc.data() }; }
    }
    return null;
};
export const deleteSubject = (userId, yearId, subjectId) => {
  const subjectDocRef = doc(db, 'users', userId, 'years', yearId, 'subjects', subjectId);
  return deleteDoc(subjectDocRef);
};
export const updateSubject = (userId, yearId, subjectId, updatedData) => {
  const subjectDocRef = doc(db, 'users', userId, 'years', yearId, 'subjects', subjectId);
  return updateDoc(subjectDocRef, updatedData);
};


// --- GESTIÓN DE EVENTOS (ESTRATEGIA DE STRINGS ISO) ---
export const addEventToSubject = (userId, yearId, subjectId, eventData) => {
  const eventsCollectionRef = collection(db, 'users', userId, 'years', yearId, 'subjects', subjectId, 'events');
  const dataToSave = { ...eventData, userId, yearId, subjectId, type: 'event', createdAt: serverTimestamp() };
  return addDoc(eventsCollectionRef, dataToSave);
};

export const getEventsForSubject = async (userId, yearId, subjectId) => {
    const eventsCollectionRef = collection(db, 'users', userId, 'years', yearId, 'subjects', subjectId, 'events');
    const q = query(eventsCollectionRef, orderBy('start', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllEventsForUser = async (userId) => {
  const eventsQuery = query(collectionGroup(db, 'events'), where('userId', '==', userId));
  const querySnapshot = await getDocs(eventsQuery);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    if (data.type && data.type !== 'event') return null;
    return {
      id: doc.id,
      title: data.title,
      start: data.start, // Devolvemos el string directamente
      allDay: data.allDay,
      color: data.color || '#ef4444',
      extendedProps: { yearId: data.yearId, subjectId: data.subjectId, type: 'event' }
    };
  }).filter(Boolean);
};

export const deleteEvent = (userId, yearId, subjectId, eventId) => {
  const eventDocRef = doc(db, 'users', userId, 'years', yearId, 'subjects', subjectId, 'events', eventId);
  return deleteDoc(eventDocRef);
};

// --- EVENTOS GENERALES (ESTRATEGIA DE STRINGS ISO) ---
export const getGeneralEvents = async (userId) => {
  const eventsRef = collection(db, 'users', userId, 'generalEvents');
  const q = query(eventsRef, orderBy('start', 'asc'));
  const snapshot = await getDocs(q);
  // Devolvemos el array de datos directamente
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
export const addGeneralEvent = (userId, eventData) => {
    const eventsRef = collection(db, 'users', userId, 'generalEvents');
    const dataToSave = { ...eventData, color: '#f59e0b', createdAt: serverTimestamp() };
    return addDoc(eventsRef, dataToSave);
};
export const updateGeneralEvent = (userId, eventId, updatedData) => {
    const eventRef = doc(db, 'users', userId, 'generalEvents', eventId);
    return updateDoc(eventRef, updatedData);
};
export const deleteGeneralEvent = (userId, eventId) => {
    const eventRef = doc(db, 'users', userId, 'generalEvents', eventId);
    return deleteDoc(eventRef);
};


// --- GESTIÓN DE NOTAS (PARA "MI LIBRETA") ---
export const addGradeToNotebook = (userId, gradeData) => {
    const gradesRef = collection(db, 'users', userId, 'notebook');
    return addDoc(gradesRef, { ...gradeData, date: Timestamp.now() });
};
export const getNotebookGrades = (userId) => {
  const gradesRef = collection(db, 'users', userId, 'notebook');
  const q = query(gradesRef, orderBy('date', 'desc'));
  return getDocs(q);
};
export const getGradesForSubject = (userId, subjectId) => {
    const gradesRef = collection(db, 'users', userId, 'notebook');
    const q = query(gradesRef, where('subjectId', '==', subjectId), orderBy('date', 'asc'));
    return getDocs(q);
};
export const deleteGradeFromNotebook = (userId, gradeId) => {
    const gradeRef = doc(db, 'users', userId, 'notebook', gradeId);
    return deleteDoc(gradeRef);
};


// --- GESTIÓN DE TAREAS / CHECKLIST ---
export const addTaskToSubject = (userId, yearId, subjectId, taskData) => {
  const subjectDocRef = doc(db, 'users', userId, 'years', yearId, 'subjects', subjectId);
  return updateDoc(subjectDocRef, { tasks: arrayUnion(taskData) });
};
export const updateTasksForSubject = (userId, yearId, subjectId, updatedTasks) => {
  const subjectDocRef = doc(db, 'users', userId, 'years', yearId, 'subjects', subjectId);
  return updateDoc(subjectDocRef, { tasks: updatedTasks });
};


// --- GESTIÓN DE NOTAS PERSONALES ---
export const updateSubjectNotes = (userId, yearId, subjectId, notesContent) => {
  const subjectDocRef = doc(db, 'users', userId, 'years', yearId, 'subjects', subjectId);
  return updateDoc(subjectDocRef, { personalNotes: notesContent });
};


// --- GESTIÓN DE ARCHIVOS ---
export const addFileToSubject = (userId, yearId, subjectId, fileData) => {
    const subjectDocRef = doc(db, 'users', userId, 'years', yearId, 'subjects', subjectId);
    return updateDoc(subjectDocRef, { files: arrayUnion(fileData) });
};
export const removeFileFromSubject = (userId, yearId, subjectId, fileData) => {
  const subjectDocRef = doc(db, 'users', userId, 'years', yearId, 'subjects', subjectId);
  return updateDoc(subjectDocRef, { files: arrayRemove(fileData) });
};

// --- SERVICIO PARA LLAMAR A CLOUD FUNCTIONS ---

const functions = getFunctions();

/**
 * Llama a la Cloud Function 'generateSummary' con el texto proporcionado.
 * @param {string} text - El texto extraído del PDF para resumir.
 * @returns {Promise<string>} - Una promesa que resuelve al resumen generado.
 */
export const callGenerateSummary = async (text) => {
    try {
        const generateSummaryFunction = httpsCallable(functions, 'generateSummary');
        const result = await generateSummaryFunction({ text });
        return result.data.summary;
    } catch (error) {
        console.error("Error al llamar a la Cloud Function 'generateSummary':", error);
        // Lanza el error de nuevo para que el componente que llama pueda manejarlo
        throw new Error(error.message || "No se pudo generar el resumen.");
    }
};

/**
 * Llama a la Cloud Function 'generateExam' con el texto proporcionado.
 * @param {string} text - El texto extraído del PDF para generar el examen.
 * @returns {Promise<string>} - Una promesa que resuelve al string JSON con los datos del examen.
 */
export const callGenerateExam = async (text) => {
    try {
        const generateExamFunction = httpsCallable(functions, 'generateExam');
        const result = await generateExamFunction({ text });
        // La Cloud Function devuelve un objeto { examData: '...' }
        return result.data.examData;
    } catch (error) {
        console.error("Error al llamar a la Cloud Function 'generateExam':", error);
        throw new Error(error.message || "No se pudo generar el modelo de parcial.");
    }
};

// --- NUEVA FUNCIÓN PARA GESTIÓN DE DATOS DE USUARIO ---

/**
 * Crea un documento para un nuevo usuario en Firestore con valores por defecto.
 * Si el documento ya existe, no hace nada.
 * @param {string} userId - El UID del usuario de Firebase Auth.
 * @param {object} additionalData - Datos extra como email o displayName.
 */
export const createUserDocument = async (userId, additionalData = {}) => {
    if (!userId) return;
    
    const userDocRef = doc(db, 'users', userId);

    // Verificamos si el documento ya existe para no sobrescribirlo
    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) {
        const createdAt = new Date();
        try {
            await setDoc(userDocRef, {
                uid: userId,
                plan: 'free', // Todos los usuarios empiezan con el plan gratuito
                createdAt: createdAt,
                ...additionalData
            });
        } catch (error) {
            console.error("Error al crear el documento de usuario:", error);
        }
    }
};