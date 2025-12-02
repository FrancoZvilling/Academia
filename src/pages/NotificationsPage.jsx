// src/pages/NotificationsPage.jsx (NUEVO ARCHIVO)
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markNotificationsAsRead } from '../services/firestoreService';
import { FaBellSlash } from 'react-icons/fa';

const NotificationsPage = () => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        getNotifications(currentUser.uid).then(snapshot => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(notifs);

            // Marcamos las notificaciones como leídas
            const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
            if (unreadIds.length > 0) {
                markNotificationsAsRead(currentUser.uid, unreadIds);
            }
        }).finally(() => setLoading(false));

    }, [currentUser]);

    if (loading) return <div>Cargando notificaciones...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Centro de Notificaciones</h1>
            <div className="space-y-4">
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <div key={notif.id} className={`p-4 rounded-lg shadow ${notif.read ? 'bg-surface-100' : 'bg-blue-100 dark:bg-blue-900/50'}`}>
                            <p className="font-bold">{notif.title}</p>
                            <p className="text-text-secondary">{notif.body}</p>
                            <p className="text-xs text-right text-text-secondary mt-2">
                                {notif.createdAt?.toDate().toLocaleString('es-ES')}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-10 text-text-secondary">
                        <FaBellSlash size={48} className="mx-auto mb-4" />
                        <p>Actualmente en desarrollo. Proximamente tendrás notificaciones</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;