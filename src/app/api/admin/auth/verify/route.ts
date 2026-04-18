import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateAdminPin } from '@/lib/admin-utils';
import { headers } from 'next/headers';

// In-memory rate limiting (IP-based)
const RATE_LIMIT_MAP = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

export async function POST(request: Request) {
  try {
    const { pin, restaurantId = 'default' } = await request.json();
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';

    // 1. Server-side Rate Limiting (IP)
    const now = Date.now();
    const rateData = RATE_LIMIT_MAP.get(ip);

    if (rateData && now < rateData.resetTime) {
      if (rateData.count >= MAX_REQUESTS) {
        return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
      }
      rateData.count++;
    } else {
      RATE_LIMIT_MAP.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    }

    // 2. Admin Account Lockout (Database-backed per restaurantId)
    const lockoutDoc = await adminDb.collection('settings').doc(`lockout_${restaurantId}`).get();
    if (lockoutDoc.exists) {
      const { failedAttempts, lockedUntil } = lockoutDoc.data() || {};
      if (lockedUntil && now < lockedUntil.toDate().getTime()) {
        return NextResponse.json({ error: 'Account locked due to multiple failed attempts. Try again in 5 minutes.' }, { status: 403 });
      }
    }

    if (!pin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    // 3. Validate PIN
    const isValid = await validateAdminPin(pin);

    if (isValid) {
      // Clear failed attempts on success
      await adminDb.collection('settings').doc(`lockout_${restaurantId}`).delete();
      return NextResponse.json({ success: true });
    } else {
      // 4. Track failed attempts
      const currentLockout = lockoutDoc.data() || { failedAttempts: 0 };
      const newFailedAttempts = currentLockout.failedAttempts + 1;
      
      const lockoutData: any = {
        failedAttempts: newFailedAttempts,
        lastAttempt: new Date()
      };

      if (newFailedAttempts >= 5) {
        lockoutData.lockedUntil = new Date(now + 5 * 60 * 1000); // Lock for 5 minutes
      }

      await adminDb.collection('settings').doc(`lockout_${restaurantId}`).set(lockoutData, { merge: true });

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('[VerifyAuth] Error:', error);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 500 });
  }
}
