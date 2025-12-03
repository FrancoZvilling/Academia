import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaBook, FaGraduationCap, FaRobot, FaBan, FaArrowRight, FaCrown } from 'react-icons/fa';
import { IoSchool } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';

const WelcomeModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleNext = () => {
        setStep(2);
    };

    const handlePremium = () => {
        onClose();
        navigate('/premium');
    };

    const handleClose = () => {
        onClose();
    };

    // Variantes para animaciones
    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
    };

    const contentVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative w-full max-w-lg bg-surface-100/90 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Decoración de fondo */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 to-secondary/20 blur-3xl -z-10"></div>

                        <div className="p-8">
                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    <motion.div
                                        key="step1"
                                        variants={contentVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="flex flex-col items-center text-center"
                                    >
                                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-3xl text-primary">
                                            👋
                                        </div>
                                        <h2 className="text-2xl font-bold text-text-primary mb-4">Bienvenido a</h2>
                                        <div className="flex items-center justify-center gap-3 text-4xl font-bold text-text-primary mb-6">
                                            <IoSchool className="text-primary" />
                                            <span>Estud-IA</span>
                                        </div>
                                        <p className="text-text-secondary mb-8">Tu agenda universitaria inteligente. Organiza tu vida académica en un solo lugar.</p>

                                        <div className="w-full space-y-4 mb-8 text-left">
                                            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-200/50 border border-surface-300/50">
                                                <div className="mt-1 text-primary"><FaBook /></div>
                                                <div>
                                                    <h3 className="font-bold text-text-primary">Materias</h3>
                                                    <p className="text-xs text-text-secondary">Carga horarios, comisiones y aulas.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-200/50 border border-surface-300/50">
                                                <div className="mt-1 text-primary"><FaCalendarAlt /></div>
                                                <div>
                                                    <h3 className="font-bold text-text-primary">Calendario</h3>
                                                    <p className="text-xs text-text-secondary">Visualiza tus clases y eventos importantes.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-200/50 border border-surface-300/50">
                                                <div className="mt-1 text-primary"><FaGraduationCap /></div>
                                                <div>
                                                    <h3 className="font-bold text-text-primary">Libreta Virtual</h3>
                                                    <p className="text-xs text-text-secondary">Lleva el control de tus notas y promedios.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleNext}
                                            className="btn w-full bg-primary hover:bg-primary/90 border-none text-white rounded-xl text-lg font-bold shadow-lg shadow-primary/25"
                                        >
                                            Siguiente <FaArrowRight className="ml-2" />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="step2"
                                        variants={contentVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="flex flex-col items-center text-center"
                                    >
                                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 text-3xl text-white shadow-lg shadow-orange-500/30">
                                            <FaCrown />
                                        </div>
                                        <h2 className="text-3xl font-bold text-text-primary mb-2">Lleva tu estudio al siguiente nivel</h2>
                                        <p className="text-text-secondary mb-8">Con <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Estud-IA Premium</span> tendrás acceso a herramientas exclusivas.</p>

                                        <div className="w-full space-y-4 mb-8 text-left">
                                            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
                                                <div className="mt-1 text-primary text-xl"><FaRobot /></div>
                                                <div>
                                                    <h3 className="font-bold text-text-primary">Inteligencia Artificial</h3>
                                                    <p className="text-xs text-text-secondary">Resúmenes automáticos y modelos de parcial interactivos.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
                                                <div className="mt-1 text-primary text-xl"><FaBan /></div>
                                                <div>
                                                    <h3 className="font-bold text-text-primary">Sin Anuncios</h3>
                                                    <p className="text-xs text-text-secondary">Disfruta de una experiencia 100% libre de interrupciones.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full space-y-3">
                                            <button
                                                onClick={handlePremium}
                                                className="btn w-full bg-gradient-to-r from-primary to-secondary border-none text-white rounded-xl text-lg font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform"
                                            >
                                                Hacerme Premium
                                            </button>
                                            <button
                                                onClick={handleClose}
                                                className="btn btn-ghost w-full rounded-xl text-text-secondary font-normal hover:bg-surface-200"
                                            >
                                                Quizás más tarde
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Indicador de pasos */}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-200">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "50%" }}
                                animate={{ width: step === 1 ? "50%" : "100%" }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeModal;
