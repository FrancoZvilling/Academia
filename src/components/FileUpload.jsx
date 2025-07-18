// src/components/FileUpload.jsx (NUEVO ARCHIVO)
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { uploadFileForSubject } from '../services/storageService';
import { addFileToSubject } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';

const FileUpload = ({ subject, onUploadSuccess }) => {
    const { register, handleSubmit, reset } = useForm();
    const { currentUser } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileUpload = async (data) => {
        const file = data.file[0];
        if (!file || !subject) return;

        setIsUploading(true);
        setError('');

        try {
            // 1. Subir el archivo a Firebase Storage
            const uploadResult = await uploadFileForSubject(currentUser.uid, subject.id, file);
            const filePath = uploadResult.ref.fullPath;

            // 2. Guardar la referencia en Firestore
            const fileData = {
                name: file.name,
                path: filePath,
                type: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString(),
            };
            await addFileToSubject(currentUser.uid, subject.yearId, subject.id, fileData);
            
            onUploadSuccess(); // Notificamos al componente padre para que se actualice
            reset();
        } catch (err) {
            console.error("Error subiendo archivo:", err);
            setError("No se pudo subir el archivo.");
        } finally {
            setIsUploading(false);
        }
    };

    const acceptedFileTypes = [
        // Documentos
        'application/pdf', // .pdf
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'text/plain', // .txt
        // Imágenes
        'image/jpeg', // .jpg, .jpeg
        'image/png', // .png
        'image/gif', // .gif
        'image/webp', // .webp
        // Comprimidos
        '.zip',
        '.rar',
    ].join(',');

    return (
        <div>
            <form onSubmit={handleSubmit(handleFileUpload)}>
                <input type="file" {...register("file", { required: true })} accept={acceptedFileTypes} className="file-input file-input-bordered border-black bg-surface-100 w-full mb-2" />
                
                <button type="submit" className="btn btn-primary bg-primary border-primary text-text-accent hover:bg-secondary hover:border-secondary w-full" disabled={isUploading}>
                    {isUploading ? "Subiendo..." : "Subir Archivo"}
                </button>
            </form>
            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
    );
};

export default FileUpload;