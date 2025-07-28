import { NavLink } from "react-router-dom";
import ThemeSwitcher from "../ui/ThemeSwitcher";

import { FaTachometerAlt, FaCalendarAlt, FaUserCircle, FaSignOutAlt, FaRegCalendarAlt, FaBookOpen, FaTimes, FaRobot } from "react-icons/fa";
import { IoSchool } from "react-icons/io5";
import { useAuth } from "../../contexts/AuthContext";
import { FaEnvelope } from "react-icons/fa";

// El componente ahora recibe 'onClose' (para el menú móvil) y 'onConfirmLogout' (para el botón)
const Sidebar = ({ onClose, onConfirmLogout }) => {
  const { currentUser } = useAuth();

  const getNavLinkClass = ({ isActive }) => {
    const baseClasses = "flex items-center gap-3 py-2 px-4 rounded-lg font-semibold transition-all duration-200";
    if (isActive) {
      return `${baseClasses} bg-primary text-text-accent shadow-lg`;
    }
    return `${baseClasses} text-text-secondary hover:bg-surface-200 hover:text-text-primary`;
  };

  return (
    <aside className="w-64 h-full flex-shrink-0 bg-surface-100 p-4 flex flex-col shadow-lg border-r border-surface-200">
      <div className="flex justify-between items-center py-4">
        <div className="text-2xl font-bold flex items-center justify-center gap-2 text-text-primary">
          <IoSchool className="text-primary" size={28}/>
          <span>Estud-IA</span>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-circle lg:hidden">
          <FaTimes />
        </button>
      </div>

      <div className="mt-8 flex flex-col items-center text-center">
        <img
          src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.email}&background=random`}
          alt="User Avatar"
          className="w-24 h-24 rounded-full object-cover border-4 border-primary/50"
        />
        <span className="mt-4 font-bold text-lg text-text-primary break-all">
          {currentUser?.displayName || currentUser?.email}
        </span>
      </div>

      {/* Al hacer clic en la navegación, se cierra el menú en móvil */}
      <nav onClick={onClose} className="flex-grow mt-10 space-y-2">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "flex items-center gap-3 py-2 px-4 rounded-lg font-semibold transition-all duration-200 bg-primary text-text-accent shadow-lg" : "flex items-center gap-3 py-2 px-4 rounded-lg font-semibold transition-all duration-200 text-text-secondary hover:bg-surface-200 hover:text-text-primary"}>
          <FaTachometerAlt />
          <span>Mis Materias</span>
        </NavLink>
        <NavLink to="/calendario" className={({ isActive }) => isActive ? "flex items-center gap-3 py-2 px-4 rounded-lg font-semibold transition-all duration-200 bg-primary text-text-accent shadow-lg" : "flex items-center gap-3 py-2 px-4 rounded-lg font-semibold transition-all duration-200 text-text-secondary hover:bg-surface-200 hover:text-text-primary"}>
          <FaCalendarAlt />
          <span>Calendario</span>
        </NavLink>
        <NavLink to="/eventos" className={({ isActive }) => isActive ? "flex items-center gap-3 py-2 px-4 rounded-lg font-semibold transition-all duration-200 bg-primary text-text-accent shadow-lg" : "flex items-center gap-3 py-2 px-4 rounded-lg font-semibold transition-all duration-200 text-text-secondary hover:bg-surface-200 hover:text-text-primary"}> 
          <FaRegCalendarAlt />
          <span>Eventos Generales</span>
        </NavLink>
        <NavLink to="/libreta" className={({ isActive }) => isActive ? "flex items-center gap-3 py-2 px-4 rounded-lg font-semibold transition-all duration-200 bg-primary text-text-accent shadow-lg" : "flex items-center gap-3 py-2 px-4 rounded-lg font-semibold transition-all duration-200 text-text-secondary hover:bg-surface-200 hover:text-text-primary"}>
          <FaBookOpen />
          <span>Mi Libreta</span>
        </NavLink>
        <NavLink to="/ia" className={getNavLinkClass}>
            <FaRobot />
            <span>Inteligencia Artificial</span>
          </NavLink>
        <NavLink to="/contacto" className={getNavLinkClass}> {/* <-- Añadir enlace */}
          <FaEnvelope />
          <span>Contacto</span>
        </NavLink>
        <NavLink to="/perfil" className={({ isActive }) => isActive ? "flex items-center gap-3 py-2 px-4 rounded-lg font-semibold transition-all duration-200 bg-primary text-text-accent shadow-lg" : "flex items-center gap-3 py-2 px-4 rounded-lg font-semibold transition-all duration-200 text-text-secondary hover:bg-surface-200 hover:text-text-primary"}>
          <FaUserCircle />
          <span>Mi Perfil</span>
        </NavLink>
      </nav>

      <div className="mt-auto space-y-4">
        <ThemeSwitcher />
      </div>
    </aside>
  );
};

export default Sidebar;