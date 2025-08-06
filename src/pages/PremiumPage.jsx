import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { FaCheckCircle, FaStar } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import Modal from '../components/ui/Modal';
import emailjs from '@emailjs/browser';

// --- SUB-COMPONENTE: Formulario de Activación ---
const ActivationForm = ({ onFormSubmit }) => {
    const { currentUser } = useAuth();
    const { register, handleSubmit, formState: { isSubmitting } } = useForm({
        defaultValues: {
            user_email_estudia: currentUser?.email,
        }
    });

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <div>
                <label className="label"><span className="label-text text-text-secondary">Email de tu cuenta Estud-IA</span></label>
                <input {...register("user_email_estudia")} readOnly className="input input-bordered w-full bg-surface-200" />
            </div>
            <div>
                <label className="label"><span className="label-text text-text-secondary">Email que usaste en Mercado Pago</span></label>
                <input {...register("user_email_mp", { required: true })} type="email" placeholder="ejemplo@email.com" className="input input-bordered border-black w-full bg-surface-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
            </div>
             <div>
                <label className="label"><span className="label-text text-text-secondary">Nombre y Apellido de Mercado Pago</span></label>
                <input {...register("user_name_mp")} placeholder="Juan Pérez" className="input input-bordered border-black w-full bg-surface-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
            </div>
            
            <button type="submit" className="btn btn-primary bg-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? <span className="loading loading-spinner"></span> : "Enviar Solicitud de Activación"}
            </button>
        </form>
    );
};


// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
const PremiumPage = () => {
    const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
    
    // El handler del botón principal ahora solo abre el modal
    const handleSubscribeClick = () => {
        setIsInstructionsModalOpen(true);
    };

    // Handler para el formulario dentro del modal
    const handleFormSubmit = async (data) => {
        try {
            await emailjs.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID,
                import.meta.env.VITE_EMAILJS_ACTIVATION_TEMPLATE_ID,
                data,
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            );
            toast.success("¡Solicitud enviada! Activaremos tu cuenta en breve. Gracias.");
            setIsInstructionsModalOpen(false);
        } catch (error) {
            console.error("Error al enviar el email de activación:", error);
            toast.error("No se pudo enviar la solicitud. Por favor, contacta al soporte.");
        }
    };
    
    // Handler para el botón de pago dentro del modal
    const redirectToMercadoPago = () => {
        const subscriptionLink = import.meta.env.VITE_MERCADOPAGO_SUB_LINK;
        if (subscriptionLink) {
            window.open(subscriptionLink, '_blank', 'noopener,noreferrer');
        } else {
            toast.error("El link de pago no está configurado.");
        }
    };

    const benefits = [
        "**Resúmenes Automáticos:** Convierte apuntes largos en resúmenes concisos.",
        "**Modelos de Parcial:** Genera exámenes de práctica basados en tu material.",
        "**Acceso Anticipado** a nuevas funcionalidades de IA.",
        "**Aporte a la Facultad:** Un porcentaje de tu pago se invierte en tu educación."
    ];

    return (
        <>
            <div className="max-w-4xl mx-auto p-4 animate-fade-in">
                <div className="text-center mb-12">
                    <FaStar className="mx-auto text-yellow-400 text-5xl mb-4" />
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight">
                        Desbloquea tu Potencial con <span className="text-primary">Estud-IA Premium</span>
                    </h1>
                    <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
                        Lleva tu organización y estudio al siguiente nivel con herramientas de Inteligencia Artificial diseñadas para ti.
                    </p>
                </div>

                <div className="bg-surface-100 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Plan Premium</h2>
                    <p className="text-4xl font-bold text-primary mb-6">
                        $4800 <span className="text-lg font-normal text-text-secondary">/ mes</span>
                    </p>

                    <ul className="space-y-4 text-left mb-8 w-full max-w-md">
                        {benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <FaCheckCircle className="text-green-500 flex-shrink-0 mt-1" />
                                <ReactMarkdown
                                    components={{
                                        p: ({node, ...props}) => <span className="text-text-primary" {...props} />,
                                        strong: ({node, ...props}) => <strong className="font-bold text-text-primary" {...props} />
                                    }}
                                >
                                    {benefit}
                                </ReactMarkdown>
                            </li>
                        ))}
                    </ul>

                    <button 
                        onClick={handleSubscribeClick}
                        className="btn btn-primary btn-lg w-full max-w-md bg-primary text-text-accent shadow-lg hover:bg-secondary"
                    >
                        ¡Hacerme Premium Ahora!
                    </button>

                    <p className="text-xs text-text-secondary mt-2">Cancelación fácil en cualquier momento.</p>
                </div>

                <div className="text-center mt-12 p-6 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">Actualmente en Fase BETA</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                        Al suscribirte ahora, te aseguras de mantener este precio y todas las funcionalidades cuando la aplicación pase a su versión final. ¡Gracias por tu apoyo como usuario pionero!
                    </p>
                </div>
            </div>

            <Modal
                isOpen={isInstructionsModalOpen}
                onClose={() => setIsInstructionsModalOpen(false)}
                title="Sincronización de cuenta (por única vez)"
            >
                <div className="space-y-6">
                    <div>
                        <h3 className="font-bold text-lg text-primary">Paso 1: Realiza el Pago</h3>
                        <p className="text-sm text-text-secondary mt-1 mb-3">Haz clic en el botón para ir a la página segura de Mercado Pago y completar tu suscripción. Luego, vuelve aquí para el Paso 2.</p>
                        <button onClick={redirectToMercadoPago} className="btn btn-secondary bg-primary w-full">
                            Pagar con Mercado Pago
                        </button>
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-lg text-primary">Paso 2: Informa tu Pago</h3>
                        <p className="text-sm text-text-secondary mt-1 mb-3">Una vez completado el pago, llena este formulario para que podamos sincronizar tu cuenta. Esto es solo por tu primera vez, los cobros siguientes serán automáticos.</p>
                        <ActivationForm onFormSubmit={handleFormSubmit} />
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default PremiumPage;