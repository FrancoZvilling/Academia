import Modal from './Modal';
import { FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const BetaAnnouncementModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      {/* --- ¡NUEVA PALETA DE COLOR ESCARLATA Y DORADO! --- */}
      {/* 
        - bg-red-800: Un rojo escarlata oscuro y rico para el fondo.
        - text-amber-300: Un tono dorado para los highlights y acentos.
        - text-red-100/200: Textos claros con un tinte rojizo para el cuerpo.
      */}
      <div className="relative bg-red-800 text-red-100 p-6 sm:p-8 rounded-lg max-w-lg w-full mx-auto shadow-2xl">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-red-300 hover:text-white transition-colors"
            aria-label="Cerrar"
        >
            <FaTimes size={20} />
        </button>

        <div className="max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar-rojo">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-2">
                Bienvenido a la versión gratuita de <span className="text-amber-300">Estud-IA</span>
            </h2>
            <p className="text-center text-red-200 italic mb-6">
                "Tu agenda estudiantil, para que dejes de vivir perdido como perro en cancha de bochas 😝"
            </p>

            <ul className="space-y-3 text-red-100 mb-6">
                <li className="flex items-start gap-3"><span className="text-xl">🧻</span><span>Agregá tus materias con día, horario, comisión y más.</span></li>
                <li className="flex items-start gap-3"><span className="text-xl">📯</span><span>Creá tu propia libreta académica para seguir tu progreso.</span></li>
                <li className="flex items-start gap-3"><span className="text-xl">👞</span><span>Organizá tus días de clase, parciales o TP con el calendario.</span></li>
            </ul>
            <p className="text-center text-xs text-red-300 italic mb-8">
                (sí, estoy usando emojis al azar)
            </p>

            {/* --- SECCIÓN PREMIUM --- */}
            <div className="bg-red-900/50 p-6 rounded-lg text-center shadow-lg">
                <h3 className="text-xl font-bold text-white mb-2">Alguien dijo… ¿PREMIUM? 💅</h3>
                <p className="font-semibold text-2xl text-amber-300 mb-4">
                    ¡Ahora los usuarios premium cuentan con IA! 😎
                </p>
                <ul className="space-y-2 text-left list-disc list-inside mb-4 text-red-100">
                    <li>Hacé resúmenes automáticos simplemente pasando el PDF.</li>
                    <li>Estudiá con modelos de parcial creados a partir de tu material.</li>
                    <li><strong className="bg-yellow-400 text-red-900 px-1 rounded">PRÓXIMAMENTE:</strong>agregaremos una función para crear PODCAST a partir de tus resúmenes, por si sos más de tocar de oído 🎸.</li>
                </ul>
                <Link to="/premium" onClick={onClose} className="btn btn-outline border-amber-300 text-amber-300 hover:bg-amber-300 hover:text-red-900 mt-4">
                    Ver Beneficios Premium
                </Link>
            </div>

            <p className="text-center font-semibold text-lg mt-8 text-white">
                Todo esto y (posta) mucho más con Estud-IA ✔️
            </p>
        </div>
      </div>
    </Modal>
  );
};

// --- ESTILOS DE SCROLLBAR ACTUALIZADOS PARA ROJO/DORADO ---
const style = document.createElement('style');
style.innerHTML = `
  .custom-scrollbar-rojo::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar-rojo::-webkit-scrollbar-track {
    background: rgba(153, 27, 27, 0.2); /* red-800 con transparencia */
  }
  .custom-scrollbar-rojo::-webkit-scrollbar-thumb {
    background-color: rgba(252, 211, 77, 0.7); /* amber-300 con transparencia */
    border-radius: 10px;
  }
  .custom-scrollbar-rojo::-webkit-scrollbar-thumb:hover {
    background-color: rgba(252, 211, 77, 1); /* amber-300 sólido */
  }
`;
if (!document.getElementById('custom-scrollbar-styles')) {
    style.id = 'custom-scrollbar-styles';
    document.head.appendChild(style);
}

export default BetaAnnouncementModal;