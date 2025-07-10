import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom"; // Importar useNavigate
import { useAuth } from "../../contexts/AuthContext"; // Importar useAuth
import useConfirm from "../../hooks/useConfirm"; // Importar useConfirm
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // --- LÓGICA DEL LOGOUT MOVIDA AQUÍ ---
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [ConfirmationDialog, confirm] = useConfirm();

  const handleConfirmLogout = async () => {
    const result = await confirm(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar tu sesión?'
    );

    if (result) {
      try {
        await logout();
        navigate("/login");
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
        alert("No se pudo cerrar la sesión.");
      }
    }
  };
  // -------------------------------------

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Renderizamos el diálogo aquí, a nivel superior */}
      <ConfirmationDialog />
      <div className="flex h-screen bg-background text-text-primary">
        <div 
          className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Le pasamos la nueva función al Sidebar */}
          <Sidebar onClose={toggleSidebar} onConfirmLogout={handleConfirmLogout} />
        </div>

        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={toggleSidebar}
          ></div>
        )}

        <div className="flex flex-1 flex-col">
          <Navbar onMenuClick={toggleSidebar} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default MainLayout;