import { adminDb } from './firebase-admin';
import bcrypt from 'bcryptjs';

/**
 * Validates the admin PIN against the stored value.
 * Supports multi-tenant restaurant PINs and global fallback.
 */
export async function validateAdminPin(pin: string, restaurantId?: string): Promise<{ isValid: boolean, role: 'manager' | 'staff' }> {
  if (!pin) return { isValid: false, role: 'staff' };

  let adminStoredPin = process.env.NEXT_PUBLIC_ADMIN_PIN || "123456";
  let staffStoredPin = "";
  
  try {
    // 1. Try to fetch from the specific restaurant record first
    if (restaurantId) {
      const rDoc = await adminDb.collection('restaurants').doc(restaurantId).get();
      if (rDoc.exists) {
        if (rDoc.data()?.adminPinHash) adminStoredPin = rDoc.data()?.adminPinHash;
        if (rDoc.data()?.staffPinHash) staffStoredPin = rDoc.data()?.staffPinHash;
      }
    } else {
      // 2. Global fallback (for legacy or setup)
      const configDoc = await adminDb.collection('settings').doc('config').get();
      if (configDoc.exists && configDoc.data()?.adminPin) {
        adminStoredPin = configDoc.data()?.adminPin;
      }
    }
  } catch (err) {
    console.warn('[validateAdminPin] Failed to fetch PIN, using fallback:', err);
  }

  // Check Admin PIN first
  const isAdminHashed = adminStoredPin.startsWith('$2a$') || adminStoredPin.startsWith('$2b$');
  if (isAdminHashed ? bcrypt.compareSync(pin, adminStoredPin) : pin === adminStoredPin) {
    return { isValid: true, role: 'manager' };
  }

  // Check Staff PIN if provided
  if (staffStoredPin) {
    const isStaffHashed = staffStoredPin.startsWith('$2a$') || staffStoredPin.startsWith('$2b$');
    if (isStaffHashed ? bcrypt.compareSync(pin, staffStoredPin) : pin === staffStoredPin) {
      return { isValid: true, role: 'staff' };
    }
  }

  return { isValid: false, role: 'staff' };
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
