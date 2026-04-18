import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateAdminPin } from '@/lib/admin-utils';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    // 1. Validate Admin PIN
    const isValid = await validateAdminPin(pin);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized: Invalid PIN' }, { status: 401 });
    }

    // 2. Fetch completed orders using Admin SDK
    const snapshot = await adminDb.collection('orders')
      .where('status', '==', 'completed')
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: 'No completed orders to clear' });
    }

    // 3. Delete in batch
    const batch = adminDb.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Cleared ${snapshot.size} completed orders` 
    });
  } catch (error: any) {
    console.error('Error clearing history:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
