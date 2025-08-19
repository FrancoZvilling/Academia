import { NavLink, useNavigate, useLocation } from "react-router-dom"; // Añadimos useLocation
import { useAuth } from "../../contexts/AuthContext";
import ThemeSwitcher from "../ui/ThemeSwitcher";
import useConfirm from "../../hooks/useConfirm";

import { FaTachometerAlt, FaCalendarAlt, FaUserCircle, FaSignOutAlt, FaRegCalendarAlt, FaBookOpen, FaTimes, FaRobot, FaEnvelope, FaStar, FaBell } from "react-icons/fa";
import { IoSchool } from "react-icons/io5";

const Sidebar = ({ onMenuClick, onConfirmLogout }) => {
  const { currentUser } = useAuth();
  const location = useLocation(); // Hook para obtener la ruta actual

  // Esta función ya la tenías, la usaremos para todos los NavLink
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
        <button onClick={onMenuClick} className="btn btn-ghost btn-circle lg:hidden">
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

      {/* --- CÓDIGO CORREGIDO Y SIMPLIFICADO --- */}
      {/* 1. Cambiamos 'mt-10' por 'mt-6' para reducir el espacio */}
      {/* 2. Aplicamos 'getNavLinkClass' a TODOS los enlaces para unificar el código */}
      <nav onClick={onMenuClick} className="flex-grow mt-6 space-y-2">
        <NavLink to="/dashboard" className={getNavLinkClass}><FaTachometerAlt /><span>Mis Materias</span></NavLink>
        <NavLink to="/calendario" className={getNavLinkClass}><FaCalendarAlt /><span>Calendario</span></NavLink>
        <NavLink to="/eventos" className={getNavLinkClass}><FaRegCalendarAlt /><span>Eventos Generales</span></NavLink>
        <NavLink to="/libreta" className={getNavLinkClass}><FaBookOpen /><span>Mi Libreta</span></NavLink>
        
        {/* Usamos el location.pathname para que el estilo activo funcione con las clases extra */}
        <NavLink to="/premium" className={`${getNavLinkClass({ isActive: location.pathname === '/premium' })} text-yellow-500 border border-yellow-500/50`}>
            <FaStar />
            <span>Premium</span>
        </NavLink>
        
        <NavLink to="/ia" className={getNavLinkClass}><FaRobot /><span>Inteligencia Artificial</span></NavLink>
        
        <NavLink to="/notificaciones" className={`hidden lg:flex ${getNavLinkClass({ isActive: location.pathname === '/notificaciones' })}`}>
            <FaBell />
            <span>Notificaciones</span>
        </NavLink>
        
        <NavLink to="/contacto" className={getNavLinkClass}><FaEnvelope /><span>Contacto</span></NavLink>
        <NavLink to="/perfil" className={getNavLinkClass}><FaUserCircle /><span>Mi Perfil</span></NavLink>
      </nav>
      {/* ------------------------------------------- */}

      <div className="mt-auto space-y-4">
        <ThemeSwitcher />
        {/* El botón de cerrar sesión se ha movido a MainLayout */}
      </div>
    </aside>
  );
};

export default Sidebar;