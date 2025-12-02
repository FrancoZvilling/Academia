import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { FaCheckCircle, FaStar, FaCrown, FaRocket } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import Modal from '../components/ui/Modal';
import emailjs from '@emailjs/browser';
import { getFunctions, httpsCallable } from "firebase/functions";
import { motion } from 'framer-motion';

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
const PremiumPage = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribeClick = async () => {
        setIsLoading(true);
        // TODO: Implementar lógica de suscripción con Google Play
        console.log("Iniciando flujo de suscripción con Google Play...");

        // Simulación temporal
        setTimeout(() => {
            setIsLoading(false);
            toast.info("La integración con Google Play estará disponible pronto.");
        }, 1000);
    };

    const benefits = [
        "**Resúmenes Automáticos:** Convierte apuntes largos en resúmenes concisos.",
        "**Modelos de Parcial:** Genera exámenes de práctica basados en tu material.",
        "Elimina completamente los anuncios de la aplicación"
    ];

    return (
        <>
            <div className="max-w-6xl mx-auto p-4 lg:p-8">
                {/* Hero Section */}
                <div className="text-center mb-16 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10"></div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4 border border-primary/20">
                            <FaCrown className="inline mr-2 mb-1" />
                            Experiencia Premium
                        </span>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary tracking-tight mb-6">
                            Lleva tu estudio al <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">siguiente nivel</span>
                        </h1>
                        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                            Elimina todos los anuncios y desbloquea herramientas de Inteligencia Artificial diseñadas para potenciar tu aprendizaje.
                        </p>
                    </motion.div>
                </div>

                {/* Pricing Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-md mx-auto"
                >
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-surface-100 rounded-2xl p-8 shadow-xl border border-surface-200">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-text-primary">Plan Estudiante</h3>
                                    <p className="text-text-secondary text-sm mt-1">Todo lo que necesitas para aprobar</p>
                                </div>
                                <div className="bg-primary/10 p-3 rounded-xl">
                                    <FaRocket className="text-primary text-xl" />
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline justify-center">
                                    <span className="text-5xl font-extrabold text-text-primary">$5500</span>
                                    <span className="text-text-secondary ml-2">/ mes</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-200/50 transition-colors">
                                        <div className="mt-1 bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                                            <FaCheckCircle className="text-green-500 text-sm" />
                                        </div>
                                        <div className="text-sm text-text-primary">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ node, ...props }) => <span {...props} />,
                                                    strong: ({ node, ...props }) => <span className="font-bold text-primary" {...props} />
                                                }}
                                            >
                                                {benefit}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSubscribeClick}
                                className="btn w-full bg-gradient-to-r from-primary to-secondary border-none text-white shadow-lg hover:shadow-primary/25 hover:scale-[1.02] transition-all duration-300 py-4 h-auto text-lg font-bold rounded-xl"
                                disabled={isLoading}
                            >
                                {isLoading ? <span className="loading loading-spinner"></span> : 'Obtener Premium'}
                            </button>

                            <p className="text-center text-xs text-text-secondary mt-4">
                                Cancelación fácil en cualquier momento
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Trust Indicators / Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-16 text-center grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
                >
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-surface-200 rounded-full flex items-center justify-center mb-3 text-2xl">🔒</div>
                        <h4 className="font-bold text-text-primary">Pago Seguro</h4>
                        <p className="text-xs text-text-secondary mt-1">Procesado por Google Play</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-surface-200 rounded-full flex items-center justify-center mb-3 text-2xl">⚡</div>
                        <h4 className="font-bold text-text-primary">Activación Rápida</h4>
                        <p className="text-xs text-text-secondary mt-1">Acceso inmediato a las funciones</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-surface-200 rounded-full flex items-center justify-center mb-3 text-2xl">🤝</div>
                        <h4 className="font-bold text-text-primary">Soporte Directo</h4>
                        <p className="text-xs text-text-secondary mt-1">Ayuda personalizada por WhatsApp</p>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default PremiumPage;