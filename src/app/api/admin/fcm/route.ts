import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdminAuth } from '@/lib/api-security';

// POST: Register FCM token for this device
export async function POST(request: Request) {
  try {
    const auth = await requireAdminAuth(request);
    if ('error' in auth) return auth.error;
    const { restaurantId } = auth;

    const { token } = await request.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'FCM token is required' }, { status: 400 });
    }

    // Store token in a subcollection under the restaurant
    const tokenRef = adminDb.collection('restaurants').doc(restaurantId).collection('fcmTokens').doc(token);
    await tokenRef.set({
      token,
      updatedAt: new Date(),
      restaurantId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[FCM Register] Error:', error);
    return NextResponse.json({ error: 'Failed to register token' }, { status: 500 });
  }
}
