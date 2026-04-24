import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { parseAndValidateBody, requireAdminAuth, requireRestaurantId } from '@/lib/api-security';

export async function POST(request: Request) {
  try {
    // 1. Parse body with 1MB size limit
    const parsed = await parseAndValidateBody(request);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    // 2. Validate JWT Authentication
    const auth = await requireAdminAuth(request);
    if ('error' in auth) return auth.error;
    const { restaurantId } = auth;

    // 4. Fetch only THIS restaurant's completed orders
    const snapshot = await adminDb.collection('orders')
      .where('restaurantId', '==', restaurantId)
      .where('status', '==', 'completed')
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: 'No completed orders to clear' });
    }

    // 5. Delete in batch
    const batch = adminDb.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Cleared ${snapshot.size} completed orders` 
    });
  } catch (error: unknown) {
    console.error('Error clearing history:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
