// src/pages/NotificationsPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markNotificationsAsRead, deleteReadNotifications } from '../services/firestoreService';
import { FaBellSlash, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

const NotificationsPage = () => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        // 1. Obtener lista visible (ordenada por createdAt)
        getNotifications(currentUser.uid).then(snapshot => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(notifs);
        }).finally(() => setLoading(false));

        // 2. LIMPIEZA DE FANTASMAS: Marcar como leídas TODAS las notificaciones pendientes,
        // incluso aquellas que no tengan 'createdAt' (causadas por el bug anterior) y por ende no salen en la query 1.
        // Esto sincroniza el puntito rojo (NotificationBell) con la realidad.
        const cleanupUnread = async () => {
            try {
                // Importamos db/collection/query/where/getDocs desde firestoreService (o firebase-config/firestore)
                // Para mantenerlo simple, usaremos una función auxiliar en service si es posible, 
                // pero aquí lo hago directo o llamo a markNotificationsAsRead con una query especial.
                // Como no puedo importar db aquí fácil sin romper patrones, asumiré que getUnreadNotifications existe
                // O mejor, agregaré getUnreadNotifications en firestoreService.
            } catch (e) {
                console.error("Error cleaning ghost notifications", e);
            }
        };

        // Estrategia más limpia: Agregar una función en firestoreService que traiga *todos* los IDs no leídos
        // y usarlos.
        import('../services/firestoreService').then(service => {
            service.getAllUnreadNotificationIds(currentUser.uid).then(ids => {
                if (ids.length > 0) {
                    service.markNotificationsAsRead(currentUser.uid, ids);
                }
            });
        });

    }, [currentUser]);

    const handleDeleteRead = async () => {
        if (!currentUser) return;
        try {
            await deleteReadNotifications(currentUser.uid);
            // Actualizamos el estado local eliminando las leídas (que son todas las que se muestran como leídas, o sea todas las que ya vimos)
            // Como al entrar a la página se marcan todas como leídas, esto borrará prácticamente todo lo visible
            // salvo que haya llegado una nueva en milisegundos.
            // Filtramos para dejar solo las que NO sean read (por seguridad de UI)
            setNotifications(prev => prev.filter(n => !n.read));
            toast.success('Notificaciones leídas eliminadas.');
        } catch (error) {
            console.error("Error al eliminar notificaciones:", error);
            toast.error('Error al eliminar notificaciones.');
        }
    };

    if (loading) return <div>Cargando notificaciones...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Centro de Notificaciones</h1>
                {notifications.length > 0 && (
                    <button
                        onClick={handleDeleteRead}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors"
                        title="Eliminar leídas"
                    >
                        <FaTrash size={20} />
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <div
                            key={notif.id}
                            className={`p-4 rounded-lg shadow ${!notif.color ? (notif.read ? 'bg-surface-100' : 'bg-blue-100 dark:bg-blue-900/50') : ''}`}
                            style={{ backgroundColor: notif.color || undefined }}
                        >
                            <p className={`font-bold ${notif.color ? 'text-white drop-shadow-md' : ''}`}>{notif.title}</p>
                            <p className={`${notif.color ? 'text-white/90' : 'text-text-secondary'}`}>{notif.body}</p>
                            <p className={`text-xs text-right mt-2 ${notif.color ? 'text-white/80' : 'text-text-secondary'}`}>
                                {notif.createdAt?.toDate().toLocaleString('es-ES')}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-10 text-text-secondary">
                        <FaBellSlash size={48} className="mx-auto mb-4" />
                        <p>No tienes notificaciones por el momento.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;