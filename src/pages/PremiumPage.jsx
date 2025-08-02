import { useState } from 'react';
import { FaCheckCircle, FaStar } from 'react-icons/fa';
import { getFunctions, httpsCallable } from "firebase/functions";
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown'; // Importamos la librería para formato

const PremiumPage = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribe = async () => {
    setIsLoading(true);
    try {
        // --- ¡CORRECCIÓN AQUÍ! ---
        // 1. Obtenemos la instancia de Functions y le especificamos la región
        const functions = getFunctions(undefined, "southamerica-east1");
        
        // 2. Le decimos a httpsCallable dónde encontrar la función
        const createSubscriptionLink = httpsCallable(functions, 'createSubscriptionLink');
        // -------------------------
        
        const result = await createSubscriptionLink();
        const checkoutUrl = result.data.url;
        
        if (checkoutUrl) {
            window.location.href = checkoutUrl;
        } else {
            throw new Error("No se recibió una URL de pago desde el servidor.");
        }

    } catch (error) {
        console.error("Error al obtener el link de suscripción:", error);
        if (error.code === 'functions/internal') {
             toast.error("Hubo un problema en el servidor. Revisa los logs de la Cloud Function.");
        } else {
             toast.error("No se pudo iniciar el proceso de pago. Inténtalo de nuevo.");
        }
        setIsLoading(false);
    }
};

    const benefits = [
        "**Resúmenes Automáticos:** Convierte apuntes largos en resúmenes concisos.",
        "**Modelos de Parcial:** Genera exámenes de práctica basados en tu material.",
        "**Acceso Anticipado** a nuevas funcionalidades de IA.",
        "**Aporte a la Facultad:** Un porcentaje de tu pago se invierte en tu educación."
    ];

    return (
        <div className="max-w-4xl mx-auto p-4 animate-fade-in">
            {/* Encabezado */}
            <div className="text-center mb-12">
                <FaStar className="mx-auto text-yellow-400 text-5xl mb-4" />
                <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight">
                    Desbloquea tu Potencial con <span className="text-primary">Estud-IA Premium</span>
                </h1>
                <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
                    Lleva tu organización y estudio al siguiente nivel con herramientas de Inteligencia Artificial diseñadas para ti.
                </p>
            </div>

            {/* Tarjeta Principal de Beneficios y Precio */}
            <div className="bg-surface-100 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Plan Premium</h2>
                <p className="text-4xl font-bold text-primary mb-6">
                    $4800 <span className="text-lg font-normal text-text-secondary">/ mes</span>
                </p>

                <ul className="space-y-4 text-left mb-8 w-full max-w-md">
                    {benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <FaCheckCircle className="text-green-500 flex-shrink-0 mt-1" />
                            {/* --- CORRECCIÓN DE FORMATO AQUÍ --- */}
                            <ReactMarkdown
                                components={{
                                    // Esto asegura que el texto se renderice dentro de un <span> en lugar de un <p>
                                    p: ({node, ...props}) => <span className="text-text-primary" {...props} />,
                                    // Esto asegura que el texto en negrita use nuestra clase de color
                                    strong: ({node, ...props}) => <strong className="font-bold text-text-primary" {...props} />
                                }}
                            >
                                {benefit}
                            </ReactMarkdown>
                        </li>
                    ))}
                </ul>

                <button 
                    onClick={handleSubscribe}
                    className="btn btn-primary btn-lg w-full max-w-md bg-primary text-text-accent shadow-lg hover:bg-secondary"
                    disabled={isLoading}
                >
                    {isLoading ? <span className="loading loading-spinner"></span> : '¡Hacerme Premium Ahora!'}
                </button>

                <p className="text-xs text-text-secondary mt-2">Cancelación fácil en cualquier momento.</p>
            </div>

            {/* Sección de Aclaración BETA */}
            <div className="text-center mt-12 p-6 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Actualmente en Fase BETA</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                    Al suscribirte ahora, te aseguras de mantener este precio y todas las funcionalidades cuando la aplicación pase a su versión final. ¡Gracias por tu apoyo como usuario pionero!
                </p>
            </div>
        </div>
    );
};

export default PremiumPage;