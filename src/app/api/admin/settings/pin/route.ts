import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateAdminPin, isStrongPin, hashPin } from '@/lib/admin-utils';
import { parseAndValidateBody } from '@/lib/api-security';

export async function POST(request: Request) {
  try {
    // 1. Parse body with 1MB size limit
    const parsed = await parseAndValidateBody(request);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    const { currentPin, newPin } = body;

    if (!currentPin || !newPin || typeof currentPin !== 'string' || typeof newPin !== 'string') {
      return NextResponse.json({ error: 'Current PIN and new PIN are required' }, { status: 400 });
    }

    // 2. Enforce Strong PIN Policy
    const strength = isStrongPin(newPin);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.error }, { status: 400 });
    }

    // 3. Verify Current PIN
    const isCurrentValid = await validateAdminPin(currentPin);

    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Unauthorized: Invalid current PIN' }, { status: 401 });
    }

    // 4. Hash New PIN for Secure Storage
    const hashedPin = hashPin(newPin);

    // 5. Update PIN in Firestore
    await adminDb.collection('settings').doc('config').set({
      adminPin: hashedPin,
      updated_at: new Date()
    }, { merge: true });

    return NextResponse.json({ success: true, message: 'PIN updated successfully' });
  } catch (error: unknown) {
    console.error('[UpdatePin] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
