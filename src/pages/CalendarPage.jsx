import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateRecurringEvents } from '../utils/dateUtils';
import { 
    getGeneralEvents,
    getYearsForUser, 
    getSubjectsForYear, 
    getAllEventsForUser, 
    deleteEvent 
} from '../services/firestoreService';
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

                const [singleEvents, classEvents, generalEvents] = await Promise.all([
                    singleEventsPromise, 
                    classEventsPromise, 
                    generalEventsPromise
                ]);

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
    const calendarView = isMobile ? 'listWeek' : 'dayGridMonth';
    const calendarHeader = isMobile ? { left: 'title', center: '', right: 'today' } : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' };
    const calendarFooter = isMobile ? { left: 'prev,next', center: '', right: 'dayGridMonth,timeGridWeek,listWeek' } : false;
    
    if (loading) return <div className="flex justify-center items-center h-full pt-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

    return (
        <div>
            <ConfirmationDialog />
            <h1 className="text-3xl font-bold mb-6">Calendario General</h1>
            <div className="p-4 bg-surface-100 rounded-lg shadow-md" key={isMobile ? 'mobile' : 'desktop'}>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                    initialView={calendarView}
                    headerToolbar={calendarHeader}
                    footerToolbar={calendarFooter}
                    events={events}
                    eventClick={handleEventClick}
                    locale="es"
                    buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día', list: 'Lista' }}
                    allDayText="Eventos" // <-- Punto 1 solucionado
                    height="auto"
                    weekends={true}
                    dayMaxEventRows={true}
                    listDayFormat={{ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }}
                    listDaySideFormat={false}
                    noEventsContent="No hay eventos para mostrar"
                    titleFormat={{ month: isMobile ? 'short' : 'long', year: 'numeric' }}
                    buttonIcons={{ prev: 'chevron-left', next: 'chevron-right' }}
                />
            </div>
        </div>
    );
};

export default CalendarPage;