import * as admin from 'firebase-admin';

let adminDbInstance: admin.firestore.Firestore | null = null;
let adminAuthInstance: admin.auth.Auth | null = null;

function getFirestoreInstance(): admin.firestore.Firestore {
  if (!adminDbInstance) {
    const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing env vars: ${missing.join(', ')}`);
    }
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
      });
    }
    adminDbInstance = admin.firestore();
  }
  return adminDbInstance;
}

function getAuthInstance(): admin.auth.Auth {
  if (!adminAuthInstance) {
    getFirestoreInstance();
    adminAuthInstance = admin.auth();
  }
  return adminAuthInstance;
}

const adminDbProxy = new Proxy({}, {
  get(_target, prop) {
    return getFirestoreInstance()[prop as keyof admin.firestore.Firestore];
  }
}) as unknown as admin.firestore.Firestore;

const adminAuthProxy = new Proxy({}, {
  get(_target, prop) {
    return getAuthInstance()[prop as keyof admin.auth.Auth];
  }
}) as unknown as admin.auth.Auth;

export const adminDb = adminDbProxy;
export const adminAuth = adminAuthProxy;

export function getAdminDb(): admin.firestore.Firestore {
  return getFirestoreInstance();
}

export function getAdminAuth(): admin.auth.Auth {
  return getAuthInstance();
}
