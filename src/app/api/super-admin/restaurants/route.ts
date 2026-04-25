import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const SUPER_ADMIN_KEY = process.env.SUPER_ADMIN_KEY || 'tablio_master_2026';

export async function GET(request: Request) {
  const authHeader = request.headers.get('x-super-admin-key');
  
  if (authHeader !== SUPER_ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!adminDb) throw new Error('Admin DB not initialized');

    const restaurantsSnapshot = await adminDb.collection('restaurants').get();
    const restaurants = restaurantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error('Super Admin Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authHeader = request.headers.get('x-super-admin-key');
  if (authHeader !== SUPER_ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    if (!adminDb) throw new Error('Admin DB not initialized');

    // Delete restaurant and its sub-collections (simplified for MVP)
    await adminDb.collection('restaurants').doc(id).delete();
    
    // Note: In production, you'd also delete associated menus/orders here
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Super Admin Delete Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
