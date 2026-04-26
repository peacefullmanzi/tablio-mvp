import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdminAuth } from '@/lib/api-security';

export async function GET(request: Request) {
  try {
    const auth = await requireAdminAuth(request);
    if ('error' in auth) return auth.error;
    
    if (auth.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden: Managers only' }, { status: 403 });
    }

    const { restaurantId } = auth;
    
    // Fetch all orders for this restaurant
    const ordersSnapshot = await adminDb.collection('orders')
      .where('restaurantId', '==', restaurantId)
      .get();
      
    let totalRevenue = 0;
    const totalOrders = ordersSnapshot.size;
    const recentOrders: any[] = [];
    
    // Grouping by day
    const salesByDay: Record<string, number> = {};

    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      const total = data.total || 0;
      totalRevenue += total;
      
      const dateStr = data.created_at?.toDate ? data.created_at.toDate().toISOString().split('T')[0] : 'Unknown';
      if (!salesByDay[dateStr]) salesByDay[dateStr] = 0;
      salesByDay[dateStr] += total;
      
      // push to recent orders (we'll sort later and keep top 10)
      recentOrders.push({
        id: doc.id,
        table_number: data.table_number,
        total: data.total,
        status: data.status,
        created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : null,
      });
    });
    
    recentOrders.sort((a, b) => {
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({
      success: true,
      totalRevenue,
      totalOrders,
      salesByDay,
      recentOrders: recentOrders.slice(0, 10)
    });
  } catch (error: unknown) {
    console.error('Error fetching sales summary:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
