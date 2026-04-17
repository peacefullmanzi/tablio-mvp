import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { pin } = await request.json();

    // 1. Validate Admin PIN
    const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "1234";
    if (pin !== ADMIN_PIN) {
      return NextResponse.json({ error: 'Unauthorized: Invalid PIN' }, { status: 401 });
    }

    // 2. Delete using Admin SDK
    await adminDb.collection('menus').doc(id).delete();

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
