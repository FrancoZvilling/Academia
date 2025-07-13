import { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';
import Modal from './Modal';

const InstallPWAButton = () => {
    const [isAppInstalled, setIsAppInstalled] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // La única comprobación que necesitamos: ¿la app ya se está ejecutando como una ventana independiente?
        const installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        
        if (installed) {
            setIsAppInstalled(true);
        }
    }, []);

    // Si la app ya está instalada, no renderizamos nada.
    if (isAppInstalled) {
        return null;
    }

    // Si no está instalada, SIEMPRE mostramos el botón.
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
                {/* Usamos exactamente tu estructura y clases de estilo */}
                <div className="text-center space-y-4">
                    <p className="text-text-secondary">
                        Para la mejor experiencia, puedes instalar esta aplicación en tu dispositivo.
                    </p>
                    
                    <div>
                        <h4 className="font-bold text-text-primary">En Android (Chrome):</h4>
                        <p className="text-text-secondary text-sm">
                            Toca el menú de los tres puntos (⋮) en la esquina superior derecha y selecciona "Agregar a la pantalla principal".
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-text-primary">En iOS (Safari):</h4>
                        <p className="text-text-secondary text-sm">
                            Toca el ícono de "Compartir" (un cuadrado con una flecha) y luego selecciona "Agregar a la pantalla de inicio".
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-text-primary">En Escritorio (Chrome, Edge):</h4>
                        <p className="text-text-secondary text-sm">
                            Busca y haz clic en el ícono de instalación (un monitor con una flecha) en la barra de direcciones.
                        </p>
                    </div>
                    
                    <button onClick={() => setIsModalOpen(false)} className="btn btn-primary bg-primary border-primary text-text-accent hover:bg-secondary hover:border-secondary mt-6">Entendido</button>
                </div>
            </Modal>
        </>
    );
};

export default InstallPWAButton;