import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDpvKiJ9zwubVXPW23e_I6iNCpp78WAiSo",
  authDomain: "tablio-mvp-7f742.firebaseapp.com",
  projectId: "tablio-mvp-7f742",
  storageBucket: "tablio-mvp-7f742.firebasestorage.app",
  messagingSenderId: "333055145598",
  appId: "1:333055145598:web:1c5b737c90e7a372134a2f"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
