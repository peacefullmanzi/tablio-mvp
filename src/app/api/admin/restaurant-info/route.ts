import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdminAuth } from '@/lib/api-security';

export async function GET(request: Request) {
  try {
    const auth = await requireAdminAuth(request);
    if ('error' in auth) return auth.error;
    const { restaurantId } = auth;

    const doc = await adminDb.collection('restaurants').doc(restaurantId).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const data = doc.data()!;
    
    return NextResponse.json({ 
      success: true, 
      name: data.name,
      id: restaurantId,
      role: auth.role,
      hasUsedMenuImport: data.hasUsedMenuImport || false
    });
  } catch (error: any) {
    console.error('[RestaurantInfo] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
