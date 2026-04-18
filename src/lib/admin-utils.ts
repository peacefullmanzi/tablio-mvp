import { adminDb } from './firebase-admin';
import bcrypt from 'bcryptjs';

/**
 * Validates the admin PIN against the stored value.
 * Supports both hashed and plain text (for migration).
 */
export async function validateAdminPin(pin: string): Promise<boolean> {
  if (!pin) return false;

  let storedPin = process.env.NEXT_PUBLIC_ADMIN_PIN || "123456";
  
  try {
    const configDoc = await adminDb.collection('settings').doc('config').get();
    if (configDoc.exists && configDoc.data()?.adminPin) {
      storedPin = configDoc.data()?.adminPin;
    }
  } catch (err) {
    console.warn('[validateAdminPin] Failed to fetch PIN from Firestore, using fallback:', err);
  }

  // Check if stored PIN is hashed (bcrypt hashes start with $2a$ or $2b$)
  const isHashed = storedPin.startsWith('$2a$') || storedPin.startsWith('$2b$');

  if (isHashed) {
    return bcrypt.compareSync(pin, storedPin);
  }

  // Fallback for legacy plain text PINs
  return pin === storedPin;
}

/**
 * Checks if a PIN meets the strong security policy.
 */
export function isStrongPin(pin: string): { valid: boolean; error?: string } {
  if (!/^\d+$/.test(pin)) return { valid: false, error: 'PIN must contain only numbers' };
  if (pin.length < 6) return { valid: false, error: 'PIN must be at least 6 digits' };
  
  // Reject simple patterns
  const simplePatterns = ['123456', '654321', '111111', '222222', '333333', '444444', '555555', '000000', '12345678', '11111111'];
  if (simplePatterns.includes(pin)) return { valid: false, error: 'This PIN is too easy to guess' };
  
  // Reject repeated digits (e.g., 111111)
  if (/^(\d)\1+$/.test(pin)) return { valid: false, error: 'PIN cannot be the same repeated digit' };

  return { valid: true };
}

/**
 * Hashes a PIN for secure storage.
 */
export function hashPin(pin: string): string {
  return bcrypt.hashSync(pin, 10);
}
