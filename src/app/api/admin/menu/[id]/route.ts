import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { parseAndValidateBody, requireAdminAuth, requireRestaurantId } from '@/lib/api-security';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Validate document ID format
    if (!id || typeof id !== 'string' || id.length > 128) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    // 2. Validate JWT Authentication
    const auth = await requireAdminAuth(request);
    if ('error' in auth) return auth.error;
    const { restaurantId } = auth;

    // 5. Confirm document belongs to this restaurant before deletion
    const existing = await adminDb.collection('menus').doc(id).get();
    if (!existing.exists || existing.data()?.restaurantId !== restaurantId) {
      return NextResponse.json({ error: 'Forbidden: Item does not belong to your restaurant' }, { status: 403 });
    }

    // 6. Delete using Admin SDK
    await adminDb.collection('menus').doc(id).delete();

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting menu item:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
