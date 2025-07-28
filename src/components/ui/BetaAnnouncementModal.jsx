import Modal from './Modal';
import { FaTimes } from 'react-icons/fa';

const BetaAnnouncementModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      {/* --- ¡CAMBIO DE COLOR A AZUL FRANCIA! --- */}
      {/* 
        - bg-blue-700: Un azul oscuro e intenso para el fondo principal.
        - text-blue-100: Texto claro para un contraste suave.
        - text-blue-200/300: Tonos intermedios para textos secundarios.
      */}
      <div className="relative bg-blue-700 text-blue-100 p-8 rounded-lg max-w-lg w-full mx-auto shadow-2xl">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-blue-300 hover:text-white transition-colors"
            aria-label="Cerrar"
        >
            <FaTimes size={20} />
        </button>

        <div className="max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar-blue">
            <h2 className="text-3xl font-extrabold text-white mb-4">
                Estás usando la versión <span className="bg-yellow-400 text-blue-900 px-2 rounded">BETA</span> de Estud-IA
            </h2>
            <p className="text-blue-200 mb-4">
                ¡Y por eso es completamente gratis por tiempo limitado!
            </p>
            <p className="text-sm text-blue-300 mb-6">
                No te preocupes, te vamos a avisar antes de que esto pase a la versión ALFA (aunque sí, sabemos que es al revés… pero suena más serio 😎).
            </p>

            <div className="bg-blue-800/50 p-4 rounded-lg mb-6">
                <p className="text-base">
                    Cuando llegue ese momento, vas a poder seguir usando Estud-IA por solo <strong className="text-yellow-300">$4800 por mes</strong> (casi lo mismo que una coca al mes 🥤).
                </p>
            </div>
            
            <p className="text-blue-200 mb-4">
                Gracias a ese aporte, vamos a poder integrar herramientas aún más potentes, como:
            </p>
            <ul className="list-none space-y-2 mb-6 text-blue-100">
                <li className="flex items-start"><span className="text-green-400 mr-2">✅</span> Una Inteligencia Artificial que te ayude a hacer resúmenes</li>
                <li className="flex items-start"><span className="text-green-400 mr-2">✅</span> Modelos de parciales personalizados</li>
                <li className="flex items-start"><span className="text-green-400 mr-2">✅</span> Todo basado en el material que vos mismo subas</li>
            </ul>
            <p className="text-xs text-center text-blue-300 italic mb-6">
                (La IA no va a rendir el final por vos, pero te va a dar una mano 😂)
            </p>

            <div className="border-t border-blue-600/50 pt-4">
                <p className="text-center text-blue-200 font-semibold mb-2">
                    ¿Usás Mercado Pago? ¡Perfecto!
                </p>
                <p className="text-center text-sm text-blue-300">
                    La suscripción se cobra automáticamente todos los meses, para que no te tengas que preocupar.
                </p>
                
            </div>

            <p className="text-center font-bold text-lg mt-8 text-blue-200">
                Gracias por bancarnos ❤️
            </p>
            <p className="text-center text-sm mt-2 text-blue-300">
                Tu apoyo nos permite seguir mejorando Estud-IA todos los días, para que sea esa app que todos los estudiantes estresados merecen.
            </p>
            <p className="text-center text-xs mt-4 text-blue-400">
                De un estudiante para estudiantes. Gracias
            </p>
        </div>
      </div>
    </Modal>
  );
};

// --- ESTILOS DE SCROLLBAR ACTUALIZADOS ---
// Creamos un nuevo estilo para la barra de scroll que combine con el azul
const style = document.createElement('style');
style.innerHTML = `
  .custom-scrollbar-blue::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar-blue::-webkit-scrollbar-track {
    background: rgba(29, 78, 216, 0.2); /* blue-700 con transparencia */
  }
  .custom-scrollbar-blue::-webkit-scrollbar-thumb {
    background-color: rgba(96, 165, 250, 0.7); /* blue-400 con transparencia */
    border-radius: 10px;
  }
  .custom-scrollbar-blue::-webkit-scrollbar-thumb:hover {
    background-color: rgba(96, 165, 250, 1); /* blue-400 sólido */
  }
`;
// Para evitar duplicar estilos si el componente se re-renderiza, le damos un id
if (!document.getElementById('custom-scrollbar-styles')) {
    style.id = 'custom-scrollbar-styles';
    document.head.appendChild(style);
}

export default BetaAnnouncementModal;