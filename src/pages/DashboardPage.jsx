import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import {
    getYearsForUser,
    addYearForUser,
    deleteYear,
    addSubjectToYear,
    getSubjectsForYear,
    deleteSubject,
    updateYearName
} from '../services/firestoreService';
import { subjectColors } from '../config/colors';
import { toast } from 'react-toastify';
import useConfirm from '../hooks/useConfirm';
import SubjectCard from '../components/SubjectCard';
import Modal from '../components/ui/Modal';
import { FaTrash, FaEdit } from "react-icons/fa";

// --- SUB-COMPONENTE: Formulario para añadir Materia (VERSIÓN SIMPLIFICADA SIN COLOR) ---
const AddSubjectForm = ({ onSubmit, onCancel }) => {
    const { register, handleSubmit, reset } = useForm();
    const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    const handleFormSubmit = (data) => {
        const schedule = daysOfWeek.filter(day => data.days && data.days[day]).map(day => ({ day, startTime: data.startTime || null, endTime: data.endTime || null }));
        const subjectData = {
            name: data.name,
            professor: data.professor || "",
            classroom: data.classroom || "",
            commission: data.commission || "",
            schedule,
            startDate: data.startDate,
            endDate: data.endDate || null,
        };
        onSubmit(subjectData);
        reset();
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-1 flex flex-col gap-4">
            <input {...register("name", { required: true })} placeholder="* Nombre de la materia" className="input input-bordered border-black bg-surface-100 w-full dark:bg-gray-700" />
            <input {...register("professor")} placeholder="Profesor" className="input input-bordered border-black bg-surface-100 w-full dark:bg-gray-700" />

            <div className="flex gap-4">
                <div className="w-1/2">
                    <input {...register("classroom")} placeholder="Aula (ej: 204)" className="input input-bordered border-black bg-surface-100 w-full dark:bg-gray-700" />
                </div>
                <div className="w-1/2">
                    <input {...register("commission")} placeholder="Comisión (ej: 1K1)" className="input input-bordered border-black bg-surface-100 w-full dark:bg-gray-700" />
                </div>
            </div>

            <div className="flex gap-4">
                <div className="w-1/2">
                    <label className="text-sm font-semibold block mb-1">Inicio Cursada*:</label>
                    <input type="date" {...register("startDate", { required: true })} className="input input-bordered border-black bg-surface-100 w-full text-sm dark:bg-gray-700" />
                </div>
                <div className="w-1/2">
                    <label className="text-sm font-semibold block mb-1">Fin Cursada:</label>
                    <input type="date" {...register("endDate")} className="input input-bordered border-black bg-surface-100 w-full text-sm dark:bg-gray-700" />
                </div>
            </div>
            <div>
                <div className="text-sm font-semibold mb-2">Días de Cursada:</div>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                    {daysOfWeek.map(day => (
                        <label key={day} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" {...register(`days.${day}`)} className="checkbox checkbox-sm" />
                            <span>{day}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex gap-4">
                <div className="w-1/2">
                    <label className="text-sm block mb-1">Desde:</label>
                    <input type="time" {...register("startTime")} className="input input-bordered border-black bg-surface-100 w-full text-sm dark:bg-gray-700" />
                </div>
                <div className="w-1/2">
                    <label className="text-sm block mb-1">Hasta:</label>
                    <input type="time" {...register("endTime")} className="input input-bordered border-black bg-surface-100 w-full text-sm dark:bg-gray-700" />
                </div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
                <button type="button" onClick={onCancel} className="btn btn-ghost">Cancelar</button>
                <button type="submit" className="btn btn-primary bg-primary border-primary text-text-accent hover:bg-secondary hover:border-secondary">Añadir Materia</button>
            </div>
        </form>
    );
};


// --- Componente principal de la página ---
const DashboardPage = () => {
    const { currentUser } = useAuth();
    const [years, setYears] = useState([]);
    const [subjects, setSubjects] = useState({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentYearId, setCurrentYearId] = useState(null);
    const { register: registerYear, handleSubmit: handleSubmitYear, reset: resetYear } = useForm();
    const [isEditYearModalOpen, setIsEditYearModalOpen] = useState(false);
    const [editingYear, setEditingYear] = useState(null);
    const { register: registerEditYear, handleSubmit: handleSubmitEditYear, setValue: setEditYearValue } = useForm();

    // 1. Inicializamos el hook de confirmación
    const [ConfirmationDialog, confirm] = useConfirm();

    // fetchYearsAndSubjects (ahora usa toast para errores)
    const fetchYearsAndSubjects = async () => {
        if (!currentUser) { setLoading(false); return; }
        setLoading(true);
        try {
            const yearsSnapshot = await getYearsForUser(currentUser.uid);
            const yearsData = yearsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setYears(yearsData);
            const subjectsByYear = {};
            for (const year of yearsData) {
                const subjectsSnapshot = await getSubjectsForYear(currentUser.uid, year.id);
                subjectsByYear[year.id] = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
            setSubjects(subjectsByYear);
        } catch (error) {
            console.error("Error cargando datos:", error);
            toast.error("Hubo un error al cargar tus materias.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchYearsAndSubjects(); }, [currentUser]);

    // --- Handlers actualizados ---
    const handleAddYear = async (data) => {
        try {
            await addYearForUser(currentUser.uid, data.yearName);
            toast.success(`Año "${data.yearName}" añadido con éxito.`);
            fetchYearsAndSubjects();
            resetYear();
        } catch (error) {
            toast.error("No se pudo añadir el año.");
            console.error("Error añadiendo año:", error);
        }
    };

    const handleDeleteYear = async (year) => {
        const result = await confirm(`Eliminar "${year.name}"`, `¿Estás seguro? Se borrará el año y todo su contenido. Esta acción es irreversible.`);
        if (result) {
            try {
                await deleteYear(currentUser.uid, year.id);
                toast.info(`El año "${year.name}" ha sido eliminado.`);
                fetchYearsAndSubjects();
            } catch (error) {
                toast.error("No se pudo eliminar el año.");
                console.error("Error al borrar el año:", error);
            }
        }
    };

    const openEditYearModal = (year) => {
        setEditingYear(year); // Guardamos el objeto del año completo
        setEditYearValue('newYearName', year.name); // Pre-cargamos el formulario
        setIsEditYearModalOpen(true);
    };

    const handleUpdateYear = async (data) => {
        if (!editingYear) return;
        try {
            await updateYearName(currentUser.uid, editingYear.id, data.newYearName);
            toast.success("Nombre del año actualizado.");
            setIsEditYearModalOpen(false);
            setEditingYear(null);
            fetchYearsAndSubjects(); // Recargamos para ver el cambio
        } catch (error) {
            console.error("Error al actualizar el año:", error);
            toast.error("No se pudo actualizar el nombre del año.");
        }
    };

    const handleOpenAddSubjectModal = (yearId) => { setCurrentYearId(yearId); setIsModalOpen(true); };

    const handleAddSubject = async (subjectData) => {
        if (!currentYearId) { toast.warn("Error: No se ha seleccionado un año."); return; }
        const existingSubjectsCount = subjects[currentYearId]?.length || 0;
        const colorIndex = existingSubjectsCount % subjectColors.length;
        const finalSubjectData = { ...subjectData, color: subjectColors[colorIndex].value };
        try {
            await addSubjectToYear(currentUser.uid, currentYearId, finalSubjectData);
            toast.success(`Materia "${subjectData.name}" añadida.`);
            fetchYearsAndSubjects();
            setIsModalOpen(false);
        } catch (error) {
            toast.error("No se pudo añadir la materia.");
            console.error("Error añadiendo materia:", error);
        }
    };

    const handleDeleteSubject = async (yearId, subject) => {
        const result = await confirm(`Eliminar "${subject.name}"`, `¿Estás seguro de que quieres eliminar esta materia?`);
        if (result) {
            try {
                await deleteSubject(currentUser.uid, yearId, subject.id);
                toast.info(`La materia "${subject.name}" ha sido eliminada.`);
                fetchYearsAndSubjects();
            } catch (error) {
                toast.error("No se pudo eliminar la materia.");
                console.error("Error al eliminar la materia:", error);
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full pt-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

    return (
    <div>
        <ConfirmationDialog />

        <h1 className="text-3xl font-bold mb-6">Mis Materias</h1>

        <form onSubmit={handleSubmitYear(handleAddYear)} className="flex gap-2 mb-8">
            <input
                {...registerYear("yearName", { required: true })}
                placeholder="Ej: Primer Año, 2024..."
                className="input input-bordered w-full max-w-xs bg-surface-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            />
            <button type="submit" className="btn btn-primary bg-primary border-primary text-text-accent hover:bg-secondary hover:border-secondary">
                Añadir Año
            </button>
        </form>

        <div className="space-y-12">
            {years.length > 0 ? (
                years.map(year => (
                    <div key={year.id}>
                        <div className="mb-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-semibold">{year.name}</h2>
                                
                                {/* --- BOTÓN DE EDITAR AÑADIDO --- */}
                                <button 
                                    onClick={() => openEditYearModal(year)} 
                                    className="text-text-secondary hover:text-primary transition-colors"
                                    title={`Editar nombre de ${year.name}`}
                                >
                                    <FaEdit />
                                </button>
                                {/* --------------------------------- */}

                                <button onClick={() => handleDeleteYear(year)} className="text-red-500 hover:text-red-700" title={`Eliminar ${year.name}`}>
                                    <FaTrash />
                                </button>
                            </div>
                            <button onClick={() => handleOpenAddSubjectModal(year.id)} className="btn btn-secondary bg-secondary border-secondary text-text-accent btn-sm mt-2">
                                Añadir Materia
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {subjects[year.id]?.map(subject => (
                                <SubjectCard key={subject.id} subject={subject} onDelete={() => handleDeleteSubject(year.id, subject)} />
                            ))}
                        </div>
                        {(!subjects[year.id] || subjects[year.id].length === 0) && (
                            <p className="text-center text-gray-500 mt-4">Aún no hay materias en este año. ¡Añade una!</p>
                        )}
                    </div>
                ))
            ) : (
                <div className="text-center text-text-secondary p-10 border-2 border-dashed border-surface-200 rounded-lg">
                    <h3 className="text-xl font-semibold">¡Bienvenido a Estud-IA!</h3>
                    <p className="mt-2">Parece que aún no has añadido ningún año de cursada. <br /> ¡Empieza creando uno para organizar tus materias!</p>
                </div>
            )}
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Añadir Nueva Materia">
            <AddSubjectForm
                onSubmit={handleAddSubject}
                onCancel={() => setIsModalOpen(false)}
            />
        </Modal>

        {/* --- NUEVO MODAL PARA EDITAR EL AÑO AÑADIDO --- */}
        <Modal isOpen={isEditYearModalOpen} onClose={() => setIsEditYearModalOpen(false)} title="Editar Nombre del Año">
            <form onSubmit={handleSubmitEditYear(handleUpdateYear)} className="p-1 flex flex-col gap-4">
                <input 
                    {...registerEditYear("newYearName", { required: true })} 
                    className="input input-bordered border-black bg-surface-100 w-full" 
                />
                <div className="flex justify-end gap-4 mt-4">
                    <button type="button" onClick={() => setIsEditYearModalOpen(false)} className="btn btn-ghost">Cancelar</button>
                    <button type="submit" className="btn btn-primary bg-primary border-primary text-text-accent hover:bg-secondary hover:border-secondary">Guardar Cambios</button>
                </div>
            </form>
        </Modal>
        {/* ------------------------------------------- */}
    </div>
);
};

export default DashboardPage;