// src/components/ui/NotificationBell.jsx (NUEVO ARCHIVO)
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { FaBell } from 'react-icons/fa';

const NotificationBell = () => {
    const { currentUser } = useAuth();
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        // Escuchamos en tiempo real si hay notificaciones no leídas
        const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
        const q = query(notificationsRef, where('read', '==', false));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setHasUnread(!snapshot.empty);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Este componente es solo un Link al centro de notificaciones,
    // pero con un indicador visual.
    return (
        <a href="/notificaciones" className="btn btn-ghost btn-circle relative">
            <FaBell size={20} />
            {hasUnread && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-surface-100"></span>
            )}
        </a>
    );
};

export default NotificationBell;