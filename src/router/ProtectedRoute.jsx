import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loadingAuth } = useAuth(); // Usamos la variable renombrada

  // Mientras la autenticación está cargando, mostramos un spinner.
  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Una vez que la carga ha terminado, si NO hay usuario, redirigimos a login.
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Si SÍ hay usuario, mostramos el contenido protegido.
  return children;
};

export default ProtectedRoute;