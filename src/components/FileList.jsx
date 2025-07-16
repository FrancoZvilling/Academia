import { useState } from 'react';
import { getFileUrl } from '../services/storageService';
import { FaDownload, FaEye, FaTrash } from 'react-icons/fa';

const FileItem = ({ file, onPreview, onDelete }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e) => {
    // ... (lógica de descarga sin cambios)
  };

  const canPreview = file.type.startsWith('image/') || file.type === 'application/pdf';

  return (
    // --- ¡AQUÍ ESTÁ LA NUEVA ESTRUCTURA CON GRID! ---
    <li className="grid grid-cols-[1fr,auto] items-center gap-4 p-3 bg-surface-100 dark:bg-surface-200 rounded-lg shadow-sm">
      
      {/* Columna 1: Nombre del archivo (flexible) */}
      {/* 'min-w-0' sigue siendo crucial aquí para permitir que 'truncate' funcione */}
      <div className="min-w-0">
        <p className="truncate text-text-primary" title={file.name}>
          {file.name}
        </p>
      </div>

      {/* Columna 2: Botones (tamaño fijo) */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {canPreview && (
          <button onClick={() => onPreview(file)} className="btn btn-ghost btn-xs btn-circle" title="Vista Previa">
            <FaEye />
          </button>
        )}
        <button onClick={handleDownload} disabled={isDownloading} className="btn btn-ghost btn-xs btn-circle" title="Descargar">
          {isDownloading ? <span className="loading loading-spinner loading-xs"></span> : <FaDownload />}
        </button>
        <button onClick={() => onDelete(file)} className="btn btn-ghost btn-xs btn-circle text-red-500" title="Eliminar">
          <FaTrash />
        </button>
      </div>
    </li>
    // ----------------------------------------------------
  );
};


const FileList = ({ files, onPreview, onDelete }) => {
  return (
    <ul className="mt-4 space-y-2">
      {files?.map((file) => (
        <FileItem key={file.path} file={file} onPreview={onPreview} onDelete={onDelete} />
      ))}
      {!files || files.length === 0 && (
        <p className="mt-4 text-center text-text-secondary">No hay archivos para esta materia.</p>
      )}
    </ul>
  );
};

export default FileList;