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
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'thisMonth'; // today, thisWeek, thisMonth

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (filter === 'thisWeek') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      startDate.setDate(diff);
    } else if (filter === 'thisMonth') {
      startDate.setDate(1);
    }

    // Fetch orders for this restaurant with filter
    // Note: To support legacy data, we check both createdAt and created_at
    // But for the sake of efficient Firestore queries in MVP, we'll fetch a reasonable chunk and filter in memory
    // In production, you'd use a proper timestamp index.
    const ordersSnapshot = await adminDb.collection('orders')
      .where('restaurantId', '==', restaurantId)
      .where('status', '==', 'completed')
      .get();
      
    let totalRevenue = 0;
    const ordersData: any[] = [];
    
    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = data.createdAt || data.created_at;
      const orderDate = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      
      if (orderDate >= startDate) {
        const total = data.total || 0;
        totalRevenue += total;
        
        ordersData.push({
          id: doc.id,
          total,
          date: orderDate.toISOString(),
          dateLabel: orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
      }
    });

    // Sort by date ascending for chart
    ordersData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by day for the chart
    const dailyData: Record<string, number> = {};
    ordersData.forEach(order => {
      const label = order.dateLabel;
      dailyData[label] = (dailyData[label] || 0) + order.total;
    });

    const chartData = Object.entries(dailyData).map(([name, revenue]) => ({
      name,
      revenue
    }));

    return NextResponse.json({
      success: true,
      totalRevenue,
      ordersCount: ordersData.length,
      chartData,
      recentOrders: ordersData.slice(-10).reverse() // Last 10
    });
  } catch (error: unknown) {
    console.error('Error fetching sales summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
