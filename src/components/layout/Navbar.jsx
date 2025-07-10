// src/components/layout/Navbar.jsx (NUEVO ARCHIVO)
import { FaBars } from 'react-icons/fa';

const Navbar = ({ onMenuClick }) => {
  return (
    // Esta barra solo será visible en pantallas pequeñas (lg:hidden)
    <header className="lg:hidden bg-surface-100 p-4 shadow-md flex items-center">
      <button onClick={onMenuClick} className="btn btn-ghost btn-circle">
        <FaBars size={20} />
      </button>
      {/* Podríamos añadir el título de la página aquí si quisiéramos */}
    </header>
  );
};

export default Navbar;