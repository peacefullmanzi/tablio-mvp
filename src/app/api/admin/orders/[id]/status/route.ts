import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { parseAndValidateBody, requireAdminPin, requireRestaurantId, requireValidStatus } from '@/lib/api-security';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Validate order ID format
    if (!id || typeof id !== 'string' || id.length > 128) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
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

    // 5. Validate status is a valid enum value
    const statusError = requireValidStatus(body);
    if (statusError) return statusError;
    const status = body.status as string;

    // 6. Confirm the order belongs to this restaurant before updating
    const orderRef = adminDb.collection('orders').doc(id);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists || orderDoc.data()?.restaurantId !== restaurantId) {
      return NextResponse.json({ error: 'Forbidden: Order does not belong to your restaurant' }, { status: 403 });
    }

    // 7. Update Order using Admin SDK
    await orderRef.update({
      status,
      updated_at: new Date()
    });

    return NextResponse.json({ success: true, message: `Order ${id} updated to ${status}` });
  } catch (error: unknown) {
    console.error('Error updating order status:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
