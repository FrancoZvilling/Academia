// src/components/FileList.jsx (NUEVO ARCHIVO)
import { useState } from 'react';
import { getFileUrl } from '../services/storageService';
import { FaDownload, FaEye, FaTrash } from 'react-icons/fa';

const FileItem = ({ file, onPreview, onDelete }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation(); // Evita que se active otro evento padre
    setIsDownloading(true);
    try {
      const url = await getFileUrl(file.path);
      // Creamos un enlace invisible, lo "clickeamos" y lo removemos.
      // Esto fuerza la descarga en lugar de abrirlo en una nueva pestaña.
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al descargar el archivo:", error);
      alert("No se pudo obtener el enlace de descarga.");
    } finally {
      setIsDownloading(false);
    }
  };

  const canPreview = file.type.startsWith('image/') || file.type === 'application/pdf';

  return (
    <li className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm animate-fade-in">
      <span className="truncate mr-4" title={file.name}>{file.name}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {canPreview && (
          <button onClick={() => onPreview(file)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full" title="Vista Previa">
            <FaEye />
          </button>
        )}
        <button onClick={handleDownload} disabled={isDownloading} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full" title="Descargar">
          {isDownloading ? '...' : <FaDownload />}
        </button>
        <button onClick={() => onDelete(file)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full" title="Eliminar">
          <FaTrash />
        </button>
      </div>
    </li>
  );
};


const FileList = ({ files, onPreview, onDelete }) => {
  return (
    <ul className="mt-4 space-y-2">
      {files?.map((file) => (
        <FileItem key={file.path} file={file} onPreview={onPreview} onDelete={onDelete} />
      ))}
      {!files || files.length === 0 && (
        <p className="mt-4 text-center text-gray-500">No hay archivos para esta materia.</p>
      )}
    </ul>
  );
};

export default FileList;