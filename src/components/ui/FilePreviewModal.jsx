// src/components/ui/FilePreviewModal.jsx (NUEVO ARCHIVO)
import { motion, AnimatePresence } from 'framer-motion';

// Este modal está diseñado específicamente para la vista previa de archivos
const FilePreviewModal = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            // El tamaño máximo aquí es más grande para aprovechar mejor la pantalla
            className="bg-surface-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          >
            {/* Cabecera con la lógica para títulos largos */}
            <div className="flex items-center justify-between gap-4 p-4 border-b border-surface-200">
              <h3 className="text-xl font-bold text-text-primary truncate min-w-0">
                {title}
              </h3>
              <button 
                onClick={onClose} 
                className="p-2 -ml-2 rounded-full hover:bg-surface-200 text-text-secondary flex-shrink-0"
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>
            
            {/* Usamos flex-1 para que el contenido ocupe todo el espacio vertical restante */}
            <div className="p-1 sm:p-2 md:p-4 overflow-auto flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilePreviewModal;