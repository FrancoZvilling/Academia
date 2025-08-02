// src/components/ui/AIInstructions.jsx (NUEVO ARCHIVO)
import { FaLightbulb, FaExclamationTriangle, FaSave } from 'react-icons/fa';

const AIInstructions = () => {
    return (
        <div className="space-y-4 text-text-secondary">
            <div className="flex items-start gap-4">
                <FaLightbulb className="text-yellow-400 mt-1 flex-shrink-0" size={20} />
                <div>
                    <h3 className="font-bold text-text-primary">Para Mejores Resultados</h3>
                    <p className="text-sm">Para obtener resúmenes más precisos y útiles, te recomendamos subir documentos de un tamaño moderado (por ejemplo, capítulos individuales o apuntes de hasta 50 páginas). La IA trabaja mejor con textos enfocados.</p>
                </div>
            </div>
            
            <div className="flex items-start gap-4">
                <FaExclamationTriangle className="text-orange-400 mt-1 flex-shrink-0" size={20} />
                <div>
                    <h3 className="font-bold text-text-primary">Límites y BETA</h3>
                    <p className="text-sm">Recuerda que esta función está en fase BETA. Si recibes un error, es probable que los servidores de IA estén ocupados. ¡Inténtalo de nuevo en unos minutos! Próximamente, habrá un límite mensual de tokens.</p>
                </div>
            </div>

            <div className="flex items-start gap-4">
                <FaSave className="text-blue-400 mt-1 flex-shrink-0" size={20} />
                <div>
                    <h3 className="font-bold text-text-primary">Guarda tu Resumen</h3>
                    <p className="text-sm">Los resúmenes generados no se guardan automáticamente. Asegúrate de copiar el texto o descargarlo como PDF/Word para no perder tu trabajo al salir o recargar la página.</p>
                </div>
            </div>
        </div>
    );
};

export default AIInstructions;