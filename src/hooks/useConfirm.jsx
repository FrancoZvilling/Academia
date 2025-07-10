import { useState } from 'react';
import Modal from '../components/ui/Modal';

const useConfirm = () => {
    const [promise, setPromise] = useState(null);

    const confirm = (title, message) => {
        return new Promise((resolve, reject) => {
            setPromise({ resolve, title, message });
        });
    };

    const handleClose = () => {
        setPromise(null);
    };

    const handleConfirm = () => {
        promise?.resolve(true);
        handleClose();
    };

    const handleCancel = () => {
        promise?.resolve(false);
        handleClose();
    };

    const ConfirmationDialog = () => (
        <Modal 
            isOpen={promise !== null} 
            onClose={handleCancel} 
            title={promise?.title || 'Confirmar Acción'}
            showCloseButton={false} 
        >
            <div>
                <p className="text-text-secondary mb-8 text-center">{promise?.message}</p>
                
                {/* --- ¡AQUÍ ESTÁ LA CORRECCIÓN! --- */}
                {/* 
                    Cambiamos 'sm:justify-end' por 'sm:justify-center'
                    Y añadimos 'justify-center' para que también se aplique en móvil.
                */}
                <div className="flex flex-col-reverse sm:flex-row justify-center gap-3">
                    <button onClick={handleConfirm} className="btn btn-error w-full sm:w-auto">
                        Sí, Confirmar
                    </button>
                    <button onClick={handleCancel} className="btn btn-ghost w-full sm:w-auto">
                        Cancelar
                    </button>
                </div>
            </div>
        </Modal>
    );

    return [ConfirmationDialog, confirm];
};

export default useConfirm;