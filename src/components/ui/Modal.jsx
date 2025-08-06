import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, children, showCloseButton = true }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          // Añadimos padding vertical para que el modal no toque los bordes superior/inferior
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 py-12"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            // 1. Aplicamos un ancho máximo más pequeño en móviles (max-w-sm)
            // 2. Definimos que el modal es un flexbox vertical y que su altura máxima es la del contenedor
            className="bg-surface-100 rounded-lg shadow-xl w-full max-w-sm sm:max-w-md flex flex-col max-h-full"
          >
            {/* --- CABECERA DEL MODAL --- */}
            <div className={`flex items-center p-4 border-b border-surface-200 ${showCloseButton ? 'justify-between' : 'justify-center'}`}>
              <h3 className="text-xl font-bold text-text-primary">{title}</h3>
              
              {showCloseButton && (
                <button 
                  onClick={onClose} 
                  className="p-2 -mr-2 rounded-full hover:bg-surface-200 text-text-secondary"
                  aria-label="Cerrar modal"
                >
                  &times;
                </button>
              )}
            </div>
            
            {/* --- CONTENIDO CON SCROLL --- */}
            {/* 3. 'overflow-y-auto' permite que esta área tenga scroll si el contenido es muy largo */}
            <div className="p-6 overflow-y-auto">
              {children}
            </div>
            {/* --------------------------- */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;