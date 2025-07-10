// src/App.jsx (Código Completo)
import AppRouter from './router/AppRouter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Estilos base de la librería

function App() {
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


