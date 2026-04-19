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

    // 4. Check if menu is empty for THIS restaurant
    const menuSnap = await adminDb.collection('menus')
      .where('restaurantId', '==', restaurantId)
      .limit(1)
      .get();
    if (!menuSnap.empty) {
      return NextResponse.json({ error: 'Menu is not empty' }, { status: 400 });
    }

    // 5. Seed Data — restaurantId injected into every document
    const seedData = [
      { name: "Burger", price: 5000, category: "Food", description: "Juicy beef burger with cheese", restaurantId },
      { name: "Pizza", price: 8000, category: "Food", description: "Large pepperoni pizza", restaurantId },
      { name: "Soda", price: 1000, category: "Drinks", description: "Chilled soft drink", restaurantId },
      { name: "Fries", price: 2000, category: "Food", description: "Crispy golden fries", restaurantId },
      { name: "Beer", price: 3000, category: "Drinks", description: "Local brewed beer", restaurantId }
    ];

    const batch = adminDb.batch();
    seedData.forEach((item) => {
      const docRef = adminDb.collection('menus').doc();
      batch.set(docRef, item);
    });
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${seedData.length} items` 
    });
  } catch (error: unknown) {
    console.error('Error seeding menu:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
