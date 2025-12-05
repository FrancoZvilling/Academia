import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateRecurringEvents } from '../utils/dateUtils';
import {
    getGeneralEvents,
    getYearsForUser,
    getSubjectsForYear,
    getAllEventsForUser,
    deleteEvent
} from '../services/firestoreService';
import { FaChevronLeft, FaChevronRight, FaCalendarDay, FaList, FaTh, FaCalendarWeek, FaBook, FaClock, FaMapMarkerAlt, FaTrash, FaTimes, FaInfoCircle } from 'react-icons/fa';
import Modal from '../components/ui/Modal';
import useWindowSize from '../hooks/useWindowSize';
import { toast } from 'react-toastify';
import useConfirm from '../hooks/useConfirm';

// Importaciones de FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

const CalendarPage = () => {
    const { currentUser } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { width } = useWindowSize();
    const [ConfirmationDialog, confirm] = useConfirm();
    const calendarRef = useRef(null);
    const [currentTitle, setCurrentTitle] = useState('');
    const [currentView, setCurrentView] = useState('dayGridMonth');
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        const fetchAllCalendarData = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                // 1. Obtener Años y Materias primero para construir el mapa de materias
                const yearsSnap = await getYearsForUser(currentUser.uid);
                const subjectMap = {};
                let allClassEvents = [];

                for (const yearDoc of yearsSnap.docs) {
                    const subjectsSnap = await getSubjectsForYear(currentUser.uid, yearDoc.id);
                    for (const subjectDoc of subjectsSnap.docs) {
                        const subject = { id: subjectDoc.id, ...subjectDoc.data() };
                        subjectMap[subject.id] = subject.name; // Guardar nombre de materia

                        // Generar eventos de clases
                        const generatedEvents = generateRecurringEvents(subject);
                        // Enriquecer eventos de clase con nombre de materia explícito si hace falta
                        const enrichedClassEvents = generatedEvents.map(ev => ({
                            ...ev,
                            extendedProps: { ...ev.extendedProps, subjectName: subject.name }
                        }));
                        allClassEvents = [...allClassEvents, ...enrichedClassEvents];
                    }
                }

                // 2. Función auxiliar para procesar eventos
                const processEventsForBlockDisplay = (event) => {
                    const hasTime = !event.allDay;
                    const eventDate = new Date(event.start);
                    const timeString = hasTime
                        ? eventDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                        : '';

                    // Intentar obtener nombre de materia si existe subjectId
                    const subjectName = event.extendedProps?.subjectId ? subjectMap[event.extendedProps.subjectId] : null;

                    return {
                        ...event,
                        title: hasTime ? `${timeString} ${event.title}` : event.title,
                        start: event.start, // Mantener formato original con hora
                        allDay: !hasTime, // Solo allDay si no tiene hora
                        display: 'block',
                        extendedProps: {
                            ...event.extendedProps,
                            hasTime,
                            originalStart: event.start,
                            subjectName: subjectName || event.extendedProps?.subjectName
                        }
                    };
                };

                // 3. Obtener eventos individuales y generales
                const singleEventsRaw = await getAllEventsForUser(currentUser.uid);
                const generalEventsRaw = await getGeneralEvents(currentUser.uid);

                const singleEvents = singleEventsRaw.map(processEventsForBlockDisplay);

                // Procesar eventos generales para que aparezcan en la grilla horaria (ya que ocultamos allDaySlot)
                const generalEvents = generalEventsRaw.map(ev => {
                    const baseEvent = processEventsForBlockDisplay(ev);
                    // Si es allDay (que lo será por defecto si no tiene hora), lo forzamos a las 06:00
                    if (baseEvent.allDay) {
                        return {
                            ...baseEvent,
                            allDay: false,
                            start: `${baseEvent.start}T06:00:00`, // Asignar hora de inicio arbitraria visible
                            title: `(Todo el día) ${baseEvent.title}` // Indicar visualmente que es todo el día
                        };
                    }
                    return baseEvent;
                });

                // Procesar también los de clase para asegurar formato consistente (aunque ya vienen formateados de generateRecurringEvents, el display block y eso)
                // Nota: generateRecurringEvents ya devuelve formato FullCalendar, pero si queremos normalizar algo más lo hacemos aquí.
                // Por ahora los de clase ya tienen 'display: block' si se generaron así o default.
                // Vamos a asegurarnos de que los de clase tengan el formato correcto de title si quisieramos hora, pero las clases suelen ser por horario definido en el objeto.
                // generateRecurringEvents ya pone start con T hora.

                // Ajuste final para clases: asegurar que se vean como bloques y tengan la hora en el título si es necesario
                const classEventsProcessed = allClassEvents.map(ev => {
                    const hasTime = !ev.allDay;
                    const timeString = hasTime ? ev.start.split('T')[1].substring(0, 5) : '';
                    return {
                        ...ev,
                        title: hasTime ? `${timeString} ${ev.title}` : ev.title,
                        display: 'block',
                        allDay: !hasTime, // Solo allDay si no tiene hora
                        extendedProps: { ...ev.extendedProps, hasTime, originalStart: ev.start }
                    };
                });

                setEvents([...singleEvents, ...classEventsProcessed, ...generalEvents]);
            } catch (error) {
                console.error("Error al cargar datos del calendario:", error);
                toast.error("Hubo un error al cargar el calendario.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllCalendarData();
    }, [currentUser]);

    const handleEventClick = (clickInfo) => {
        const { extendedProps, title, id } = clickInfo.event;
        // Preparamos los datos para el modal
        setSelectedEvent({
            id: id,
            title: title, // El título ya tiene la hora pegada, quizás queramos el título original. 
            // FullCalendar modifica el título en el objeto event? No, es el que le pasamos.
            // Pero nosotros le pegamos la hora al título en processEventsForBlockDisplay.
            // Lo ideal sería tener el título limpio en extendedProps o limpiarlo aquí.
            // Vamos a usar una regex simple o guardar el título original.
            // Mejor: guardar title original en extendedProps.

            // Corrección: En processEventsForBlockDisplay no guardamos originalTitle.
            // Asumimos que para 'class' el title es la materia, para 'event' es el titulo del evento.
            // Vamos a mostrar lo que hay, o limpiar la hora si empieza con hora.
            displayTitle: title.replace(/^\d{2}:\d{2}\s/, ''),
            ...extendedProps
        });
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;

        const { type, yearId, subjectId, id, title } = selectedEvent;

        if (type === 'class') {
            toast.info("Las clases se gestionan desde la configuración de la materia.");
            return;
        }
        if (type === 'general') {
            toast.info("Los eventos generales se gestionan desde su propia sección.");
            return;
        }

        const result = await confirm('Eliminar Evento', `¿Estás seguro de que quieres eliminar "${selectedEvent.displayTitle}"?`);
        if (result) {
            try {
                await deleteEvent(currentUser.uid, yearId, subjectId, id);
                toast.success('Evento eliminado.');
                setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
                setSelectedEvent(null); // Cerrar modal
            } catch (error) {
                console.error("Error al eliminar el evento:", error);
                toast.error("No se pudo eliminar el evento.");
            }
        }
    };

    const isMobile = width !== undefined && width < 768;
    // const calendarView = isMobile ? 'listWeek' : 'dayGridMonth'; // Ya no se usa para initialView dinámico en render, se controla por estado si se desea, o se deja que FullCalendar maneje la vista inicial y nosotros la sincronizamos.
    // const calendarHeader = ... // Ya no se usa
    // const calendarFooter = ... // Ya no se usa

    const handlePrev = () => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.prev();
        }
    };

    const handleNext = () => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.next();
        }
    };

    const handleToday = () => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.today();
        }
    };

    const handleViewChange = (viewName) => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.changeView(viewName);
            setCurrentView(viewName);
        }
    };

    const handleDatesSet = (arg) => {
        setCurrentTitle(arg.view.title);
        setCurrentView(arg.view.type);
    };

    if (loading) return <div className="flex justify-center items-center h-full pt-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

    return (
        // --- CONTENEDOR PRINCIPAL MODIFICADO ---
        <div className="flex flex-col h-full">

            <h1 className="text-3xl font-bold mb-6 flex-shrink-0">Calendario General</h1>

            {/* --- TOOLBAR PERSONALIZADA --- */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 bg-surface-100 p-4 rounded-lg shadow-sm">

                {/* Título y Navegación (Izquierda/Centro en móvil) */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                    <h2 className="text-xl md:text-2xl font-bold text-text-primary capitalize">{currentTitle}</h2>
                    <div className="flex items-center gap-1">
                        <button onClick={handlePrev} className="btn btn-circle btn-sm btn-ghost hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors">
                            <FaChevronLeft />
                        </button>
                        <button onClick={handleToday} className="btn btn-sm btn-ghost hover:bg-primary/10 text-primary font-semibold px-3">
                            Hoy
                        </button>
                        <button onClick={handleNext} className="btn btn-circle btn-sm btn-ghost hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors">
                            <FaChevronRight />
                        </button>
                    </div>
                </div>

                {/* Selector de Vistas (Derecha/Abajo en móvil) */}
                <div className="flex bg-surface-50 p-1 rounded-lg border border-gray-200 dark:border-gray-700 w-full md:w-auto">
                    <button
                        onClick={() => handleViewChange('dayGridMonth')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${currentView === 'dayGridMonth' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                        <FaTh className="text-lg" />
                        <span className="hidden sm:inline">Mes</span>
                    </button>
                    <button
                        onClick={() => handleViewChange('timeGridWeek')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${currentView === 'timeGridWeek' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                        <FaCalendarWeek className="text-lg" />
                        <span className="hidden sm:inline">Semana</span>
                    </button>
                    <button
                        onClick={() => handleViewChange('listWeek')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${currentView === 'listWeek' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                        <FaList className="text-lg" />
                        <span className="hidden sm:inline">Lista</span>
                    </button>
                </div>
            </div>

            {/* --- CONTENEDOR DEL CALENDARIO MODIFICADO --- */}
            <div className="flex-grow overflow-hidden bg-surface-100 rounded-lg shadow-md relative z-0">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                    initialView={isMobile ? 'timeGridWeek' : 'dayGridMonth'}
                    headerToolbar={false}
                    footerToolbar={false}
                    events={events}
                    eventClick={handleEventClick}
                    datesSet={handleDatesSet}
                    locale="es"
                    allDayText="Todo el día"
                    // --- PROPIEDAD DE ALTURA MODIFICADA ---
                    height="100%"
                    weekends={true}
                    dayMaxEventRows={true}
                    listDayFormat={{ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }}
                    listDaySideFormat={false}
                    noEventsContent="No hay eventos para mostrar"
                    titleFormat={{ month: 'long', year: 'numeric' }}
                    displayEventTime={false} // Evita que FullCalendar muestre la hora automáticamente (ya la ponemos en el título)
                    allDaySlot={false} // Ocultar la sección "todo el día"
                    slotLabelFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        meridiem: false
                    }}
                    slotMinTime="06:00:00"
                    slotMaxTime="30:00:00"
                />
            </div>


            {/* --- MODAL DE DETALLE DE EVENTO --- */}
            <Modal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                title="Detalle del Evento"
            >
                {selectedEvent && (
                    <div className="space-y-6">
                        {/* Encabezado con Título */}
                        <div className="flex items-start gap-3">
                            <div className={`p-3 rounded-full ${selectedEvent.type === 'class' ? 'bg-blue-100 text-blue-600' : selectedEvent.type === 'general' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                                {selectedEvent.type === 'class' ? <FaBook size={24} /> : selectedEvent.type === 'general' ? <FaInfoCircle size={24} /> : <FaCalendarDay size={24} />}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-text-primary leading-tight">{selectedEvent.displayTitle}</h3>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${selectedEvent.type === 'class' ? 'bg-blue-100 text-blue-700' : selectedEvent.type === 'general' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                    {selectedEvent.type === 'class' ? 'Clase' : selectedEvent.type === 'general' ? 'Recordatorio' : 'Examen / Entrega'}
                                </span>
                            </div>
                        </div>

                        {/* Detalles */}
                        <div className="space-y-4 bg-surface-50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                            {selectedEvent.subjectName && (
                                <div className="flex items-center gap-3 text-text-secondary">
                                    <FaBook className="text-primary" />
                                    <span className="font-medium text-text-primary">{selectedEvent.subjectName}</span>
                                </div>
                            )}

                            {selectedEvent.hasTime && (
                                <div className="flex items-center gap-3 text-text-secondary">
                                    <FaClock className="text-primary" />
                                    <span>
                                        {new Date(selectedEvent.originalStart).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs
                                    </span>
                                </div>
                            )}

                            {selectedEvent.classroom && (
                                <div className="flex items-center gap-3 text-text-secondary">
                                    <FaMapMarkerAlt className="text-primary" />
                                    <span>Aula: {selectedEvent.classroom}</span>
                                </div>
                            )}
                        </div>

                        {/* Acciones */}
                        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                            {selectedEvent.type === 'event' && (
                                <button
                                    onClick={handleDeleteEvent}
                                    className="btn btn-error flex-1 flex items-center justify-center gap-2"
                                >
                                    <FaTrash /> Eliminar
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className={`btn btn-ghost flex-1 ${selectedEvent.type !== 'event' ? 'w-full' : ''}`}
                            >
                                Cerrar
                            </button>
                        </div>

                        {/* Mensajes informativos para tipos no borrables */}
                        {selectedEvent.type !== 'event' && (
                            <p className="text-xs text-center text-text-secondary mt-2">
                                {selectedEvent.type === 'class'
                                    ? "Gestiona las clases desde la configuración de la materia."
                                    : "Gestiona este evento desde 'Eventos Generales'."}
                            </p>
                        )}
                    </div>
                )}
            </Modal>
            <ConfirmationDialog />
        </div >
    );
};

export default CalendarPage;