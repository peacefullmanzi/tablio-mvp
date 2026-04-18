import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateAdminPin } from '@/lib/admin-utils';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { pin } = await request.json();

    // 1. Validate Admin PIN
    const isValid = await validateAdminPin(pin);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized: Invalid PIN' }, { status: 401 });
    }

    // 2. Delete using Admin SDK
    await adminDb.collection('menus').doc(id).delete();

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting menu item:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
