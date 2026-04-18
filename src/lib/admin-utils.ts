import { adminDb } from './firebase-admin';

export async function validateAdminPin(pin: string): Promise<boolean> {
  if (!pin) return false;

  let adminPin = process.env.NEXT_PUBLIC_ADMIN_PIN || "1234";
  
  try {
    const configDoc = await adminDb.collection('settings').doc('config').get();
    if (configDoc.exists && configDoc.data()?.adminPin) {
      adminPin = configDoc.data()?.adminPin;
    }
  } catch (err) {
    console.warn('[validateAdminPin] Failed to fetch PIN from Firestore, using fallback:', err);
  }

  return pin === adminPin;
}
