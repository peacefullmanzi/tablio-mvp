import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    console.log('--- Starting Debug Data Wipe ---');
    
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const collections = ['restaurants', 'menus', 'orders', 'settings'];
    const results: Record<string, number> = {};
    
    for (const colName of collections) {
      const snapshot = await adminDb.collection(colName).get();
      let count = 0;
      
      if (!snapshot.empty) {
        const batch = adminDb.batch();
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
          count++;
        });
        await batch.commit();
      }
      results[colName] = count;
    }

    console.log('--- Wipe Complete ---', results);
    return NextResponse.json({ 
      success: true, 
      message: 'All debug data wiped successfully',
      details: results
    });
  } catch (error: any) {
    console.error('Wipe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
