import { FaBars } from 'react-icons/fa';
import InstallPWAButton from '../ui/InstallPWAButton'; // Importamos nuestro nuevo botón
import { IoSchool } from "react-icons/io5"; // Importamos el ícono de la escuela para consistencia
import NotificationBell from '../ui/NotificationBell'; // Importamos el nuevo componente de notificaciones

const Navbar = ({ onMenuClick }) => {
  return (
    // Esta barra solo será visible en pantallas pequeñas (lg:hidden)
    <header className="lg:hidden bg-surface-100 p-2 shadow-md flex items-center justify-between sticky top-0 z-10">
      
      {/* Contenedor Izquierdo: Botón de Menú */}
      <div className="flex-1">
        <button onClick={onMenuClick} className="btn btn-ghost btn-circle">
          <FaBars size={20} />
        </button>
      </div>

      
      
      {/* Contenedor Derecho: Botón de Instalación */}
      <div className="flex-1 flex justify-end">
        <InstallPWAButton />
        <NotificationBell />
      </div>
      

    </header>
  );
};

export default Navbar;