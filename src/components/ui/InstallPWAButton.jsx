// src/components/ui/InstallPWAButton.jsx (VERSIÓN SIMPLE Y DIRECTA)
import { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';

const InstallPWAButton = () => {
    const [installPromptEvent, setInstallPromptEvent] = useState(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event) => {
            // Prevenimos que el navegador muestre su propio banner
            event.preventDefault();
            // Guardamos el evento en el estado de nuestro componente
            setInstallPromptEvent(event);
            console.log("Evento 'beforeinstallprompt' capturado y guardado en el estado.");
        };

        // Añadimos el listener
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Limpiamos el listener al desmontar
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPromptEvent) {
            console.log("El prompt de instalación no está disponible.");
            return;
        }
        
        // Mostramos el diálogo de instalación
        installPromptEvent.prompt();
        
        const { outcome } = await installPromptEvent.userChoice;
        
        if (outcome === 'accepted') {
            console.log('El usuario aceptó la instalación.');
        } else {
            console.log('El usuario rechazó la instalación.');
        }
        
        // El prompt solo se puede usar una vez, lo limpiamos
        setInstallPromptEvent(null);
    };

    // El botón se muestra si el evento ha sido capturado en el estado
    if (!installPromptEvent) {
        return null;
    }

    return (
        <button onClick={handleInstallClick} className="btn btn-sm btn-primary ml-auto">
            <FaDownload className="mr-2" />
            Instalar App
        </button>
    );
};

export default InstallPWAButton;