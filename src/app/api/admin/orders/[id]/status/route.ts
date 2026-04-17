import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, pin } = await request.json();

    // 1. Validate Admin PIN
    const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "1234";
    if (pin !== ADMIN_PIN) {
      return NextResponse.json({ error: 'Unauthorized: Invalid PIN' }, { status: 401 });
    }

    // 2. Update Order using Admin SDK (bypasses security rules)
    const orderRef = adminDb.collection('orders').doc(id);
    await orderRef.update({
      status,
      updated_at: new Date()
    });

    return NextResponse.json({ success: true, message: `Order ${id} updated to ${status}` });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
