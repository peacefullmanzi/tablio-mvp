// Tablio Unified Service Worker (PWA + FCM)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// 1. Initialize Firebase for Background Messaging
firebase.initializeApp({
  apiKey: "AIzaSyDpvKiJ9zwubVXPW23e_I6iNCpp78WAiSo",
  authDomain: "tablio-mvp-7f742.firebaseapp.com",
  projectId: "tablio-mvp-7f742",
  storageBucket: "tablio-mvp-7f742.firebasestorage.app",
  messagingSenderId: "333055145598",
  appId: "1:333055145598:web:1c5b737c90e7a372134a2f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || '🔔 New Order!';
  const options = {
    body: payload.notification?.body || 'You have a new order on Tablio',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40],
    tag: 'tablio-order',
    renotify: true,
    requireInteraction: true, // Keep notification on screen until user dismisses it (PC)
    actions: [
      { action: 'view', title: 'View Order', icon: '/logo.png' },
      { action: 'close', title: 'Dismiss' }
    ],
    data: {
      ...payload.data,
      link: payload.fcmOptions?.link || '/admin'
    },
  };
  self.registration.showNotification(title, options);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/admin';

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(link) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});

// 2. PWA Caching Logic
const CACHE_NAME = 'tablio-pwa-v1';
const PRECACHE_URLS = ['/', '/logo.png', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Network-first for app, ignore Firebase/API calls
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;
  if (event.request.url.includes('firebase')) return;
  if (event.request.url.includes('googleapis')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/admin');
    })
  );
});
