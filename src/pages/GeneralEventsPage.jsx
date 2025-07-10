import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { 
    getGeneralEvents, 
    addGeneralEvent, 
    updateGeneralEvent, 
    deleteGeneralEvent 
} from '../services/firestoreService';
import { FaTrash, FaEdit, FaPlus } from 'react-icons/fa';
import Modal from '../components/ui/Modal';
import { toast } from 'react-toastify'; // <-- Importar toast
import useConfirm from '../hooks/useConfirm'; // <-- Importar nuestro hook

// --- SUB-COMPONENTE: GeneralEventForm (sin cambios) ---
const GeneralEventForm = ({ onSubmit, onCancel, defaultValues = {}, isEditing = false }) => {
    const { register, handleSubmit, reset } = useForm({ defaultValues });
    
    useEffect(() => { reset(defaultValues); }, [defaultValues, reset]);

    const handleFormSubmit = (data) => {
        const startDateTimeString = data.startTime ? `${data.date}T${data.startTime}` : data.date;
        const eventData = { title: data.title, start: startDateTimeString, allDay: !data.startTime };
        onSubmit(eventData);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-1 flex flex-col gap-4">
            <input {...register("title", { required: true })} placeholder="* Título del evento" className="input input-bordered w-full" />
            <div className="flex gap-4">
                <div className="flex-grow"><label className="text-sm font-semibold">Fecha*</label><input type="date" {...register("date", { required: true })} className="input input-bordered w-full" /></div>
                <div className="w-1/3"><label className="text-sm font-semibold">Hora</label><input type="time" {...register("startTime")} className="input input-bordered w-full" /></div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
                <button type="button" onClick={onCancel} className="btn btn-ghost">Cancelar</button>
                <button type="submit" className="btn btn-primary">{isEditing ? 'Guardar Cambios' : 'Añadir Evento'}</button>
            </div>
        </form>
    );
};


// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
const GeneralEventsPage = () => {
    const { currentUser } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [ConfirmationDialog, confirm] = useConfirm(); // <-- Inicializar el hook

    const fetchEvents = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const eventsData = await getGeneralEvents(currentUser.uid);
            setEvents(eventsData);
        } catch (error) {
            console.error("Error al cargar eventos generales:", error);
            toast.error("No se pudieron cargar los eventos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEvents(); }, [currentUser]);

    const handleAddEvent = async (eventData) => {
        try {
            await addGeneralEvent(currentUser.uid, eventData);
            toast.success("Evento añadido con éxito.");
            fetchEvents();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error al añadir evento:", error);
            toast.error("No se pudo añadir el evento.");
        }
    };

    const handleUpdateEvent = async (eventData) => {
        try {
            await updateGeneralEvent(currentUser.uid, editingEvent.id, eventData);
            toast.success("Evento actualizado con éxito.");
            fetchEvents();
            setIsModalOpen(false);
            setEditingEvent(null);
        } catch (error) {
            console.error("Error al actualizar evento:", error);
            toast.error("No se pudo actualizar el evento.");
        }
    };

    const handleDeleteEvent = async (eventId, eventTitle) => {
        const result = await confirm(`Eliminar "${eventTitle}"`, `¿Estás seguro de que quieres eliminar este evento?`);
        if (result) {
            try {
                await deleteGeneralEvent(currentUser.uid, eventId);
                toast.info("Evento eliminado.");
                fetchEvents();
            } catch (error) {
                console.error("Error al eliminar evento:", error);
                toast.error("No se pudo eliminar el evento.");
            }
        }
    };

    const openEditModal = (event) => {
        const startDate = new Date(event.start);
        const defaultValues = {
            title: event.title,
            date: startDate.toISOString().split('T')[0],
            startTime: event.allDay ? '' : startDate.toTimeString().split(' ')[0].substring(0, 5)
        };
        setEditingEvent({ ...event, defaultValues });
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingEvent(null);
        setIsModalOpen(true);
    };

    if (loading) return <div className="flex justify-center items-center h-full pt-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

    return (
        <div>
            {/* Renderizamos el diálogo de confirmación */}
            <ConfirmationDialog />

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Eventos Generales</h1>
                <button onClick={openAddModal} className="btn btn-primary bg-primary border-primary text-text-accent hover:bg-secondary hover:border-secondary"><FaPlus className="mr-2"/>Añadir Evento</button>
            </div>

            <div className="bg-surface-100 p-4 sm:p-6 rounded-lg shadow-md">
                <div className="space-y-3">
                    {events.length > 0 ? (
                        events.map(event => {
                            const dateString = (event.allDay && !event.start.includes('T')) ? `${event.start}T00:00:00` : event.start;
                            const eventDate = new Date(dateString);
                            return (
                                <div key={event.id} className="flex items-center justify-between p-4 bg-surface-200 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-lg">{event.title}</p>
                                        <p className="text-sm text-text-secondary">
                                            {eventDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            {!event.allDay && ` - ${eventDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEditModal(event)} className="btn btn-ghost btn-sm btn-circle"><FaEdit /></button>
                                        <button onClick={() => handleDeleteEvent(event.id, event.title)} className="btn btn-ghost btn-sm btn-circle text-red-500"><FaTrash /></button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-text-secondary py-8">No tienes eventos generales. ¡Añade uno para empezar!</p>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEvent ? 'Editar Evento' : 'Nuevo Evento General'}>
                <GeneralEventForm
                    onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent}
                    onCancel={() => setIsModalOpen(false)}
                    defaultValues={editingEvent ? editingEvent.defaultValues : {}}
                    isEditing={!!editingEvent}
                />
            </Modal>
        </div>
    );
};

export default GeneralEventsPage;