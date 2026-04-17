'use client';

import { Order, OrderStatus } from '@/types/order';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Clock, CheckCircle, ChefHat, CheckSquare } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update status");
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

  const isNew = () => {
    if (!order.created_at) return false;
    const date = (order.created_at as { toDate?: () => Date }).toDate 
      ? (order.created_at as { toDate: () => Date }).toDate() 
      : new Date(order.created_at as string | number | Date);
    const diff = (new Date().getTime() - date.getTime()) / 1000;
    return diff < 120; // 2 minutes
  };

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-card rounded-2xl p-6 shadow-xl border-2 ${isNew() && order.status === 'pending' ? 'border-accent shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse' : 'border-white/5'}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-secondary-text text-[10px] font-black uppercase tracking-[0.2em] mb-1">Table</div>
          <h3 className="text-5xl font-black text-primary-text leading-none tracking-tighter">
            {order.table_number}
          </h3>
          <p className="text-sm text-secondary-text flex items-center gap-1 mt-2">
            <Clock size={14} />
            {formatTime(order.created_at)}
          </p>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-widest ${getStatusColor(order.status)}`}>
          {order.status}
        </div>
      </div>

      <div className="mb-6 bg-background/50 rounded-xl overflow-hidden border border-white/5">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex justify-between items-center p-4 hover:bg-white/5 transition-colors"
        >
          <span className="font-bold text-sm text-secondary-text">
            {order.items.length} {order.items.length === 1 ? 'ITEM' : 'ITEMS'}
          </span>
          <span className="text-accent text-xs font-black">{isExpanded ? 'HIDE' : 'VIEW'}</span>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
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
              <span className="text-secondary-text text-xs">Total Amount</span>
              <span className="text-lg font-black text-accent">{formatPrice(order.total)}</span>
            </div>
          </div>
        )}
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
    </div>
  );
}
