import { Link } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import { defaultSubjectColor } from '../config/colors'; // Importamos el color por defecto

/**
 * Componente que renderiza la tarjeta de una materia en el dashboard con un diseño horizontal.
 * @param {object} subject - El objeto de la materia con todos sus datos.
 * @param {function} onDelete - La función que se ejecuta al hacer clic en el botón de borrar.
 */
const SubjectCard = ({ subject, onDelete }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete();
  };

  // Pequeña función auxiliar para formatear el horario y evitar JSX complejo en el return
  const formatSchedule = () => {
    if (!subject.schedule || subject.schedule.length === 0) {
      return (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-center text-gray-400 italic">
          Sin horario de cursada
        </div>
      );
    }
    
    const days = subject.schedule.map(slot => slot.day.substring(0,3)).join(' / ');
    const startTime = subject.schedule[0]?.startTime;
    const endTime = subject.schedule[0]?.endTime;

    let timeRange = "Horario a conf.";
    if (startTime && endTime) {
      timeRange = `${startTime} - ${endTime}`;
    } else if (startTime) {
      timeRange = `desde ${startTime}`;
    }

    return (
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm flex justify-between items-center">
        <span className="font-medium text-gray-700 dark:text-gray-300">{days}</span>
        <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">{timeRange}</span>
      </div>
    );
  };

  return (
    <div className="relative group transition-all duration-300 transform hover:scale-105">
      <Link to={`/materia/${subject.id}`} className="block">
        <div 
            className="p-4 bg-surface-100 rounded-lg shadow-md h-36 flex flex-col justify-between border-t-4"
            // Aplicamos el color de la materia al borde superior. Si no tiene, usamos el color por defecto.
            style={{ borderColor: subject.color || defaultSubjectColor }}
        >
          {/* Parte superior: Nombre, Profesor y Aula */}
          <div>
            <h3 className="font-bold text-lg text-text-primary truncate">{subject.name}</h3>
            <p className="text-sm text-text-secondary truncate">{subject.professor || 'Profesor no asignado'}</p>
            {subject.classroom && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Aula: {subject.classroom}</p>
            )}
          </div>
          
          {/* Parte inferior: Horario resumido */}
          {formatSchedule()}
        </div>
      </Link>

      {/* Botones de acción */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleDelete}
          className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-700"
          aria-label={`Eliminar materia ${subject.name}`}
          title={`Eliminar ${subject.name}`}
        >
          <FaTrash size={10} />
        </button>
      </div>
    </div>
  );
};

export default SubjectCard;