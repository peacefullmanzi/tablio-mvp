import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateAdminPin, isStrongPin, hashPin } from '@/lib/admin-utils';
import { parseAndValidateBody, requireAdminAuth } from '@/lib/api-security';

export async function POST(request: Request) {
  try {
    // 1. Parse body with 1MB size limit
    const parsed = await parseAndValidateBody(request);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    // 2. Validate JWT Authentication
    const auth = await requireAdminAuth(request);
    if ('error' in auth) return auth.error;
    
    const currentPin = body.currentPin as string;
    const newPin = body.newPin as string;
    const pinType = (body.pinType as string) || 'manager'; // 'manager' or 'staff'
    const restaurantId = body.restaurantId as string;
    const now = new Date();

    if (!currentPin || !newPin || !restaurantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (auth.restaurantId !== restaurantId) {
      return NextResponse.json({ error: 'Forbidden: Restaurant mismatch' }, { status: 403 });
    }

    // 2. Enforce Strong PIN Policy
    const strength = isStrongPin(newPin);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.error }, { status: 400 });
    }

    // 3. Verify Current PIN for this specific restaurant
    const { isValid, role } = await validateAdminPin(currentPin, restaurantId);

    if (!isValid || role !== 'manager') {
      return NextResponse.json({ error: 'Unauthorized: Invalid current PIN or insufficient permissions' }, { status: 401 });
    }

    // 4. Hash New PIN for Secure Storage
    const hashedPin = hashPin(newPin);

    // 5. Update PIN in Firestore for the specific restaurant
    const updateData: any = { updated_at: now };
    if (pinType === 'staff') {
      updateData.staffPinHash = hashedPin;
    } else {
      updateData.adminPinHash = hashedPin;
    }

    await adminDb.collection('restaurants').doc(restaurantId).update(updateData);

    return NextResponse.json({ success: true, message: 'PIN updated successfully' });
  } catch (error: unknown) {
    console.error('[UpdatePin] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
