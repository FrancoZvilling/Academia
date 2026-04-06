// src/App.jsx (Código Completo)
import AppRouter from './router/AppRouter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Estilos base de la librería

import { useEffect } from 'react';
import { AdMob } from '@capacitor-community/admob';
import { SubscriptionProvider } from './contexts/SubscriptionContext';

function App() {
  useEffect(() => {
    const initMonetization = async () => {
      try {
        // 1. Inicializar AdMob
        await AdMob.initialize();
        console.log('AdMob inicializado');

        // RevenueCat ahora se inicializa dentro de SubscriptionProvider
      } catch (error) {
        console.error('Error inicializando AdMob:', error);
      }
    };

    initMonetization();
  }, []);

  return (
    <SubscriptionProvider>
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
    </SubscriptionProvider>
  );
}

export default App;


