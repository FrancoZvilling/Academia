import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNotebookGrades, deleteSubjectAndItsGrades } from '../services/firestoreService';
import { FaBook, FaTrash } from 'react-icons/fa';
import useConfirm from '../hooks/useConfirm';
import { toast } from 'react-toastify';

const NotebookPage = () => {
    const { currentUser } = useAuth();
    const [allGrades, setAllGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ConfirmationDialog, confirm] = useConfirm();

    const fetchGrades = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const snapshot = await getNotebookGrades(currentUser.uid);
            const gradesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAllGrades(gradesData);
        } catch (error) {
            console.error("Error al cargar la libreta:", error);
            toast.error("No se pudieron cargar las notas de la libreta.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, [currentUser]);

    const handleDeleteSubjectHistory = async (subject) => {
        const result = await confirm(
            `Eliminar Historial de "${subject.name}"`,
            `¿Estás seguro? Se borrarán TODAS las notas (${subject.grades.length}) de esta materia de tu libreta permanentemente. Esta acción no se puede deshacer.`
        );

        if (result) {
            try {
                // Buscamos una nota de esa materia para obtener su subjectId, que es el mismo para todas.
                const gradeWithId = allGrades.find(g => g.subjectName === subject.name);
                if (gradeWithId && gradeWithId.subjectId) {
                    await deleteSubjectAndItsGrades(currentUser.uid, gradeWithId.subjectId);
                    toast.info(`Historial de "${subject.name}" eliminado.`);
                    fetchGrades(); // Recargamos para que desaparezca de la libreta
                } else {
                    throw new Error("No se pudo encontrar el ID de la materia para el borrado.");
                }
            } catch (error) {
                console.error("Error al borrar el historial de la materia:", error);
                toast.error("No se pudo eliminar el historial de la materia.");
            }
        }
    };

    const { subjectsWithAverages, overallAverage } = useMemo(() => {
        if (allGrades.length === 0) {
            return { subjectsWithAverages: [], overallAverage: '0.00' };
        }

        const subjectsMap = allGrades.reduce((acc, grade) => {
            const subjectName = grade.subjectName || "Materia Desconocida";
            if (!acc[subjectName]) {
                acc[subjectName] = {
                    grades: [],
                    color: grade.subjectColor || '#6b7280',
                };
            }
            acc[subjectName].grades.push(grade.score);
            return acc;
        }, {});

        let totalSum = 0;
        let totalCount = 0;

        const subjectsArray = Object.keys(subjectsMap).map(subjectName => {
            const subjectData = subjectsMap[subjectName];
            const sum = subjectData.grades.reduce((a, b) => a + b, 0);
            const average = sum / subjectData.grades.length;
            
            totalSum += sum;
            totalCount += subjectData.grades.length;

            return {
                name: subjectName,
                color: subjectData.color,
                grades: subjectData.grades.sort((a,b) => a - b),
                average: average.toFixed(2)
            };
        });

        const overallAvg = totalCount > 0 ? (totalSum / totalCount).toFixed(2) : '0.00';

        return { subjectsWithAverages: subjectsArray, overallAverage: overallAvg };
    }, [allGrades]);

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
                {subjectsWithAverages.length > 0 ? (
                    subjectsWithAverages.map(subject => (
                        <div key={subject.name} className="bg-surface-100 rounded-lg shadow-md overflow-hidden">
                            <div 
                                className="p-4 flex justify-between items-center border-l-8"
                                style={{ borderColor: subject.color }}
                            >
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-semibold">{subject.name}</h2>
                                    <button 
                                        onClick={() => handleDeleteSubjectHistory(subject)} 
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
                                {subject.grades.map((score, index) => (
                                    <div key={index} className="badge badge-lg bg-surface-200 text-text-primary font-semibold border-none">
                                        {score}
                                    </div>
                                ))}
                            </div>
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