import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateAdminPin } from '@/lib/admin-utils';

export async function POST(request: Request) {
  try {
    const { item, pin, id } = await request.json();

    // 1. Validate Admin PIN
    const isValid = await validateAdminPin(pin);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized: Invalid PIN' }, { status: 401 });
    }

    // 2. Validate Item Data
    if (!item || !item.name || !item.price || !item.category) {
      return NextResponse.json({ error: 'Missing required item fields' }, { status: 400 });
    }

    // 3. Save using Admin SDK
    if (id) {
      // Update
      await adminDb.collection('menus').doc(id).update(item);
      return NextResponse.json({ success: true, message: 'Item updated successfully' });
    } else {
      // Add
      await adminDb.collection('menus').add(item);
      return NextResponse.json({ success: true, message: 'Item added successfully' });
    }
  } catch (error: unknown) {
    console.error('Error saving menu item:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
