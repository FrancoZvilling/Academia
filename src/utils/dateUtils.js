// src/utils/dateUtils.js (NUEVO ARCHIVO)

/**
 * Genera todas las ocurrencias de un evento recurrente dentro de un rango de fechas.
 * @param {object} subject - El objeto de la materia.
 * @returns {Array<object>} - Un array de eventos listos para FullCalendar.
 */
export const generateRecurringEvents = (subject) => {
  if (!subject.schedule || subject.schedule.length === 0 || !subject.startDate) {
    return [];
  }

  const events = [];
  const dayMapping = { "Lunes": 1, "Martes": 2, "Miércoles": 3, "Jueves": 4, "Viernes": 5, "Sábado": 6 };
  
  // Usamos el primer slot para obtener la hora
  const startTime = subject.schedule[0]?.startTime;
  const endTime = subject.schedule[0]?.endTime;

  // Convertimos los días de la semana a números (0=Domingo, 1=Lunes...)
  const targetDays = subject.schedule.map(slot => dayMapping[slot.day]);

  let currentDate = new Date(subject.startDate + 'T00:00:00Z');
  // Si no hay fecha de fin, generamos eventos para los próximos 6 meses como límite de seguridad
  const endDate = subject.endDate 
    ? new Date(subject.endDate + 'T00:00:00Z') 
    : new Date(new Date(currentDate).setMonth(currentDate.getMonth() + 6));

  // Iteramos día por día desde el inicio hasta el fin
  while (currentDate <= endDate) {
    // getUTCDay() devuelve el día de la semana (0-6)
    if (targetDays.includes(currentDate.getUTCDay())) {
      // Si el día de la semana coincide, creamos un evento
      events.push({
        id: `class-${subject.id}-${currentDate.toISOString()}`,
        title: subject.name,
        start: `${currentDate.toISOString().split('T')[0]}${startTime ? `T${startTime}` : ''}`,
        end: `${currentDate.toISOString().split('T')[0]}${endTime ? `T${endTime}` : ''}`,
        allDay: !startTime,
        color: subject.color || '#3b82f6',
        editable: false,
        extendedProps: { type: 'class', classroom: subject.classroom }
      });
    }
    // Pasamos al siguiente día
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return events;
};