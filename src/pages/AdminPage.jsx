// src/pages/AdminPage.jsx (COMPLETO Y MEJORADO)
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'react-toastify';

const AdminPage = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const adminUID = "40HuVxGw1KfO73hqJDiOb9OERIp1"; // <-- ¡IMPORTANTE!

    const fetchUsers = async () => {
        if (currentUser?.uid !== adminUID) { setLoading(false); return; }
        setLoading(true);
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

    useEffect(() => { fetchUsers(); }, [currentUser]);

    const handleUpdatePlan = async (user, newPlan) => {
        let mercadopagoEmail = user.mercadopagoEmail;

        // Si estamos activando por primera vez y no hay email de MP, lo pedimos.
        if (newPlan === 'premium' && !mercadopagoEmail) {
            mercadopagoEmail = prompt(`Activando Premium para ${user.email}.\n\nIntroduce el email de Mercado Pago asociado a este pago:`);
            if (!mercadopagoEmail) {
                toast.warn("Activación cancelada. Se requiere un email de Mercado Pago.");
                return;
            }
        }
        
        try {
            const functions = getFunctions(undefined, "southamerica-east1");
            const adminTasks = httpsCallable(functions, 'adminTasks');
            await adminTasks({ 
                action: 'UPDATE_USER_PLAN',
                payload: { userId: user.uid, plan: newPlan, mercadopagoEmail }
            });
            toast.success(`Plan de ${user.email} actualizado a ${newPlan}.`);
            fetchUsers(); // Recargamos la lista para ver los cambios
        } catch (err) {
            toast.error(err.message || "No se pudo actualizar el plan.");
        }
    };

    const filteredUsers = useMemo(() => users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [users, searchTerm]);
    
    const getStatus = (user) => {
        if (user.plan !== 'premium') return { text: 'Gratuito', color: 'bg-gray-400' };
        if (!user.premiumUntil) return { text: 'Premium (Sin fecha)', color: 'bg-blue-500' };
        
        const expiryDate = user.premiumUntil.toDate();
        const now = new Date();
        const daysLeft = (expiryDate - now) / (1000 * 60 * 60 * 24);

        if (daysLeft <= 0) return { text: 'Vencido', color: 'bg-red-500' };
        if (daysLeft <= 5) return { text: 'Por Vencer', color: 'bg-yellow-500' };
        return { text: 'Activo', color: 'bg-green-500' };
    };

    if (!currentUser || currentUser.uid !== adminUID) {
        return <div className="p-10 text-center">No tienes permiso para acceder a esta página.</div>;
    }
    if (loading) return <div className="flex justify-center items-center h-full"><span className="loading loading-spinner loading-lg"></span></div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Panel de Administrador</h1>
            <input type="text" placeholder="Buscar por nombre o email..." className="input input-bordered w-full max-w-xs mb-6" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="overflow-x-auto bg-surface-100 rounded-lg shadow">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email de MP</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => {
                            const status = getStatus(user);
                            const isPremium = user.plan === 'premium' && status.text !== 'Vencido';
                            return (
                                <tr key={user.uid} className="hover">
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="avatar"><div className="mask mask-squircle w-12 h-12"><img src={user.photoURL} alt="Avatar"/></div></div>
                                            <div><div className="font-bold">{user.displayName || user.email}</div></div>
                                        </div>
                                    </td>
                                    <td className="text-sm">{user.mercadopagoEmail || 'N/A'}</td>
                                    <td><span className={`badge text-white ${status.color}`}>{status.text}</span></td>
                                    <td>
                                        {isPremium ? (
                                            <button className="btn btn-success btn-xs" onClick={() => handleUpdatePlan(user, 'premium')}>Reactivar</button>
                                        ) : (
                                            <button className="btn btn-primary btn-xs" onClick={() => handleUpdatePlan(user, 'premium')}>Activar Premium</button>
                                        )}
                                        <button className="btn btn-ghost btn-xs ml-2" onClick={() => handleUpdatePlan(user, 'free')}>A Free</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPage;