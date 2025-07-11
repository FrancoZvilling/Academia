import { FaBars } from 'react-icons/fa';
import InstallPWAButton from '../ui/InstallPWAButton'; // Importamos nuestro nuevo botón
import { IoSchool } from "react-icons/io5"; // Importamos el ícono de la escuela para consistencia

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

      {/* Contenedor Central: Logo y Nombre */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-2 text-xl font-bold text-text-primary">
            <IoSchool className="text-primary" size={24}/>
            <span>Estud-IA</span>
        </div>
      </div>
      
      {/* Contenedor Derecho: Botón de Instalación */}
      <div className="flex-1 flex justify-end">
        <InstallPWAButton />
      </div>

    </header>
  );
};

export default Navbar;