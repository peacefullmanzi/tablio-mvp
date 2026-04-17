'use client';

import { Order } from '@/types/order';
import OrderCard from './OrderCard';

interface OrderListProps {
  orders: Order[];
}

export default function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-xl border border-white/5">
        <p className="text-secondary-text">No active orders found.</p>
      </div>
    );
  }

  // Sort orders by creation time (newest first for MVP clarity)
  const sortedOrders = [...orders].sort((a, b) => {
    const getMillis = (ts: unknown): number => {
      if (!ts) return 0;
      if (typeof ts === 'number') return ts;
      if (ts instanceof Date) return ts.getTime();
      if (typeof ts === 'object' && ts !== null && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
        return (ts as { toMillis: () => number }).toMillis();
      }
      return 0;
    };
    
    const timeA = getMillis(a.created_at);
    const timeB = getMillis(b.created_at);
    return timeB - timeA;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sortedOrders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
