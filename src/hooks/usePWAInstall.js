import { useState, useEffect } from 'react';

// Guardamos el evento fuera del componente para que persista entre re-renderizados
let deferredPrompt;

const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevenimos el mini-infobar de Chrome en móvil
      e.preventDefault();
      // Guardamos el evento para poder dispararlo más tarde
      deferredPrompt = e;
      // Actualizamos el estado para que nuestro botón aparezca
      setCanInstall(true);
      console.log('`beforeinstallprompt` fue disparado y atrapado.');
    };

    // Si el evento ya se disparó y lo tenemos, actualizamos el estado
    if (deferredPrompt) {
        setCanInstall(true);
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listener para cuando la app ya está instalada
    const handleAppInstalled = () => {
      // Ocultamos el botón de instalación si el usuario acepta
      deferredPrompt = null;
      setCanInstall(false);
      console.log('PWA fue instalada.');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const onInstall = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Mostramos el prompt al usuario
    deferredPrompt.prompt();
    // Esperamos a la elección del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Elección del usuario: ${outcome}`);
    // Solo podemos usar el prompt una vez. Lo reseteamos.
    deferredPrompt = null;
  };

  return { canInstall, onInstall };
};

export default usePWAInstall;