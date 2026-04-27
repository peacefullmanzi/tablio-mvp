import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { parseAndValidateBody, requireAdminAuth } from '@/lib/api-security';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const auth = await requireAdminAuth(request);
    if ('error' in auth) return auth.error;
    const { restaurantId } = auth;

    const parsed = await parseAndValidateBody(request);
    if ('error' in parsed) return parsed.error;
    const { name } = parsed.data;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    if (!restaurantId || typeof restaurantId !== 'string') {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const lowerName = trimmedName.toLowerCase();

    // Check for duplicates (case-insensitive)
    const existing = await adminDb.collection('categories')
      .where('restaurantId', '==', restaurantId)
      .get();

    const isDuplicate = existing.docs.some(doc => 
      doc.data().name.toLowerCase() === lowerName
    );

    if (isDuplicate) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }

    const docRef = await adminDb.collection('categories').add({
      name: trimmedName,
      restaurantId,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id, 
      name: trimmedName 
    });
  } catch (error: any) {
    console.error('[CategoriesCreate] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
