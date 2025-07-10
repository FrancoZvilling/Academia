// src/services/storageService.js (NUEVO ARCHIVO)
import { storage } from '../config/firebase-config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Sube un archivo para una materia específica
export const uploadFileForSubject = (userId, subjectId, file) => {
    // Creamos una ruta única para el archivo, ej: 'users/USER_ID/subjects/SUBJECT_ID/nombre_archivo.pdf'
    const filePath = `users/${userId}/subjects/${subjectId}/${file.name}`;
    const storageRef = ref(storage, filePath);
    return uploadBytes(storageRef, file);
};

// Obtiene la URL de descarga de un archivo
export const getFileUrl = (filePath) => {
    const storageRef = ref(storage, filePath);
    return getDownloadURL(storageRef);
};

/**
 * Elimina un archivo de Firebase Storage.
 * @param {string} filePath - La ruta completa al archivo.
 */
export const deleteFileByPath = (filePath) => {
  const storageRef = ref(storage, filePath);
  return deleteObject(storageRef);
};