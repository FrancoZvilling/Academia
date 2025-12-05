import { FaBars } from 'react-icons/fa';
import { IoSchool } from "react-icons/io5"; // Importamos el ícono de la escuela para consistencia
import NotificationBell from '../ui/NotificationBell'; // Importamos el nuevo componente de notificaciones
import AdBanner from '../AdBanner'; // Importamos el componente de Banner
import { BannerAdPosition } from '@capacitor-community/admob'; // Importamos la posición

const Navbar = ({ onMenuClick }) => {
  return (
    // Esta barra solo será visible en pantallas pequeñas (lg:hidden)
    <header className="lg:hidden bg-surface-100 shadow-md sticky top-0 z-10 flex flex-col">

      {/* 1. FILA SUPERIOR: Espacio reservado para el Banner (50px de alto mínimo) */}
      <div className="w-full h-[50px] flex justify-center items-center bg-gray-50 dark:bg-gray-800/50">
        {/* El componente AdBanner no renderiza nada visual aquí, pero el plugin nativo usará este espacio */}
        <AdBanner position={BannerAdPosition.TOP_CENTER} />
      </div>

      {/* 2. FILA INFERIOR: Controles de Navegación */}
      <div className="flex items-center justify-between p-2">
        {/* Contenedor Izquierdo: Botón de Menú */}
        <div className="flex-1">
          <button onClick={onMenuClick} className="btn btn-ghost btn-circle">
            <FaBars size={20} />
          </button>
        </div>

        {/* Título Central (Opcional, para balancear) */}
        <div className="flex items-center gap-2 opacity-50">
          <IoSchool size={20} />
          <span className="font-bold text-sm">Estud-IA</span>
        </div>

        {/* Contenedor Derecho: Notificaciones */}
        <div className="flex-1 flex justify-end">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};

export default Navbar;