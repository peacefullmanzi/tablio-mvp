import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const doc = await adminDb.collection('restaurants').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const data = doc.data();
    return NextResponse.json({ 
      name: data?.name || 'Tablio Restaurant',
      id: id
    });
  } catch (error) {
    console.error('Info API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant info' }, { status: 500 });
  }
}
