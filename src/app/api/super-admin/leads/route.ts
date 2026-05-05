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

    const snapshot = await adminDb
      .collection('leads')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ success: true, leads, total: leads.length });
  } catch (error: any) {
    console.error('[SuperAdmin Leads] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads.' }, { status: 500 });
  }
}
