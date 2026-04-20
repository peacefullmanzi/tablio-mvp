import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { isStrongPin, hashPin } from '@/lib/admin-utils';
import { parseAndValidateBody, requireString } from '@/lib/api-security';

/**
 * POST /api/admin/create-restaurant
 * 
 * Creates a new restaurant record.
 * 
 * Body: {
 *   name: string,
 *   pin: string (min 6 digits)
 * }
 */
export async function POST(request: Request) {
  try {
    // 1. Parse body with size limit (1MB)
    const parsed = await parseAndValidateBody(request);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    // 2. Validate Name
    const nameError = requireString(body, 'name', 100);
    if (nameError) return nameError;
    const name = (body.name as string).trim();

    // 3. Validate PIN
    const pin = body.pin;
    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN is required and must be a string' }, { status: 400 });
    }

    const pinValidation = isStrongPin(pin);
    if (!pinValidation.valid) {
      return NextResponse.json({ error: pinValidation.error }, { status: 400 });
    }

    // 4. Hash PIN for secure storage
    const adminPinHash = hashPin(pin);

    // 5. Create Restaurant in Firestore
    const restaurantData = {
      name,
      adminPinHash,
      createdAt: new Date(),
      failedAttempts: 0,
      lockUntil: null,
      status: 'active'
    };

    const docRef = await adminDb.collection('restaurants').add(restaurantData);

    return NextResponse.json({
      success: true,
      restaurantId: docRef.id,
      message: 'Restaurant created successfully',
    });
  } catch (error: unknown) {
    console.error('[CreateRestaurant] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create restaurant', details: errorMessage },
      { status: 500 }
    );
  }
}
