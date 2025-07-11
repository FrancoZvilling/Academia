import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import Modal from '../components/ui/Modal';
import TermsContent from '../components/TermsContent';

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
      <div className="flex flex-col items-center justify-start min-h-screen bg-background p-4 pt-20 pb-8">
        <div className="mb-8">
          <img src={logo} alt="Logo de Estud-IA" className="w-61 h-40" />
        </div>

        <div className="w-full max-w-md p-8 space-y-6 bg-surface-100 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold text-center text-text-primary">
            {view === 'login' && 'Iniciar Sesión'}
            {view === 'register' && 'Crear Cuenta'}
            {view === 'reset' && 'Restablecer Contraseña'}
          </h1>

          {error && <p className="text-red-500 text-center bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
          {message && <p className="text-green-500 text-center bg-green-100 dark:bg-green-900/50 p-3 rounded-md">{message}</p>}

          {(view === 'login' || view === 'register') && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              
              {/* --- CORRECCIÓN 2: Checkbox de Términos con mejor estilo --- */}
              {view === 'register' && (
                <div className="flex items-center gap-2">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="checkbox checkbox-sm border-gray-400 dark:border-gray-500 checked:bg-primary"
                  />
                  <label htmlFor="terms" className="text-sm text-text-secondary">
                    Acepto los{' '}
                    <button
                      type="button"
                      onClick={() => setIsTermsModalOpen(true)}
                      className="font-semibold text-primary hover:underline"
                    >
                      Términos y Condiciones
                    </button>
                  </label>
                </div>
              )}

              {/* --- CORRECCIÓN 1: Botón de Ingresar/Registrarse con estilo sólido --- */}
              <button
                type="submit"
                className="btn btn-primary bg-primary border-primary text-text-accent hover:bg-secondary hover:border-secondary w-full py-3 h-auto text-base"
                disabled={view === 'register' && !acceptedTerms}
              >
                {view === 'register' ? 'Registrarse' : 'Ingresar'}
              </button>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">Introduce tu correo electrónico y te enviaremos un enlace para recuperar tu cuenta.</p>
              <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <button type="submit" className="w-full px-4 py-3 text-white font-semibold bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Enviar Correo</button>
            </form>
          )}

          {view === 'login' && (
            <div className="text-center text-sm">
              <button onClick={() => setView('reset')} className="font-semibold text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {(view === 'login' || view === 'register') && (
            <>
              <div className="relative flex items-center"><div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div><span className="flex-shrink mx-4 text-gray-400">o</span><div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div></div>
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
            </>
          )}

          <p className="text-center text-sm">
            {view === 'login' && '¿No tienes una cuenta?'}
            {view === 'register' && '¿Ya tienes una cuenta?'}
            {view === 'reset' && '¿Ya recordaste tu contraseña?'}
            <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="font-semibold text-primary hover:underline ml-1">
              {view === 'login' && 'Regístrate'}
              {view === 'register' && 'Inicia sesión'}
              {view === 'reset' && 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>

      {/* --- CORRECCIÓN 3: Modal con scroll y estilos --- */}
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