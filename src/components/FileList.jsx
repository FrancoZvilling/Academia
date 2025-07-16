import { useState } from 'react';
import { getFileUrl } from '../services/storageService';
import { FaDownload, FaEye, FaTrash } from 'react-icons/fa';

const FileItem = ({ file, onPreview, onDelete }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      // 1. Obtenemos la URL de descarga desde Firebase Storage
      const url = await getFileUrl(file.path);
      
      // 2. Abrimos esa URL en una nueva pestaña.
      //    El navegador se encargará de mostrarla o descargarla.
      window.open(url, '_blank', 'noopener,noreferrer');
      
    } catch (error) {
      console.error("Error al obtener la URL de descarga:", error);
      alert("No se pudo obtener el enlace de descarga.");
    } finally {
      // Ponemos un pequeño timeout para que el usuario vea el spinner
      // incluso si la apertura de la pestaña es instantánea.
      setTimeout(() => setIsDownloading(false), 500);
    }
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