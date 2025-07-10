// src/components/NotesEditor.jsx (VERSIÓN FINAL CORREGIDA)
import { useState, useCallback, useEffect } from 'react';
import debounce from 'lodash.debounce';

const NotesEditor = ({ content, onContentChange }) => {
    // 1. Estado local para una respuesta de UI instantánea
    const [localContent, setLocalContent] = useState(content || '');
    
    const [status, setStatus] = useState('Sincronizado');

    const debouncedSaveChanges = useCallback(
        debounce(async (newContent) => {
            const success = await onContentChange(newContent);
            if (success) {
                setStatus('Sincronizado');
            } else {
                setStatus('Error');
            }
        }, 1500),
        [onContentChange]
    );

    const handleTextChange = (e) => {
        // 2. Actualizamos el estado local al instante
        setLocalContent(e.target.value);
        setStatus('Guardando...');
        // 3. Pasamos el nuevo valor a la función debounced
        debouncedSaveChanges(e.target.value);
    };

    // 4. Sincronizamos el estado local si la prop del padre cambia
    //    Esto es importante para cuando se cargan los datos por primera vez
    //    o si se implementara una función de "deshacer".
    useEffect(() => {
        setLocalContent(content || '');
    }, [content]);

    const getStatusColor = () => {
        if (status === 'Guardando...') return 'text-yellow-500';
        if (status === 'Sincronizado') return 'text-green-500';
        if (status === 'Error') return 'text-red-500';
        return 'text-text-secondary';
    };

    return (
        <div className="p-2 relative flex flex-col h-[500px]">
            <textarea
                value={localContent} // Usamos el estado local para el valor
                onChange={handleTextChange}
                placeholder="Empieza a escribir tus apuntes aquí... Los cambios se guardan automáticamente."
                className="w-full flex-grow p-4 bg-surface-100 dark:bg-gray-800/50 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-shadow"
            />
            <div className={`text-right text-xs font-semibold italic mt-2 h-4 ${getStatusColor()}`}>
                {status}
            </div>
        </div>
    );
};

export default NotesEditor;