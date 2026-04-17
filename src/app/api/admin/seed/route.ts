import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    // 1. Validate Admin PIN
    const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "1234";
    if (pin !== ADMIN_PIN) {
      return NextResponse.json({ error: 'Unauthorized: Invalid PIN' }, { status: 401 });
    }

    // 2. Check if menu is empty
    const menuSnap = await adminDb.collection('menus').limit(1).get();
    if (!menuSnap.empty) {
      return NextResponse.json({ error: 'Menu is not empty' }, { status: 400 });
    }

    // 3. Seed Data
    const seedData = [
      { name: "Burger", price: 5000, category: "Food", description: "Juicy beef burger with cheese" },
      { name: "Pizza", price: 8000, category: "Food", description: "Large pepperoni pizza" },
      { name: "Soda", price: 1000, category: "Drinks", description: "Chilled soft drink" },
      { name: "Fries", price: 2000, category: "Food", description: "Crispy golden fries" },
      { name: "Beer", price: 3000, category: "Drinks", description: "Local brewed beer" }
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
  } catch (error: any) {
    console.error('Error seeding menu:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
