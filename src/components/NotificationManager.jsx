// src/components/NotificationManager.jsx
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { messaging } from '../config/firebase-config';
import { getToken } from 'firebase/messaging';
import { saveFcmToken } from '../services/firestoreService';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'react-toastify';

const NotificationManager = () => {
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        const setupNotifications = async () => {
            if (Capacitor.isNativePlatform()) {
                // --- LÓGICA NATIVA (ANDROID) ---
                try {
                    // 1. Solicitar permiso
                    const permStatus = await PushNotifications.checkPermissions();

                    let permission = permStatus.receive;
                    if (permission === 'prompt') {
                        const result = await PushNotifications.requestPermissions();
                        permission = result.receive;
                    }

                    if (permission === 'granted') {
                        console.log('Permiso de Push Nativo concedido.');

                        // 2. Registrar en FCM
                        await PushNotifications.register();

                        // 3. Listeners
                        PushNotifications.addListener('registration', async (token) => {
                            console.log('NATIVE FCM Token:', token.value);
                            await saveFcmToken(currentUser.uid, token.value);
                        });

                        PushNotifications.addListener('registrationError', (error) => {
                            console.error('Error on registration: ', error);
                        });

                        PushNotifications.addListener('pushNotificationReceived', (notification) => {
                            console.log('Push received:', notification);
                            // Capacitor muestra la notificacion en system tray automáticamente si la app está en background
                            // Si está en foreground, puedes mostrar un toast o alerta
                            toast.info(`Nuevo mensaje: ${notification.title || 'Notificación'}`);
                        });

                        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                            console.log('Push action performed:', notification);
                            // Aquí podrías navegar a una pantalla específica
                        });

                    } else {
                        console.log('Permiso de Push Nativo denegado.');
                    }
                } catch (e) {
                    console.error("Error configurando Push Nativo:", e);
                }

            } else {
                // --- LÓGICA WEB ---
                if ('Notification' in window && 'serviceWorker' in navigator) {
                    try {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                            if (vapidKey) {
                                const currentToken = await getToken(messaging, { vapidKey });
                                if (currentToken) {
                                    console.log('WEB FCM Token:', currentToken);
                                    await saveFcmToken(currentUser.uid, currentToken);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error al obtener token Web:', error);
                    }
                }
            }
        };

        // Ejecutar configuración (sin delay artificial, Capacitor maneja bien esto)
        setupNotifications();

        return () => {
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
            }
        };

    }, [currentUser]);

    return null;
};

export default NotificationManager;