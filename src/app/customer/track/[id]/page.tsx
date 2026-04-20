'use client';

import { useEffect, useState, use } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types/order';
import StatusIndicator from '../../components/StatusIndicator';
import { ShoppingBag, ArrowLeft, Receipt, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import ChatBox from '../../components/ChatBox';

interface TrackingPageProps {
  params: Promise<{ id: string }>;
}

export default function TrackingPage({ params }: TrackingPageProps) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    console.log(`[TrackingPage] Setting up listener for order: ${id}`);
    const unsubscribe = onSnapshot(doc(db, 'orders', id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        console.log("[TrackingPage] Order updated:", docSnapshot.data());
        setOrder({ id: docSnapshot.id, ...docSnapshot.data() } as Order);
        setError(null);
      } else {
        console.error("[TrackingPage] Order not found");
        setError("Order not found");
      }
      setIsLoading(false);
    }, (err) => {
      console.error("[TrackingPage] Snapshot error:", err);
      setError("Failed to fetch order updates");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
        <p className="text-secondary-text font-medium">Connecting to kitchen...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="text-red-500" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-primary-text mb-2">Order Not Found</h1>
        <p className="text-secondary-text mb-8 max-w-xs">We couldn&apos;t find an order with this ID. It might have been cleared or the link is incorrect.</p>
        <Link 
          href={order?.restaurantId ? `/r/${order.restaurantId}` : '/'}
          className="bg-accent hover:bg-emerald-400 text-background font-black py-3 px-8 rounded-xl transition-all flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="border-b border-white/5 py-4 sticky top-0 z-10 backdrop-blur-md bg-card/80">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href={order?.restaurantId ? `/r/${order.restaurantId}` : '/'} className="text-secondary-text hover:text-primary-text transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-lg font-bold text-primary-text">Live Tracking</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Status Section */}
        <section className="bg-card rounded-2xl p-6 border border-white/5 mb-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Clock size={80} />
          </div>
          
          <div className="flex flex-col items-center text-center mb-4">
            <span className={`text-xs font-bold uppercase tracking-widest mb-2 px-3 py-1 rounded-full border ${
              order.status === 'completed' 
                ? 'text-accent bg-accent/20 border-accent/40 animate-bounce' 
                : 'text-accent bg-accent/10 border-accent/20'
            }`}>
              {order.status === 'completed' ? 'Delivered & Complete' : 'Live updates'}
            </span>
            <h2 className="text-3xl font-black text-primary-text mb-1 tracking-tight">Table {order.table_number}</h2>
            {order.status === 'completed' ? (
              <p className="text-accent font-bold mt-2">Hope you enjoy your meal!</p>
            ) : (
              <p className="text-secondary-text text-sm">Order ID: <span className="font-mono text-[10px] uppercase">{id.slice(0, 8)}...</span></p>
            )}
          </div>

          <StatusIndicator status={order.status} />
          
          {order.status === 'completed' && (
            <div className="mt-8 p-4 bg-accent/10 border border-accent/20 rounded-xl text-center animate-in fade-in zoom-in duration-500">
              <h4 className="text-accent font-black text-xl mb-1">ENJOY! 🍕</h4>
              <p className="text-secondary-text text-sm">Your order has been delivered to your table.</p>
            </div>
          )}
        </section>

        {/* Order Details */}
        <section className="bg-card rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-5 bg-white/5 border-b border-white/5 flex items-center gap-2">
            <Receipt size={18} className="text-accent" />
            <h3 className="font-bold text-primary-text">Order Summary</h3>
          </div>
          
          <div className="p-6 space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex gap-3 items-center">
                  <span className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-secondary-text border border-white/5">
                    {item.quantity}
                  </span>
                  <span className="text-primary-text font-medium">{item.name}</span>
                </div>
                <span className="text-secondary-text font-mono">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            
            <div className="pt-4 border-t border-white/5 mt-4 flex justify-between items-center">
              <span className="text-primary-text font-bold">Total Amount</span>
              <span className="text-2xl font-black text-accent">{formatPrice(order.total)}</span>
            </div>
          </div>
        </section>

        {/* Action / Help */}
        <div className="mt-8 text-center">
          <p className="text-secondary-text text-sm mb-4">Questions about your order? Ask our staff!</p>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="text-accent border border-accent/20 hover:bg-accent/5 px-6 py-2 rounded-lg text-sm transition-colors"
          >
            Need Help?
          </button>
        </div>

        <ChatBox 
          orderId={id} 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)}
          orderStatus={order.status}
        />
      </main>
    </div>
  );
}
