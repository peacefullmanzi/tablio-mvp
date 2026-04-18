import * as admin from 'firebase-admin';



if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
            console.log('[FirebaseAdmin] Initialized successfully');
        } else {
            console.warn('[FirebaseAdmin] Missing environment variables. Skipping initialization.');
        }
    } catch (error) {
        console.error('[FirebaseAdmin] Initialization error:', error);
    }
}

// Safely export proxies that only call firestore/auth if the app exists
export const adminDb = admin.apps.length ? admin.firestore() : null as unknown as admin.firestore.Firestore;
export const adminAuth = admin.apps.length ? admin.auth() : null as unknown as admin.auth.Auth;
