// src/pages/ContactPage.jsx (NUEVO ARCHIVO)
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import emailjs from '@emailjs/browser';
import { toast } from 'react-toastify';
import { useRef, useState } from 'react';
import { FaWhatsapp, FaEnvelope } from 'react-icons/fa';

const ContactPage = () => {
    const { currentUser } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            from_name: currentUser?.displayName || '',
            subject: 'Contacto desde Estud-IA',
            user_email: currentUser?.email || ''
        }
    });
    const form = useRef();
    const [isSending, setIsSending] = useState(false);

    const sendEmail = async (data) => {
        setIsSending(true);
        try {
            await emailjs.sendForm(
                import.meta.env.VITE_EMAILJS_SERVICE_ID, 
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID, 
                form.current, 
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            );
            toast.success("¡Mensaje enviado con éxito! Gracias por tu contacto.");
        } catch (error) {
            console.error('FAILED...', error);
            toast.error("Hubo un error al enviar el mensaje. Inténtalo de nuevo.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Contacto</h1>
            <p className="text-text-secondary mb-8">Cualquier duda, sugerencia o inquietud que tengas, podés enviarla a través de este formulario:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Columna del Formulario */}
                <div className="bg-surface-100 p-6 rounded-lg shadow-md">
                    <form ref={form} onSubmit={handleSubmit(sendEmail)} className="space-y-4">
                        <div>
                            <label htmlFor="from_name" className="label"><span className="label-text">Tu Nombre y Apellido</span></label>
                            <input id="from_name" {...register("from_name", { required: true })} className="input input-bordered w-full" />
                        </div>
                        <div>
                            <label htmlFor="subject" className="label"><span className="label-text">Asunto</span></label>
                            <input id="subject" {...register("subject")} readOnly className="input input-bordered w-full bg-surface-200" />
                        </div>
                        <div>
                            <label htmlFor="message" className="label"><span className="label-text">Mensaje</span></label>
                            <textarea id="message" {...register("message", { required: true })} className="textarea textarea-bordered w-full h-32" placeholder="Escribe tu mensaje aquí..."></textarea>
                        </div>
                        {/* Campo oculto para enviar el email del usuario */}
                        <input type="hidden" {...register("user_email")} />
                        
                        <button type="submit" className="btn btn-primary w-full bg-primary border-primary text-text-accent hover:bg-secondary" disabled={isSending}>
                            {isSending ? <span className="loading loading-spinner"></span> : 'Enviar Mensaje'}
                        </button>
                    </form>
                </div>

                {/* Columna de Información Adicional */}
                <div className="flex flex-col justify-center">
                    <div className="bg-surface-100 p-6 rounded-lg shadow-md">
                        <h3 className="font-bold text-lg mb-4">Otras vías de contacto</h3>
                        <p className="text-text-secondary mb-4">Si preferís contactarte directamente con el desarrollador de esta web, podés hacerlo a través de:</p>
                        <div className="space-y-3">
                            <a href="https://wa.me/5493541315119" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-text-primary hover:text-primary transition-colors">
                                <FaWhatsapp className="text-green-500" size={20}/>
                                <span>+54 9 3541 31-5119</span>
                            </a>
                            <a href="mailto:francozvilling-programador@hotmail.com" className="flex items-center gap-3 text-text-primary hover:text-primary transition-colors">
                                <FaEnvelope className="text-text-secondary" size={20}/>
                                <span>francozvilling-programador@hotmail.com</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;