import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import useConfirm from '../hooks/useConfirm';
import { 
    getSubjectById, 
    updateSubject,
    getEventsForSubject, 
    addEventToSubject, 
    deleteEvent, 
    removeFileFromSubject,
    addGradeToNotebook,
    getGradesForSubject,
    deleteGradeFromNotebook,
    addTaskToSubject,
    updateTasksForSubject,
    updateSubjectNotes
} from '../services/firestoreService';
import { getFileUrl, deleteFileByPath } from '../services/storageService';
import { subjectColors, defaultSubjectColor } from '../config/colors';

// Importación de componentes e íconos
import AccordionItem from '../components/ui/AccordionItem';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import Modal from '../components/ui/Modal';
import Checklist from '../components/Checklist';
import NotesEditor from '../components/NotesEditor';
import { IoArrowBack, IoCalendarOutline, IoCheckboxOutline, IoFolderOpenOutline, IoNewspaperOutline } from "react-icons/io5";
import { FaTrash, FaPlusCircle, FaCog } from 'react-icons/fa';

// --- SUB-COMPONENTE: Formulario para editar Materia ---
const SubjectForm = ({ onSubmit, onCancel, defaultValues = {}, isEditing = false }) => {
    const [selectedColor, setSelectedColor] = useState(defaultValues.color || defaultSubjectColor);
    const { register, handleSubmit, reset, setValue } = useForm({ defaultValues });
    const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    useEffect(() => { setValue('color', selectedColor); }, [selectedColor, setValue]);
    useEffect(() => { reset(defaultValues); setSelectedColor(defaultValues.color || defaultSubjectColor); }, [defaultValues, reset]);

    const handleFormSubmit = (data) => {
        const schedule = daysOfWeek.filter(day => data.days && data.days[day]).map(day => ({ day, startTime: data.startTime || null, endTime: data.endTime || null }));
        const subjectData = { name: data.name, professor: data.professor || "", classroom: data.classroom || "", schedule, startDate: data.startDate, endDate: data.endDate || null, color: selectedColor };
        onSubmit(subjectData);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-1 flex flex-col gap-4">
            <input {...register("name", { required: true })} placeholder="* Nombre de la materia" className="input input-bordered w-full dark:bg-gray-700" />
            <input {...register("professor")} placeholder="Profesor" className="input input-bordered w-full dark:bg-gray-700" />
            <input {...register("classroom")} placeholder="Aula (ej: 204)" className="input input-bordered w-full dark:bg-gray-700" />
            <div className="flex gap-4"><div className="w-1/2"><label className="text-sm font-semibold block mb-1">Inicio Cursada*:</label><input type="date" {...register("startDate", { required: true })} className="input input-bordered w-full text-sm dark:bg-gray-700" /></div><div className="w-1/2"><label className="text-sm font-semibold block mb-1">Fin Cursada:</label><input type="date" {...register("endDate")} className="input input-bordered w-full text-sm dark:bg-gray-700" /></div></div>
            <div><div className="text-sm font-semibold mb-2">Días de Cursada:</div><div className="grid grid-cols-3 gap-x-4 gap-y-2">{daysOfWeek.map(day => (<label key={day} className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" {...register(`days.${day}`)} className="checkbox checkbox-sm" /><span>{day}</span></label>))}</div></div>
            <div className="flex gap-4"><div className="w-1/2"><label className="text-sm block mb-1">Desde:</label><input type="time" {...register("startTime")} className="input input-bordered w-full text-sm dark:bg-gray-700" /></div><div className="w-1/2"><label className="text-sm block mb-1">Hasta:</label><input type="time" {...register("endTime")} className="input input-bordered w-full text-sm dark:bg-gray-700" /></div></div>
            <div><label className="text-sm font-semibold block mb-2">Color de la Materia</label><div className="flex flex-wrap gap-3">{subjectColors.map(color => (<div key={color.value} onClick={() => setSelectedColor(color.value)} className="w-8 h-8 rounded-full transition-all duration-200 transform cursor-pointer" style={{ backgroundColor: color.value }}>{selectedColor === color.value && (<div className="w-full h-full rounded-full flex items-center justify-center bg-black/30"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>)}</div>))}</div><input {...register('color')} type="hidden" /></div>
            <div className="flex justify-end gap-4 mt-4"><button type="button" onClick={onCancel} className="btn btn-ghost">Cancelar</button><button type="submit" className="btn btn-primary">{isEditing ? 'Guardar Cambios' : 'Añadir Materia'}</button></div>
        </form>
    );
};

// --- SUB-COMPONENTE: Formulario para añadir Eventos ---
const AddEventForm = ({ subject, onEventAdded }) => {
    const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm();
    const { currentUser } = useAuth();
    const handleFormSubmit = async (data) => {
        if (!currentUser || !subject) return;
        const startDateTimeString = data.startTime ? `${data.date}T${data.startTime}` : data.date;
        const eventData = { title: data.title, start: startDateTimeString, allDay: !data.startTime, color: subject.color || '#ef4444' };
        try {
            await addEventToSubject(currentUser.uid, subject.yearId, subject.id, eventData);
            toast.success("Evento añadido al calendario.");
            onEventAdded();
            reset();
        } catch (error) {
            console.error("Error detallado al añadir evento:", error);
            toast.error(`No se pudo añadir el evento: ${error.message}`);
        }
    };
    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 p-2">
            <h4 className="font-semibold text-lg mb-2">Añadir Nuevo Evento</h4>
            <div>
                <input {...register("title", { required: "El título es obligatorio" })} placeholder="Título (ej: Parcial)" className="input input-bordered w-full dark:bg-gray-700" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div className="flex gap-4">
                <div className="flex-grow"><label className="text-xs font-semibold">Fecha*</label><input type="date" {...register("date", { required: "La fecha es obligatoria" })} className="input input-bordered w-full dark:bg-gray-700" />{errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}</div>
                <div className="w-1/3"><label className="text-xs font-semibold">Hora (Opcional)</label><input type="time" {...register("startTime")} className="input input-bordered w-full dark:bg-gray-700" /></div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? "Añadiendo..." : "Añadir al Calendario"}</button>
        </form>
    );
};

// --- SUB-COMPONENTE: Lista de Eventos ---
const EventList = ({ events, onEventDeleted }) => (
    <div className="mt-4 space-y-2">
        {events && events.length > 0 ? (events.map(event => {
            const dateString = (event.allDay && !event.start.includes('T')) ? `${event.start}T00:00:00` : event.start;
            const eventDate = new Date(dateString);
            const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
            const timeOptions = { hour: '2-digit', minute: '2-digit' };
            return (
                <div key={event.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm">
                    <div><p className="font-semibold">{event.title}</p><p className="text-sm text-gray-500 dark:text-gray-400">{eventDate.toLocaleDateString('es-ES', dateOptions)}{!event.allDay && (<span className="ml-2 font-mono bg-surface-200 px-1 rounded">{eventDate.toLocaleTimeString('es-ES', timeOptions)} hs</span>)}</p></div>
                    <button onClick={() => onEventDeleted(event)} className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"><FaTrash /></button>
                </div>
            );
        })) : (<p className="mt-4 text-center text-gray-500 dark:text-gray-400">No hay eventos para esta materia.</p>)}
    </div>
);

// --- SUB-COMPONENTE: Gestor de Notas ---
const GradesManager = ({ subject, grades, onAddGrade, onDeleteGrade }) => {
    const { register, handleSubmit, reset } = useForm();
    const handleFormSubmit = (data) => {
        const newGradeData = { subjectId: subject.id, subjectName: subject.name, subjectColor: subject.color || defaultSubjectColor, title: data.gradeTitle, score: parseFloat(data.gradeScore) };
        if (isNaN(newGradeData.score)) { toast.warn("Por favor, introduce una nota numérica válida."); return; }
        onAddGrade(newGradeData);
        reset();
    };
    const average = useMemo(() => {
        if (!grades || grades.length === 0) return '0.00';
        const total = grades.reduce((acc, grade) => acc + grade.score, 0);
        return (total / grades.length).toFixed(2);
    }, [grades]);
    return (
        <div className="bg-surface-100 p-6 rounded-lg shadow-md sticky top-8">
            <h3 className="font-bold text-lg mb-4">Notas de la Cursada</h3>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex items-start gap-2 mb-6">
                <div className="flex-grow"><input {...register("gradeTitle", { required: true })} placeholder="Ej: Primer Parcial" className="input input-sm input-bordered w-full dark:bg-gray-700"/></div>
                <div className="w-20"><input type="number" step="0.01" {...register("gradeScore", { required: true })} placeholder="Nota" className="input input-sm input-bordered w-full dark:bg-gray-700"/></div>
                <button type="submit" className="btn btn-sm btn-primary btn-circle"><FaPlusCircle /></button>
            </form>
            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2">
                {grades && grades.length > 0 ? (grades.map(grade => (<div key={grade.id} className="flex justify-between items-center bg-surface-200 p-2 rounded"><span className="truncate pr-2">{grade.title}</span><div className="flex items-center gap-2"><span className="font-bold">{grade.score}</span><button onClick={() => onDeleteGrade(grade)} className="text-red-500 hover:text-red-700"><FaTrash size={12} /></button></div></div>))) : (<p className="text-sm text-center text-text-secondary py-4">Aún no has cargado ninguna nota.</p>)}
            </div>
            <div className="border-t border-surface-200 pt-4">
                <div className="flex justify-between items-center text-xl font-bold"><span>Promedio:</span><span className={average >= 7 ? 'text-green-500' : (average > 0 ? 'text-yellow-500' : '')}>{average}</span></div>
                {average >= 7 && (<p className="mt-2 text-center font-semibold text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/50 p-2 rounded">¡Felicitaciones, estás promocionando!</p>)}
                {average < 7 && average > 0 && (<p className="mt-2 text-center font-semibold text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/50 p-2 rounded">¡A seguir esforzándose!</p>)}
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
const SubjectDetailPage = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const [subject, setSubject] = useState(null);
    const [events, setEvents] = useState([]);
    const [subjectGrades, setSubjectGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewFile, setPreviewFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [ConfirmationDialog, confirm] = useConfirm();

    const fetchAllData = async () => {
        if (!currentUser || !id) { if (loading) setLoading(false); return; }
        try {
            const subjectData = await getSubjectById(currentUser.uid, id);
            if (subjectData) {
                setSubject(subjectData);
                const [eventsSnapshot, gradesSnapshot] = await Promise.all([
                    getEventsForSubject(currentUser.uid, subjectData.yearId, subjectData.id),
                    getGradesForSubject(currentUser.uid, id)
                ]);
                setEvents(eventsSnapshot);
                setSubjectGrades(gradesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } else { setError('No se pudo encontrar la materia.'); }
        } catch (err) {
            setError('Error al cargar los datos de la materia.');
            console.error(err);
        } finally { if (loading) setLoading(false); }
    };

    useEffect(() => { setLoading(true); setError(''); fetchAllData(); }, [currentUser, id]);

    const handleUpdateSubject = async (updatedData) => {
        if (!subject) return;
        try {
            await updateSubject(currentUser.uid, subject.yearId, subject.id, updatedData);
            toast.success("Materia actualizada con éxito.");
            setIsEditModalOpen(false);
            fetchAllData();
        } catch (error) { console.error("Error al actualizar la materia:", error); toast.error("No se pudo actualizar la materia."); }
    };

    const handleAddTask = async (taskText) => {
        if (!subject) return;
        const newTask = { id: new Date().getTime().toString(), text: taskText, completed: false };
        const updatedTasks = [...(subject.tasks || []), newTask];
        setSubject(prev => ({ ...prev, tasks: updatedTasks }));
        try { await addTaskToSubject(currentUser.uid, subject.yearId, subject.id, newTask); } catch (error) { console.error("Error al añadir tarea:", error); setSubject(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== newTask.id) })); toast.error("No se pudo añadir la tarea."); }
    };

    const handleToggleTask = async (taskId) => {
        if (!subject) return;
        const originalTasks = subject.tasks || [];
        const updatedTasks = originalTasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task);
        setSubject(prev => ({ ...prev, tasks: updatedTasks }));
        try { await updateTasksForSubject(currentUser.uid, subject.yearId, subject.id, updatedTasks); } catch (error) { console.error("Error al actualizar tarea:", error); setSubject(prev => ({ ...prev, tasks: originalTasks })); toast.error("No se pudo actualizar la tarea."); }
    };

    const handleDeleteTask = async (taskId) => {
        const result = await confirm('Eliminar Tarea', '¿Estás seguro de que quieres eliminar esta tarea?');
        if (result) {
            if (!subject) return;
            const originalTasks = subject.tasks || [];
            const updatedTasks = originalTasks.filter(task => task.id !== taskId);
            setSubject(prev => ({ ...prev, tasks: updatedTasks }));
            try { await updateTasksForSubject(currentUser.uid, subject.yearId, subject.id, updatedTasks); toast.info('Tarea eliminada.'); } catch (error) { console.error("Error al eliminar tarea:", error); setSubject(prev => ({ ...prev, tasks: originalTasks })); toast.error("No se pudo eliminar la tarea."); }
        }
    };
    
    const handleEventDeleted = async (event) => {
        const result = await confirm('Eliminar Evento', `¿Seguro que quieres eliminar "${event.title}"?`);
        if (result) {
            try { await deleteEvent(currentUser.uid, event.yearId, event.subjectId, event.id); toast.info('Evento eliminado.'); setEvents(prevEvents => prevEvents.filter(e => e.id !== event.id)); } catch (error) { console.error("Error al eliminar el evento:", error); toast.error('No se pudo eliminar el evento.'); }
        }
    };
    
    const handlePreviewFile = async (file) => {
        setPreviewFile(file);
        try { const url = await getFileUrl(file.path); setPreviewUrl(url); } catch (error) { console.error("Error al obtener URL de vista previa:", error); toast.error("No se pudo cargar la vista previa."); handleClosePreview(); }
    };

    const handleClosePreview = () => { setPreviewFile(null); setPreviewUrl(''); };

    const handleFileDelete = async (fileToDelete) => {
      const result = await confirm('Eliminar Archivo', `¿Seguro que quieres eliminar "${fileToDelete.name}"? Esta acción es irreversible.`);
      if (result) {
        try { await deleteFileByPath(fileToDelete.path); await removeFileFromSubject(currentUser.uid, subject.yearId, subject.id, fileToDelete); toast.info('Archivo eliminado.'); fetchAllData(); } catch (error) { console.error("Error al eliminar el archivo:", error); toast.error('No se pudo eliminar el archivo.'); }
      }
    };

    const handleNotesChange = async (newContent) => {
        if (!subject) return false;
        setSubject(prev => ({ ...prev, personalNotes: newContent }));
        try { await updateSubjectNotes(currentUser.uid, subject.yearId, subject.id, newContent); return true; } catch (error) { console.error("Error al guardar notas:", error); toast.error("No se pudieron guardar las notas."); setSubject(prev => ({...prev, personalNotes: subject.personalNotes})); return false; }
    };

    const handleAddGrade = async (gradeData) => {
        try {
            await addGradeToNotebook(currentUser.uid, gradeData);
            toast.success("Nota añadida a tu libreta.");
            fetchAllData();
        } catch (error) {
            console.error("Error al añadir la nota:", error);
            toast.error("No se pudo añadir la nota.");
        }
    };

    const handleDeleteGrade = async (gradeToDelete) => {
        const result = await confirm('Eliminar Nota', `¿Eliminar la nota "${gradeToDelete.title}"?`);
        if (result) {
            try {
                await deleteGradeFromNotebook(currentUser.uid, gradeToDelete.id);
                toast.info("Nota eliminada.");
                fetchAllData();
            } catch (error) {
                console.error("Error al eliminar la nota:", error);
                toast.error("No se pudo eliminar la nota.");
            }
        }
    };
    
    const subjectDefaultValues = useMemo(() => {
        if (!subject) return {};
        const days = subject.schedule?.reduce((acc, slot) => { acc[slot.day] = true; return acc; }, {}) || {};
        return { name: subject.name || '', professor: subject.professor || '', classroom: subject.classroom || '', startDate: subject.startDate || '', endDate: subject.endDate || '', days: days, startTime: subject.schedule?.[0]?.startTime || '', endTime: subject.schedule?.[0]?.endTime || '', color: subject.color || defaultSubjectColor };
    }, [subject]);
    
    if (loading) return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
    if (!subject) return <div className="text-center p-10">Materia no encontrada.</div>;

    return (
        <div>
            <ConfirmationDialog />
            <div className="mb-10 flex justify-between items-center gap-4">
                <div>
                    <Link to="/dashboard" className="inline-flex items-center gap-2 mb-2 text-primary/80 hover:text-primary hover:underline text-sm"><IoArrowBack />Volver a Mis Materias</Link>
                    <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">{subject.name}</h1>
                    <p className="text-lg text-text-secondary mt-1">{subject.professor}</p>
                </div>
                <button onClick={() => setIsEditModalOpen(true)} className="btn btn-circle btn-ghost text-text-secondary hover:bg-surface-200"><FaCog size={24} /></button>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-12">
                <div className="w-full lg:w-2/3">
                    <div className="space-y-1">
                        <AccordionItem title="Eventos Importantes" icon={IoCalendarOutline}>
                            <AddEventForm subject={subject} onEventAdded={fetchAllData} />
                            <EventList events={events} onEventDeleted={handleEventDeleted} />
                        </AccordionItem>
                        <AccordionItem title="Tareas / Checklist" icon={IoCheckboxOutline}>
                           <Checklist tasks={subject.tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask}/>
                        </AccordionItem>
                        <AccordionItem title="Archivos de la Materia" icon={IoFolderOpenOutline}>
                            <div className="p-2">
                                <FileUpload subject={subject} onUploadSuccess={fetchAllData} />
                                <FileList files={subject.files} onPreview={handlePreviewFile} onDelete={handleFileDelete}/>
                            </div>
                        </AccordionItem>
                        <AccordionItem title="Notas Personales" icon={IoNewspaperOutline} defaultOpen={true}>
                           <NotesEditor content={subject.personalNotes} onContentChange={handleNotesChange}/>
                        </AccordionItem>
                    </div>
                </div>
                <div className="w-full lg:w-1/3">
                    <GradesManager subject={subject} grades={subjectGrades} onAddGrade={handleAddGrade} onDeleteGrade={handleDeleteGrade}/>
                </div>
            </div>
            
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Materia">
                {subject && (<SubjectForm onSubmit={handleUpdateSubject} onCancel={() => setIsEditModalOpen(false)} defaultValues={subjectDefaultValues} isEditing={true}/>)}
            </Modal>
            <Modal isOpen={!!previewFile} onClose={handleClosePreview} title={previewFile?.name}>
                {previewUrl && (
                    <>
                        {previewFile?.type.startsWith('image/') && (<img src={previewUrl} alt={previewFile.name} className="max-w-full max-h-[75vh] mx-auto" />)}
                        {previewFile?.type === 'application/pdf' && (<iframe src={previewUrl} className="w-full h-[75vh]" title={previewFile.name}></iframe>)}
                    </>
                )}
            </Modal>
        </div>
    );
};

export default SubjectDetailPage;