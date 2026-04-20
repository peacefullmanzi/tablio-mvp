import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { parseAndValidateBody, requireAdminPin, requireRestaurantId } from '@/lib/api-security';

export async function POST(request: Request) {
  try {
    const parsed = await parseAndValidateBody(request);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    // Validate restaurantId
    const restaurantError = requireRestaurantId(body);
    if (restaurantError) return restaurantError;
    const restaurantId = body.restaurantId as string;

    // Validate Admin PIN
    const pinError = await requireAdminPin(body);
    if (pinError) return pinError;

    const orderId = body.orderId as string;
    const text = body.text as string;

    if (!orderId || !text) {
      return NextResponse.json({ error: 'Missing orderId or text' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Security: Check if order belongs to restaurant
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists || orderDoc.data()?.restaurantId !== restaurantId) {
      return NextResponse.json({ error: 'Forbidden: Order mismatch' }, { status: 403 });
    }

    // Add message via Admin SDK
    await orderRef.collection('messages').add({
      text,
      sender: 'admin',
      timestamp: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
