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

    const { currentPin, newPin, restaurantId } = body;
    const now = new Date();

    if (!currentPin || !newPin || typeof currentPin !== 'string' || typeof newPin !== 'string') {
      return NextResponse.json({ error: 'Current PIN and new PIN are required' }, { status: 400 });
    }

    if (!restaurantId || typeof restaurantId !== 'string') {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    // 2. Enforce Strong PIN Policy
    const strength = isStrongPin(newPin);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.error }, { status: 400 });
    }

    // 3. Verify Current PIN for this specific restaurant
    const isCurrentValid = await validateAdminPin(currentPin, restaurantId);

    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Unauthorized: Invalid current PIN' }, { status: 401 });
    }

    // 4. Hash New PIN for Secure Storage
    const hashedPin = hashPin(newPin);

    // 5. Update PIN in Firestore for the specific restaurant
    await adminDb.collection('restaurants').doc(restaurantId).update({
      adminPinHash: hashedPin,
      updated_at: now
    });

    return NextResponse.json({ success: true, message: 'PIN updated successfully' });
  } catch (error: unknown) {
    console.error('[UpdatePin] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
