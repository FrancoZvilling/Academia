// src/hooks/usePWAInstall.js
import { useState, useEffect } from 'react';

const usePWAInstall = () => {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Detecta si la app ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (event) => {
      // Previene que el navegador muestre su propio popup de instalación
      event.preventDefault();
      // Guarda el evento para que podamos dispararlo más tarde
      setInstallPromptEvent(event);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Limpia el listener cuando el componente se desmonta
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      // Si no hay evento, no se puede instalar (ya se instaló, o el navegador no es compatible)
      return;
    }
    // Muestra el prompt de instalación nativo del navegador
    installPromptEvent.prompt();
    // Espera a que el usuario responda
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      console.log('El usuario aceptó la instalación');
    } else {
      console.log('El usuario rechazó la instalación');
    }
    // El prompt solo se puede usar una vez, así que lo limpiamos
    setInstallPromptEvent(null);
  };

  // Devolvemos la capacidad de instalar y la función para hacerlo
  return { canInstall: !isAppInstalled && installPromptEvent !== null, onInstall: handleInstallClick };
};

export default usePWAInstall;