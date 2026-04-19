import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { parseAndValidateBody, requireAdminPin, requireRestaurantId } from '@/lib/api-security';

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

    // 2. Parse body with 1MB size limit
    const parsed = await parseAndValidateBody(request);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    // 3. Validate restaurantId
    const restaurantError = requireRestaurantId(body);
    if (restaurantError) return restaurantError;
    const restaurantId = body.restaurantId as string;

    // 4. Validate Admin PIN
    const pinError = await requireAdminPin(body);
    if (pinError) return pinError;

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
