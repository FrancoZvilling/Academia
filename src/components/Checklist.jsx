import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { addTaskToSubject, updateTasksForSubject } from '../services/firestoreService';
import { FaTrash, FaPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Checklist = ({ tasks, onAddTask, onToggleTask, onDeleteTask }) => {
    const { register, handleSubmit, reset } = useForm();
    
    const handleFormSubmit = (data) => {
        if (!data.taskText || data.taskText.trim() === '') return;
        onAddTask(data.taskText);
        reset();
    };
    
    // --- FUNCIÓN DE CAMBIO MEJORADA ---
    const handleToggle = (e, taskId) => {
        onToggleTask(taskId); // Llama a la función del padre para actualizar el estado
        e.target.blur();    // ¡AQUÍ ESTÁ LA MAGIA! Quita el foco del checkbox.
    };
    // ------------------------------------
    
    const progress = useMemo(() => {
        if (!tasks || tasks.length === 0) return 0;
        const completedTasks = tasks.filter(task => task.completed).length;
        return Math.round((completedTasks / tasks.length) * 100);
    }, [tasks]);

    return (
        <div className="p-2">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex items-center gap-2 mb-4">
                <input 
                    {...register("taskText")} 
                    placeholder="Añadir nueva tarea..."
                    className="input input-bordered w-full dark:bg-gray-700"
                />
                <button type="submit" className="btn btn-primary btn-circle bg-primary border-primary text-text-accent hover:bg-secondary hover:border-secondary">
                    <FaPlus />
                </button>
            </form>

            <div className="mb-4">
                <div className="flex justify-between text-sm font-semibold text-text-secondary mb-1">
                    <span>Progreso</span>
                    <span>{progress}%</span>
                </div>
                <div className="w-full bg-surface-200 rounded-full h-2.5">
                    <motion.div 
                        className="bg-primary h-2.5 rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                <AnimatePresence>
                    {tasks && tasks.map(task => (
                        <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                            className="flex items-center gap-3 p-3 bg-surface-100 dark:bg-surface-200 rounded-lg shadow-sm"
                        >
                            <input 
                                type="checkbox" 
                                checked={task.completed}
                                // Pasamos el evento (e) a nuestro nuevo handler
                                onChange={(e) => handleToggle(e, task.id)}
                                className="checkbox checkbox-success"
                            />
                            <span className={`flex-grow ${task.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                                {task.text}
                            </span>
                            <button onClick={() => onDeleteTask(task.id)} className="text-red-500 hover:text-red-700 opacity-50 hover:opacity-100 transition-opacity">
                                <FaTrash />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {(!tasks || tasks.length === 0) && <p className="text-center text-text-secondary py-4">¡Todo listo! Añade tu primera tarea.</p>}
            </div>
        </div>
    );
};

export default Checklist;