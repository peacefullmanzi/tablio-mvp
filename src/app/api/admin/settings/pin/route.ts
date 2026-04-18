import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateAdminPin } from '@/lib/admin-utils';

export async function POST(request: Request) {
  try {
    const { currentPin, newPin } = await request.json();

    if (!currentPin || !newPin) {
      return NextResponse.json({ error: 'Current PIN and new PIN are required' }, { status: 400 });
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      return NextResponse.json({ error: 'New PIN must be a 4-digit number' }, { status: 400 });
    }

    // 1. Verify Current PIN
    const isCurrentValid = await validateAdminPin(currentPin);

    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Unauthorized: Invalid current PIN' }, { status: 401 });
    }

    // 2. Update PIN in Firestore
    await adminDb.collection('settings').doc('config').set({
      adminPin: newPin,
      updated_at: new Date()
    }, { merge: true });

    return NextResponse.json({ success: true, message: 'PIN updated successfully' });
  } catch (error: any) {
    console.error('[UpdatePin] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
