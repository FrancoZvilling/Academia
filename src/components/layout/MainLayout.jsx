import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom"; // Importar useNavigate
import { useAuth } from "../../contexts/AuthContext"; // Importar useAuth
import useConfirm from "../../hooks/useConfirm"; // Importar useConfirm
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import NotificationManager from '../NotificationManager';
import WelcomeModal from "../ui/WelcomeModal";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);


  // --- LÓGICA DEL LOGOUT MOVIDA AQUÍ ---
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [ConfirmationDialog, confirm] = useConfirm();

  useEffect(() => {
    // Verificar si el usuario ya vio el modal de bienvenida
    const hasSeenWelcome = localStorage.getItem('welcomeModalSeen');
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('welcomeModalSeen', 'true');
  };



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

  /* --- MANEJO DEL BOTÓN "ATRÁS" (ANDROID) --- */
  useEffect(() => {
    // Escuchar el evento 'backButton' de Capacitor
    const setupBackButtonListener = async () => {
      const { App } = await import('@capacitor/app');

      App.addListener('backButton', ({ canGoBack }) => {
        if (!isSidebarOpen) {
          // Si el sidebar está cerrado, lo abrimos
          setIsSidebarOpen(true);
        } else {
          // Si el sidebar está abierto, dejamos que el comportamiento por defecto ocurra
          // (o podríamos cerrarlo si quisiéramos togglear, pero el usuario pidió "abrir")
          // Si queremos que ciere, sería: setIsSidebarOpen(false);
          // Pero si el usuario está en el menú y quiere salir de la app o ir atrás en navegación:
          if (canGoBack) {
            // Dejar que el router maneje el 'atrás' si hay historial
            // Ojo: Si el sidebar tapa todo, quizás queramos cerrarlo.
            // Interpretación estricta del usuario: "Quiero que si apretamos el boton 'atras' del celular se abra el navbar"
            // Asumimos que si YA está abierto, el botón atrás debería cerrarlo o hacer lo default.
            // Implemantación segura: Toggle.
            setIsSidebarOpen(false);
          } else {
            // Si no hay más historial, quizás salir de la app.
            // Por seguridad, para cumplir el pedido "abrir", hacemos:
            // Cerrado -> Abrir
            // Abierto -> Cerrar (Toggle standard behavior)
            setIsSidebarOpen(false);
          }
        }
      });
    };
    setupBackButtonListener();

    // Cleanup: Capacitor maneja sus listeners globalmente, pero es buena práctica removerlos si el componente se desmonta.
    // Sin embargo, MainLayout suele ser permanente.
    return () => {
      import('@capacitor/app').then(({ App }) => {
        App.removeAllListeners('backButton');
      });
    };
  }, [isSidebarOpen]); // Dependencia vital: isSidebarOpen para saber el estado actual

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Renderizamos el diálogo aquí, a nivel superior */}
      <ConfirmationDialog />
      <NotificationManager />
      <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseWelcomeModal} />

      <div className="flex h-screen bg-background text-text-primary">
        <div
          className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          {/* Le pasamos la nueva función al Sidebar */}
          <Sidebar onClose={toggleSidebar} />
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