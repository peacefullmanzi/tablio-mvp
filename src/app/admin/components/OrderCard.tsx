'use client';

import { Order, OrderStatus } from '@/types/order';
import { Clock, CheckCircle, ChefHat, CheckSquare, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminChat from './AdminChat';

interface OrderCardProps {
  order: Order;
  onMessageCountChange?: (orderId: string, count: number) => void;
}

export default function OrderCard({ order, onMessageCountChange }: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (newStatus: OrderStatus) => {
    const getRestaurantId = () => {
      if (typeof window === 'undefined') return '';
      const params = new URLSearchParams(window.location.search);
      return params.get('rid') || localStorage.getItem('tablio_rid') || process.env.NEXT_PUBLIC_RESTAURANT_ID || '';
    };

    setIsUpdating(true);
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        alert('Configuration error: restaurantId not set.');
        return;
      }
      const authKey = `tablio_admin_auth_${restaurantId}`;
      const pin = localStorage.getItem(authKey) || localStorage.getItem('tablio_admin_auth');
      
      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, pin, restaurantId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
    } catch (error: unknown) {
      console.error("Error updating order status:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update status";
      alert(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'accepted': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'preparing': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'ready': return 'text-accent bg-accent/10 border-accent/20';
      case 'completed': return 'text-secondary-text bg-white/5 border-white/10';
      default: return 'text-secondary-text bg-white/5 border-white/10';
    }
  };

  const formatTime = (timestamp: unknown) => {
    if (!timestamp) return '';
    // Handle Firebase Timestamp or standard JS Date
    const date = (timestamp as { toDate?: () => Date }).toDate 
      ? (timestamp as { toDate: () => Date }).toDate() 
      : new Date(timestamp as string | number | Date);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (order.status === 'completed' || !order.created_at) return;

    const calculateElapsed = () => {
      const date = (order.created_at as { toDate?: () => Date }).toDate 
        ? (order.created_at as { toDate: () => Date }).toDate() 
        : new Date(order.created_at as string | number | Date);
      const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      setElapsedSeconds(diff);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000); // Check every 1s
    return () => clearInterval(interval);
  }, [order.created_at, order.status]);

  const getUrgencyClasses = () => {
    if (order.status === 'completed' || order.status === 'ready') return 'border-white/5';
    
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes >= 15) {
      return 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse';
    } else if (elapsedMinutes >= 5) {
      return 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]';
    } else {
      return 'border-accent shadow-[0_0_15px_rgba(16,185,129,0.1)]';
    }
  };

  const formatElapsed = () => {
    if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
    return `${Math.floor(elapsedSeconds / 60)}m ago`;
  };

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    if (!order.id) return;
    const q = query(collection(db, 'orders', order.id, 'messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hasCustomerMessage = snapshot.docs.some(doc => doc.data().sender === 'customer');
      setMessageCount(snapshot.size);
      if (onMessageCountChange) {
        onMessageCountChange(order.id, hasCustomerMessage ? 1 : 0);
      }
    });
    return () => unsubscribe();
  }, [order.id, onMessageCountChange]);

  return (
    <div className={`bg-card/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border-2 transition-all duration-500 ${getUrgencyClasses()} ${isUpdating ? 'opacity-50 scale-95 animate-pulse' : 'animate-in fade-in zoom-in-95'}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-secondary-text text-[10px] font-black uppercase tracking-[0.2em] mb-1">Table</div>
          <h3 className="text-5xl font-black text-primary-text leading-none tracking-tighter">
            {order.table_number}
          </h3>
          <p className="text-sm text-secondary-text flex items-center gap-1 mt-2 font-medium">
            <Clock size={14} />
            {formatElapsed()}
          </p>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-widest ${getStatusColor(order.status)}`}>
          {order.status}
        </div>
      </div>

      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-6">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${
            order.status === 'pending' ? 'w-1/5 bg-yellow-500' :
            order.status === 'accepted' ? 'w-2/5 bg-blue-500' :
            order.status === 'preparing' ? 'w-3/5 bg-orange-500' :
            order.status === 'ready' ? 'w-4/5 bg-accent' :
            'w-full bg-secondary-text'
          }`}
        />
      </div>

      {messageCount > 0 && (
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setIsChatOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all border bg-blue-500/10 border-blue-500/30 text-blue-400"
          >
            <MessageCircle size={16} />
            CHAT ({messageCount})
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-1" />
          </button>
        </div>
      )}

      <div className="mb-6 bg-background/50 rounded-xl overflow-hidden border border-white/5">
        <div className="p-4 border-b border-white/5 bg-white/5">
          <span className="font-bold text-sm text-secondary-text">
            {order.items.length} {order.items.length === 1 ? 'ITEM' : 'ITEMS'}
          </span>
        </div>

        <div className="px-4 py-4 space-y-3">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
              <span className="text-primary-text font-bold">
                <span className="text-accent mr-2">{item.quantity}x</span> 
                {item.name}
              </span>
              <span className="text-secondary-text font-mono">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="pt-2 flex justify-between items-center">
            <span className="text-secondary-text text-xs uppercase tracking-widest font-black">Total</span>
            <span className="text-lg font-black text-accent">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {order.status === 'pending' && (
          <button
            onClick={() => updateStatus('accepted')}
            disabled={isUpdating}
            className="w-full bg-blue-500 text-white py-5 rounded-xl text-lg font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <CheckCircle size={20} /> ACCEPT
          </button>
        )}
        
        {order.status === 'accepted' && (
          <button
            onClick={() => updateStatus('preparing')}
            disabled={isUpdating}
            className="w-full bg-orange-500 text-white py-5 rounded-xl text-lg font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <ChefHat size={20} /> START COOKING
          </button>
        )}

        {order.status === 'preparing' && (
          <button
            onClick={() => updateStatus('ready')}
            disabled={isUpdating}
            className="w-full bg-accent text-background py-5 rounded-xl text-lg font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-accent/20"
          >
            <CheckSquare size={20} /> FOOD IS READY
          </button>
        )}

        {order.status === 'ready' && (
          <button
            onClick={() => updateStatus('completed')}
            disabled={isUpdating}
            className="w-full bg-white text-background py-5 rounded-xl text-lg font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
          >
            <CheckCircle size={20} /> DELIVERED & COMPLETE
          </button>
        )}

        {order.status === 'completed' && (
          <div className="w-full text-center py-4 text-sm text-secondary-text font-black tracking-widest bg-white/5 rounded-xl flex items-center justify-center gap-2 italic ring-1 ring-white/10 uppercase">
            <CheckCircle size={16} className="text-secondary-text/50" /> Cleared from Kitchen
          </div>
        )}
      </div>

      <AdminChat 
        orderId={order.id}
        tableNumber={order.table_number}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        orderStatus={order.status}
      />
    </div>
  );
}
