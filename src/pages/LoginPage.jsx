import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import Modal from '../components/ui/Modal';
import TermsContent from '../components/TermsContent';
import { FaEnvelope, FaLock, FaGoogle, FaUser, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [view, setView] = useState('login');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (view === 'register' && !acceptedTerms) {
      setError('Debes aceptar los términos y condiciones para registrarte.');
      return;
    }
    try {
      if (view === 'register') {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') { setError('Este correo electrónico ya está registrado.'); }
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') { setError('Correo electrónico o contraseña incorrectos.'); }
      else if (err.code === 'auth/weak-password') { setError('La contraseña debe tener al menos 6 caracteres.'); }
      else { setError('Ocurrió un error. Por favor, inténtalo de nuevo.'); }
      console.error(err);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await resetPassword(email);
      setMessage('¡Revisa tu correo! Te hemos enviado un enlace para restablecer tu contraseña.');
      setView('login');
    } catch (err) {
      setError('No se pudo enviar el correo. Verifica que el email sea correcto.');
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
    <>
      <div className="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-background p-6 transition-colors duration-300">

        <div className="w-full max-w-md bg-surface-100 dark:bg-surface-100 rounded-3xl shadow-2xl p-8 space-y-8 relative overflow-hidden">

          {/* Decoración de fondo (círculos difusos) */}
          <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-[-50px] right-[-50px] w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* Logo y Encabezado */}
          <div className="flex flex-col items-center space-y-4">
            <img src={logo} alt="Logo de Estud-IA" className="w-24 h-24 object-contain drop-shadow-md" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                {view === 'login' && '¡Hola de nuevo!'}
                {view === 'register' && 'Crea tu cuenta'}
                {view === 'reset' && 'Recuperar Cuenta'}
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                {view === 'login' && 'Ingresa tus datos para continuar'}
                {view === 'register' && 'Únete a la comunidad de Estud-IA'}
                {view === 'reset' && 'Ingresa tu email para restablecer'}
              </p>
            </div>
          </div>

          {/* Mensajes de Error/Éxito */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center animate-pulse">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-3 rounded-xl text-sm text-center">
              {message}
            </div>
          )}

          {/* Formularios */}
          {(view === 'login' || view === 'register') && (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Input Email */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-surface-50 dark:bg-surface-200 border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none transition-all text-text-primary placeholder-text-secondary/70"
                  required
                />
              </div>

              {/* Input Password */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                  <FaLock />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 bg-surface-50 dark:bg-surface-200 border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none transition-all text-text-primary placeholder-text-secondary/70"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Checkbox Términos (Registro) */}
              {view === 'register' && (
                <div className="flex items-center gap-3 px-1">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="checkbox checkbox-sm checkbox-primary rounded-md"
                  />
                  <label htmlFor="terms" className="text-xs text-text-secondary cursor-pointer select-none">
                    Acepto los{' '}
                    <button
                      type="button"
                      onClick={() => setIsTermsModalOpen(true)}
                      className="font-bold text-primary hover:underline"
                    >
                      Términos y Condiciones
                    </button>
                  </label>
                </div>
              )}

              {/* Botón Principal */}
              <button
                type="submit"
                className="w-full py-3.5 bg-primary hover:bg-secondary text-white font-bold rounded-full shadow-lg shadow-primary/30 transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                disabled={view === 'register' && !acceptedTerms}
              >
                <span>{view === 'register' ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
                <FaArrowRight className="text-sm" />
              </button>
            </form>
          )}

          {/* Formulario Reset Password */}
          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-surface-50 dark:bg-surface-200 border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none transition-all text-text-primary placeholder-text-secondary/70"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-primary hover:bg-secondary text-white font-bold rounded-full shadow-lg shadow-primary/30 transform active:scale-[0.98] transition-all duration-200"
              >
                Enviar Enlace
              </button>
            </form>
          )}

          {/* Separador */}
          {(view === 'login' || view === 'register') && (
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-wider">O continúa con</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>
          )}

          {/* Botón Google */}
          {(view === 'login' || view === 'register') && (
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 bg-white dark:bg-surface-200 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:shadow-md transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 group"
            >
              <FaGoogle className="text-red-500 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-gray-700 dark:text-gray-200">Google</span>
            </button>
          )}

          {/* Footer (Switch View) */}
          <div className="text-center pt-2">
            <p className="text-sm text-text-secondary">
              {view === 'login' && '¿No tienes cuenta?'}
              {view === 'register' && '¿Ya tienes cuenta?'}
              {view === 'reset' && '¿Ya recordaste tu contraseña?'}
              <button
                onClick={() => setView(view === 'login' ? 'register' : 'login')}
                className="font-bold text-primary hover:text-secondary ml-1 transition-colors"
              >
                {view === 'login' && 'Regístrate aquí'}
                {view === 'register' && 'Inicia sesión'}
                {view === 'reset' && 'Volver al login'}
              </button>
            </p>

            {view === 'login' && (
              <button
                onClick={() => setView('reset')}
                className="mt-4 text-xs font-medium text-text-secondary hover:text-primary transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Modal Términos */}
      <Modal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        title="Términos y Condiciones"
      >
        <div className="max-h-[60vh] overflow-y-auto p-1 pr-4">
          <TermsContent />
        </div>
      </Modal>
    </>
  );
};

export default LoginPage;