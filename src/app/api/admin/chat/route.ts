import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { parseAndValidateBody, requireAdminAuth, requireRestaurantId } from '@/lib/api-security';

export async function POST(request: Request) {
  try {
    const parsed = await parseAndValidateBody(request);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    // 2. Validate JWT Authentication
    const auth = await requireAdminAuth(request);
    if ('error' in auth) return auth.error;
    const { restaurantId } = auth;

    const orderId = body.orderId as string;
    const tableNumber = body.tableNumber as string;
    const text = (body.text || body.message) as string;

    if (!text) {
      return NextResponse.json({ error: 'Missing message text' }, { status: 400 });
    }

    if (!orderId && !tableNumber) {
      return NextResponse.json({ error: 'Missing orderId or tableNumber' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    if (orderId) {
      // Security: Check if order belongs to restaurant
      const orderRef = adminDb.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists || orderDoc.data()?.restaurantId !== restaurantId) {
        return NextResponse.json({ error: 'Forbidden: Order mismatch' }, { status: 403 });
      }

      // Add message via Admin SDK to subcollection
      await orderRef.collection('messages').add({
        text,
        sender: 'admin',
        timestamp: FieldValue.serverTimestamp()
      });
    } else {
      // Add message via Admin SDK to top-level collection
      await adminDb.collection('messages').add({
        restaurantId,
        tableNumber,
        roomId: `${restaurantId}_${tableNumber}`,
        message: text,
        sender: 'admin',
        createdAt: FieldValue.serverTimestamp()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
