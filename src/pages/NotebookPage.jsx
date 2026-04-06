import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNotebookGrades, deleteSubjectAndItsGrades, getYearsForUser, getSubjectsForYear } from '../services/firestoreService';
import { FaBook, FaTrash, FaCalendarAlt } from 'react-icons/fa';
import useConfirm from '../hooks/useConfirm';
import { toast } from 'react-toastify';
import AccordionItem from '../components/ui/AccordionItem';

const NotebookPage = () => {
    const { currentUser } = useAuth();
    const [yearsData, setYearsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ConfirmationDialog, confirm] = useConfirm();

    const fetchNotebookData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // 1. Obtener todas las notas del usuario (Mi Libreta)
            const gradesSnapshot = await getNotebookGrades(currentUser.uid);
            const allGrades = gradesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (allGrades.length === 0) {
                setYearsData([]);
                setLoading(false);
                return;
            }

            // 2. Agrupar por nombre de año (para que persista aunque se borre el documento del año)
            const groups = {};

            allGrades.forEach(grade => {
                // Fallbacks para datos antiguos o borrados
                const yearName = grade.yearName || "Académico / General";
                const subjectName = grade.subjectName || "Materia Desconocida";
                const subjectId = grade.subjectId; 

                if (!groups[yearName]) {
                    groups[yearName] = {
                        id: grade.yearId || yearName, 
                        name: yearName,
                        subjectsMap: {}
                    };
                }

                if (!groups[yearName].subjectsMap[subjectName]) {
                    groups[yearName].subjectsMap[subjectName] = {
                        id: subjectId || subjectName, 
                        name: subjectName,
                        color: grade.subjectColor || '#6b7280',
                        grades: []
                    };
                }

                groups[yearName].subjectsMap[subjectName].grades.push(grade);
            });

            // 3. Formatear para el componente (Array de años -> Array de materias)
            const formattedYears = Object.values(groups)
                .map(year => {
                    const subjects = Object.values(year.subjectsMap).map(sub => {
                        const sum = sub.grades.reduce((a, b) => a + b.score, 0);
                        const average = sub.grades.length > 0 ? (sum / sub.grades.length).toFixed(2) : '0.00';
                        
                        return {
                            ...sub,
                            average,
                            grades: sub.grades.sort((a, b) => a.score - b.score)
                        };
                    });

                    return {
                        id: year.id,
                        name: year.name,
                        subjects: subjects.sort((a, b) => a.name.localeCompare(b.name))
                    };
                })
                .sort((a, b) => b.name.localeCompare(a.name)); // Ordenar años descendente

            setYearsData(formattedYears);
        } catch (error) {
            console.error("Error al cargar la libreta:", error);
            toast.error("No se pudieron cargar los datos de la libreta.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotebookData();
    }, [currentUser]);

    const handleDeleteSubjectHistory = async (subject) => {
        const result = await confirm(
            `Eliminar Historial de "${subject.name}"`,
            `¿Estás seguro? Se borrarán TODAS las notas (${subject.grades.length}) de esta materia de tu libreta permanentemente. Esta acción no se puede deshacer.`
        );

        if (result) {
            try {
                await deleteSubjectAndItsGrades(currentUser.uid, subject.id);
                toast.info(`Historial de "${subject.name}" eliminado.`);
                fetchNotebookData(); // Recargar datos
            } catch (error) {
                console.error("Error al borrar el historial de la materia:", error);
                toast.error("No se pudo eliminar el historial de la materia.");
            }
        }
    };

    // Calcular promedio general de todas las notas mostradas
    const overallAverage = useMemo(() => {
        let totalSum = 0;
        let totalCount = 0;

        yearsData.forEach(year => {
            year.subjects.forEach(subject => {
                subject.grades.forEach(grade => {
                    totalSum += grade.score;
                    totalCount++;
                });
            });
        });

        return totalCount > 0 ? (totalSum / totalCount).toFixed(2) : '0.00';
    }, [yearsData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full pt-20">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div>
            <ConfirmationDialog />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Mi Libreta Universitaria</h1>
                <div className="text-center sm:text-right bg-surface-100 p-4 rounded-lg shadow">
                    <div className="text-sm text-text-secondary">Promedio General</div>
                    <div className="text-4xl font-extrabold text-primary">{overallAverage}</div>
                </div>
            </div>

            <div className="space-y-6">
                {yearsData.length > 0 ? (
                    yearsData.map(year => (
                        <div key={year.id} className="bg-surface-50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <AccordionItem title={year.name} icon={FaCalendarAlt} defaultOpen={false}>
                                <div className="space-y-4 pt-2">
                                    {year.subjects.map(subject => (
                                        <div key={subject.id} className="bg-surface-100 rounded-lg shadow-md overflow-hidden border-l-8" style={{ borderColor: subject.color || '#6b7280' }}>
                                            <div className="p-4 flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <h2 className="text-xl font-semibold">{subject.name}</h2>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteSubjectHistory(subject); }}
                                                        className="text-red-500 hover:text-red-700 opacity-50 hover:opacity-100 transition-opacity"
                                                        title={`Eliminar historial de ${subject.name}`}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm text-text-secondary">Promedio</span>
                                                    <p className="text-lg font-bold">{subject.average}</p>
                                                </div>
                                            </div>
                                            <div className="px-6 py-4 flex flex-wrap gap-2 border-t border-surface-200">
                                                {subject.grades.map((grade, index) => (
                                                    <div key={index} className="badge badge-lg bg-surface-200 text-text-primary font-semibold border-none" title={grade.title}>
                                                        {grade.score}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionItem>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-text-secondary p-10 border-2 border-dashed border-surface-200 rounded-lg flex flex-col items-center gap-4">
                        <FaBook size={48} className="text-surface-200" />
                        <h3 className="text-xl font-semibold">Tu libreta está vacía</h3>
                        <p>Añade notas desde cada materia para ver tu progreso académico aquí.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotebookPage;