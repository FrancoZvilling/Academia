import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// 1. Importa tu logo. Asegúrate de que la ruta y el nombre del archivo sean correctos.
import logo from '../assets/logo.png'; 

const LoginPage = () => {
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Correo electrónico o contraseña incorrectos.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error. Por favor, inténtalo de nuevo.');
      }
      console.error(err);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError('No se pudo iniciar sesión con Google.');
      console.error(err);
    }
  };

  return (
    // 2. Modificamos el contenedor principal para apilar verticalmente el logo y el formulario.
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">

      {/* 3. AÑADIMOS LA SECCIÓN DEL LOGO */}
      <div className="mb-8">
        <img src={logo} alt="Logo de Estud-IA" className="w-61 h-40" /> {/* Puedes ajustar el tamaño aquí */}
      </div>

      {/* 4. Tu código del formulario se mantiene aquí, sin cambios en sus clases de estilo. */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h1>
        
        {error && <p className="text-red-500 text-center bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="email" 
            placeholder="Correo electrónico" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required 
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required 
          />
          <button type="submit" className="w-full px-4 py-3 text-white font-semibold bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            {isRegistering ? 'Registrarse' : 'Ingresar'}
          </button>
        </form>
        
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          <span className="flex-shrink mx-4 text-gray-400">o</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        <button onClick={handleGoogleLogin} className="w-full px-4 py-3 border flex justify-center items-center gap-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M24 9.5c3.9 0 6.8 1.6 8.4 3.1l6.3-6.3C34.9 2.4 30 .2 24 .2 14.8.2 7.3 5.8 4.2 13.9l7.8 6C13.6 13.5 18.4 9.5 24 9.5z"></path>
              <path fill="#34A853" d="M46.2 25.4c0-1.7-.2-3.4-.5-5H24v9.3h12.5c-.5 3-2.1 5.6-4.6 7.3l7.4 5.7c4.3-4 6.9-10 6.9-17.3z"></path>
              <path fill="#FBBC05" d="M12 28.3c-.5-1.5-.8-3.1-.8-4.8s.3-3.3.8-4.8l-7.8-6C1.5 16.5.2 20.1.2 24s1.3 7.5 4.2 11.4l7.6-5.9z"></path>
              <path fill="#EA4335" d="M24 48c6 0 11.1-2 14.8-5.4l-7.4-5.7c-2 1.3-4.6 2.1-7.4 2.1-5.6 0-10.4-4-12.1-9.5l-7.8 6C7.3 42.2 14.8 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          <span>Continuar con Google</span>
        </button>
        
        <p className="text-center text-sm">
          {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
          <button onClick={() => setIsRegistering(!isRegistering)} className="font-semibold text-blue-500 hover:underline ml-1">
            {isRegistering ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;