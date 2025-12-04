// src/App.jsx (Código Completo)
import AppRouter from './router/AppRouter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Estilos base de la librería

import { useEffect } from 'react';
import { AdMob } from '@capacitor-community/admob';
import { Purchases } from '@revenuecat/purchases-capacitor';

function App() {
  useEffect(() => {
    const initMonetization = async () => {
      try {
        // 1. Inicializar AdMob
        await AdMob.initialize();
        console.log('AdMob inicializado');

        // 2. Inicializar RevenueCat (Placeholder)
        // Nota: Usamos una key falsa por ahora para que compile, pero NO funcionará hasta poner la real.
        // En producción, esto debe venir de una variable de entorno o configuración segura.
        await Purchases.configure({ apiKey: "appl_placeholder_key" });
        console.log('RevenueCat configurado (Placeholder)');

      } catch (error) {
        console.error('Error inicializando monetización:', error);
      }
    };

    initMonetization();
  }, []);

  return (
    <div className="bg-background min-h-screen text-text-primary transition-colors duration-300">
      <AppRouter />

      {/* Este componente es invisible hasta que se llama a una notificación */}
      <ToastContainer
        position="bottom-right"
        autoClose={4000} // Las notificaciones se cierran solas a los 4 segundos
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default App;


