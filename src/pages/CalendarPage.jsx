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
import { FaChevronLeft, FaChevronRight, FaCalendarDay, FaList, FaTh, FaCalendarWeek } from 'react-icons/fa';
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

    useEffect(() => {
        const fetchAllCalendarData = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                const processEventsForBlockDisplay = (event) => {
                    const hasTime = !event.allDay;
                    const eventDate = new Date(event.start);
                    const timeString = hasTime
                        ? eventDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                        : '';
                    return {
                        ...event,
                        title: hasTime ? `${timeString} ${event.title}` : event.title,
                        start: event.start.split('T')[0],
                        allDay: true,
                        display: 'block',
                        extendedProps: { ...event.extendedProps, hasTime, originalStart: event.start }
                    };
                };
                const singleEventsPromise = getAllEventsForUser(currentUser.uid).then(events => events.map(processEventsForBlockDisplay));
                const generalEventsPromise = getGeneralEvents(currentUser.uid).then(events => events.map(processEventsForBlockDisplay));
                const classEventsPromise = getYearsForUser(currentUser.uid).then(async (yearsSnap) => {
                    let allClassEvents = [];
                    for (const yearDoc of yearsSnap.docs) {
                        const subjectsSnap = await getSubjectsForYear(currentUser.uid, yearDoc.id);
                        for (const subjectDoc of subjectsSnap.docs) {
                            const subject = { id: subjectDoc.id, ...subjectDoc.data() };
                            const generatedEvents = generateRecurringEvents(subject);
                            allClassEvents = [...allClassEvents, ...generatedEvents];
                        }
                    }
                    return allClassEvents;
                });
                const [singleEvents, classEvents, generalEvents] = await Promise.all([singleEventsPromise, classEventsPromise, generalEventsPromise]);
                setEvents([...singleEvents, ...classEvents, ...generalEvents]);
            } catch (error) {
                console.error("Error al cargar datos del calendario:", error);
                toast.error("Hubo un error al cargar el calendario.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllCalendarData();
    }, [currentUser]);

    const handleEventClick = async (clickInfo) => {
        const { extendedProps, title } = clickInfo.event;
        const eventType = extendedProps.type;
        if (eventType === 'class') {
            toast.info(`Clase: ${title}\nAula: ${extendedProps.classroom || 'No especificada'}`, { autoClose: 2000 });
            return;
        }
        let message = `Evento: ${title}`;
        if (extendedProps.hasTime) {
            const time = new Date(extendedProps.originalStart).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            message += `\nHora: ${time} hs`;
        }
        if (eventType === 'general') {
            toast.info(message + `\n(Gestionar desde la página de Eventos Generales)`);
            return;
        }
        if (eventType === 'event') {
            const result = await confirm('Eliminar Evento', `${message}\n\n¿Quieres eliminar este evento?`);
            if (result) {
                try {
                    await deleteEvent(currentUser.uid, extendedProps.yearId, extendedProps.subjectId, clickInfo.event.id);
                    toast.success('Evento eliminado.');
                    setEvents(prevEvents => prevEvents.filter(event => event.id !== clickInfo.event.id));
                } catch (error) {
                    console.error("Error al eliminar el evento:", error);
                    toast.error("No se pudo eliminar el evento.");
                }
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
            <ConfirmationDialog />
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
                    initialView={isMobile ? 'listWeek' : 'dayGridMonth'}
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
                />
            </div>
        </div>
    );
};

export default CalendarPage;