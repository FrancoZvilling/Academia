// src/components/ui/InstallPWAButton.jsx (VERSIÓN FINAL Y FIABLE)
import { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';
import Modal from './Modal'; // Usaremos nuestro modal existente

const InstallPWAButton = () => {
    const [showButton, setShowButton] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Detecta si la app ya se está ejecutando en modo standalone (instalada)
        const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

        // Detecta si el navegador tiene la capacidad de mostrar el prompt (aunque no lo usemos)
        // Esto nos sirve como un buen indicador de compatibilidad.
        const handleBeforeInstallPrompt = () => {
            // No hacemos nada con el evento, solo lo usamos para saber que se puede instalar
            setShowButton(true);
        };

        // Si la app no está instalada, mostramos el botón.
        if (!isAppInstalled) {
            // Como beforeinstallprompt es poco fiable, mostramos el botón en navegadores compatibles
            // que no sean iOS Safari (ya que este tiene un método de instalación diferente).
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

            if (!isIOS || (isIOS && !isSafari)) {
                setShowButton(true);
            }
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    // Si el botón no se debe mostrar, no renderizamos nada
    if (!showButton) {
        return null;
    }

    return (
        <>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-sm btn-primary bg-primary ml-auto">
                <FaDownload className="mr-2" />
                Instalar App
            </button>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="Instalar Estud-IA"
            >
                <div className="prose prose-sm dark:prose-invert max-w-none text-center">
                    <p>Para la mejor experiencia, puedes instalar esta aplicación en tu dispositivo.</p>
                    
                    <h4 className="font-bold mt-4 text-black">En Android (Chrome):</h4>
                    <p>Toca el menú de los tres puntos (⋮) en la esquina superior derecha y selecciona "Agregar a la pantalla principal".</p>
                    
                    <h4 className="font-bold mt-4 text-black">En iOS (Safari):</h4>
                    <p>Toca el ícono de "Compartir" (un cuadrado con una flecha hacia arriba) y luego selecciona "Agregar a la pantalla de inicio".</p>
                    
                    <h4 className="font-bold mt-4 text-black">En Escritorio (Chrome, Edge):</h4>
                    <p>Busca y haz clic en el ícono de instalación (un monitor con una flecha) en la barra de direcciones.</p>
                    
                    <button onClick={() => setIsModalOpen(false)} className="btn btn-primary bg-primary border-primary text-text-accent hover:bg-secondary hover:border-secondary mt-6">Entendido</button>
                </div>
            </Modal>
        </>
    );
};

export default InstallPWAButton;