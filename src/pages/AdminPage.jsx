// src/pages/AdminPage.jsx (NUEVO ARCHIVO)
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'react-toastify';

const AdminPage = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    const adminUID = "40HuVxGw1KfO73hqJDiOb9OERIp1"; // <-- ¡IMPORTANTE!

    useEffect(() => {
        const fetchUsers = async () => {
            if (currentUser?.uid !== adminUID) {
                setError("Acceso denegado.");
                setLoading(false);
                return;
            }
            try {
                const functions = getFunctions(undefined, "southamerica-east1");
                const adminTasks = httpsCallable(functions, 'adminTasks');
                const result = await adminTasks({ action: 'LIST_USERS' });
                setUsers(result.data.users);
            } catch (err) {
                console.error("Error al obtener la lista de usuarios:", err);
                toast.error(err.message || "No se pudo cargar la lista de usuarios.");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [currentUser]);

    const handleUpdatePlan = async (userId, newPlan) => {
        if (!window.confirm(`¿Seguro que quieres cambiar el plan de este usuario a ${newPlan}?`)) return;

        try {
            const functions = getFunctions(undefined, "southamerica-east1");
            const adminTasks = httpsCallable(functions, 'adminTasks');
            await adminTasks({ 
                action: 'UPDATE_USER_PLAN',
                payload: { userId, newPlan }
            });
            toast.success("¡Plan de usuario actualizado!");
            // Podríamos refresecar la lista, pero por ahora no es crucial
        } catch (err) {
            console.error("Error al actualizar el plan:", err);
            toast.error(err.message || "No se pudo actualizar el plan.");
        }
    };

    const filteredUsers = users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (currentUser?.uid !== adminUID) {
        return <div className="p-10 text-center">No tienes permiso para acceder a esta página.</div>;
    }
    
    if (loading) return <div className="flex justify-center items-center h-full"><span className="loading loading-spinner loading-lg"></span></div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Panel de Administrador</h1>
            <input 
                type="text"
                placeholder="Buscar por nombre o email..."
                className="input input-bordered w-full max-w-xs mb-6"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="overflow-x-auto bg-surface-100 rounded-lg shadow">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>UID</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.uid}>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="avatar"><div className="mask mask-squircle w-12 h-12"><img src={user.photoURL} alt="Avatar"/></div></div>
                                        <div><div className="font-bold">{user.displayName || 'Sin Nombre'}</div></div>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td className="text-xs">{user.uid}</td>
                                <th>
                                    <button className="btn btn-primary btn-xs" onClick={() => handleUpdatePlan(user.uid, 'premium')}>Activar Premium</button>
                                    <button className="btn btn-ghost btn-xs ml-2" onClick={() => handleUpdatePlan(user.uid, 'free')}>Desactivar</button>
                                </th>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPage;