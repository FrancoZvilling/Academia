// src/components/NotificationManager.jsx (NUEVO ARCHIVO)
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { messaging } from '../config/firebase-config';
import { getToken } from 'firebase/messaging';
import { saveFcmToken } from '../services/firestoreService';
import { toast } from 'react-toastify';

const NotificationManager = () => {
    const { currentUser } = useAuth();

    useEffect(() => {
        const requestPermission = async () => {
            if (currentUser && 'Notification' in window && 'serviceWorker' in navigator) {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        console.log('Permiso de notificación concedido.');
                        
                        // Obtenemos la VAPID key de la configuración de Vite
                        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                        if (!vapidKey) {
                            console.error("VAPID key no encontrada en las variables de entorno.");
                            return;
                        }
                        
                        // Obtenemos el token de FCM
                        const currentToken = await getToken(messaging, { vapidKey });

                        if (currentToken) {
                            console.log('Token de FCM obtenido:', currentToken);
                            // Guardamos el token en Firestore
                            await saveFcmToken(currentUser.uid, currentToken);
                        } else {
                            console.log('No se pudo obtener el token de registro. Pide permiso de nuevo.');
                        }
                    } else {
                        console.log('Permiso de notificación denegado.');
                    }
                } catch (error) {
                    console.error('Ocurrió un error al obtener el token.', error);
                }
            }
        };

        // Pedimos permiso un poco después de que la app cargue para no ser intrusivos
        const timer = setTimeout(requestPermission, 5000); // 5 segundos después de loguearse

        return () => clearTimeout(timer);

    }, [currentUser]);

    return null; // Este componente no renderiza nada en la UI
};

export default NotificationManager;