'use client';

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';

/**
 * Request notification permission and get FCM token.
 * Returns the token string or null if denied/failed.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  try {
    const messaging = getMessaging(app);
    
    // Register the Firebase messaging service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (error) {
    console.error('[FCM] Error getting token:', error);
    return null;
  }
}

/**
 * Listen for foreground messages (when app is open).
 * Calls the callback with the notification payload.
 */
export function onForegroundMessage(callback: (payload: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  try {
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      callback(payload);
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}
