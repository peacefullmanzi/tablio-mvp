import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { parseAndValidateBody, requireAdminPin, requireRestaurantId } from '@/lib/api-security';

export async function POST(request: Request) {
  try {
    // 1. Parse body with 1MB size limit
    const parsed = await parseAndValidateBody(request);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    // 2. Validate restaurantId
    const restaurantError = requireRestaurantId(body);
    if (restaurantError) return restaurantError;
    const restaurantId = body.restaurantId as string;

    // 3. Validate Admin PIN
    const pinError = await requireAdminPin(body);
    if (pinError) return pinError;

    // 4. Validate item data with strict type checks
    const item = body.item as Record<string, unknown> | undefined;
    if (!item || typeof item !== 'object') {
      return NextResponse.json({ error: 'Missing item data' }, { status: 400 });
    }

    if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
      return NextResponse.json({ error: 'Item name is required and must be a string' }, { status: 400 });
    }
    if ((item.name as string).length > 200) {
      return NextResponse.json({ error: 'Item name too long (max 200 chars)' }, { status: 400 });
    }

    if (!item.price || typeof item.price !== 'number' || item.price <= 0 || item.price > 10000000) {
      return NextResponse.json({ error: 'Item price must be a positive number (max 10,000,000)' }, { status: 400 });
    }

    if (!item.category || typeof item.category !== 'string' || item.category.trim().length === 0) {
      return NextResponse.json({ error: 'Item category is required and must be a string' }, { status: 400 });
    }
    if ((item.category as string).length > 100) {
      return NextResponse.json({ error: 'Category name too long (max 100 chars)' }, { status: 400 });
    }

    // Optional image field validation
    if (item.image !== undefined && item.image !== null) {
      if (typeof item.image !== 'string' || (item.image as string).length > 2000) {
        return NextResponse.json({ error: 'Image URL must be a string (max 2000 chars)' }, { status: 400 });
      }
    }

    // 5. Build sanitized document — only allow known fields
    const sanitizedItem = {
      name: (item.name as string).trim(),
      price: item.price,
      category: (item.category as string).trim(),
      image: item.image || null,
      restaurantId,
    };

    // 6. Save using Admin SDK
    const id = body.id as string | undefined;
    if (id) {
      if (typeof id !== 'string' || id.length > 128) {
        return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
      }
      // Verify the document belongs to this restaurant before updating
      const existing = await adminDb.collection('menus').doc(id).get();
      if (!existing.exists || existing.data()?.restaurantId !== restaurantId) {
        return NextResponse.json({ error: 'Forbidden: Item does not belong to your restaurant' }, { status: 403 });
      }
      await adminDb.collection('menus').doc(id).update(sanitizedItem);
      return NextResponse.json({ success: true, message: 'Item updated successfully' });
    } else {
      await adminDb.collection('menus').add(sanitizedItem);
      return NextResponse.json({ success: true, message: 'Item added successfully' });
    }
  } catch (error: unknown) {
    console.error('Error saving menu item:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
