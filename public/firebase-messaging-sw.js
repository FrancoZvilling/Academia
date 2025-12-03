// Este archivo debe estar en la carpeta 'public' para que Firebase lo encuentre.
// Es el service worker que recibirá las notificaciones push cuando la app esté en segundo plano.

// Por ahora, solo necesitamos que importe e inicialice el SDK de Firebase.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA4IjINRaou_osmp78EBCyP7lhW6g2MJ-k",
  authDomain: "estud-ia-a94a3.firebaseapp.com",
  projectId: "estud-ia-a94a3",
  storageBucket: "estud-ia-a94a3.firebasestorage.app",
  messagingSenderId: "214777208525",
  appId: "1:214777208525:web:e604e651a48b23c4525384"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Opcional: Manejar notificaciones en segundo plano (lo veremos más adelante)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Personaliza la notificación aquí si es necesario
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});