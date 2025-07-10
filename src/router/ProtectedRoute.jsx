// src/router/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Este componente envuelve las rutas que queremos proteger.
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth(); // Usamos nuestro hook para obtener el usuario

  // Si no hay un usuario logueado, redirigimos a la página de login.
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Si hay un usuario, mostramos el contenido de la ruta.
  return children;
};

export default ProtectedRoute;