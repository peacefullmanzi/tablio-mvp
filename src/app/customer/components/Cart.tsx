'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ShoppingBag, X, Minus, Plus } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function Cart() {
  const { items, getTotal, removeFromCart, addToCart, clearCart } = useStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = getTotal();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!tableNumber.trim()) {
      alert('Please enter a table number');
      return;
    }

    if (items.length === 0) return;

    // Enforce restaurantId — must be set in the environment
    const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID;
    if (!restaurantId) {
      console.error('[Cart] NEXT_PUBLIC_RESTAURANT_ID is not set. Cannot place order.');
      alert('Configuration error. Please contact staff.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Send order to server — server fetches real prices from DB
      // Client only sends item IDs + quantities (prices are NOT trusted)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          table_number: tableNumber,
          items: items.map(item => ({ id: item.id, quantity: item.quantity })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      console.log("[Cart] Order placed successfully. Doc ID:", data.orderId);
      
      alert('Order placed successfully!');
      localStorage.setItem('last_order_id', data.orderId);
      clearCart();
      setTableNumber('');
      setIsOpen(false);
      
      // Redirect to tracking page
      router.push(`/customer/track/${data.orderId}`);
    } catch (error) {
      console.error("[Cart] Error placing order: ", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to place order. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (itemCount === 0) return null;

  return (
    <>
      {/* Dynamic Island Cart (Always Visible when items exist) */}
      {!isOpen && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none">
          <button
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto w-full max-w-sm bg-accent/90 backdrop-blur-xl text-background flex items-center justify-between px-6 py-4 rounded-full shadow-[0_20px_40px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all animate-in slide-in-from-bottom-10 fade-in duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="bg-background text-accent w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
                {itemCount}
              </div>
              <span className="font-black text-sm tracking-widest uppercase">View Order</span>
            </div>
            <span className="font-black text-lg">{formatPrice(total)}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setIsOpen(false)} />
          
          <div className="w-full max-w-md bg-card h-full relative flex flex-col border-l border-white/10 shadow-2xl animate-in slide-in-from-right-full duration-300">
            <div className="p-6 flex items-center justify-between border-b border-white/10">
              <h2 className="text-2xl font-black text-primary-text flex items-center gap-3">
                <ShoppingBag size={24} className="text-accent" />
                MY ORDER
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2 text-secondary-text hover:text-white transition-colors">
                <X size={32} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex-1">
                    <p className="font-bold text-lg text-primary-text leading-tight">{item.name}</p>
                    <p className="text-accent font-bold">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-4 bg-background/50 p-2 rounded-xl border border-white/5">
                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-secondary-text active:text-red-500">
                      <Minus size={20} strokeWidth={3} />
                    </button>
                    <span className="w-4 text-center font-black text-lg text-primary-text">{item.quantity}</span>
                    <button onClick={() => addToCart({ ...item, quantity: 1 })} className="p-2 text-secondary-text active:text-accent">
                      <Plus size={20} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 border-t border-white/10 bg-card/50 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-8">
                <span className="text-secondary-text font-bold text-lg">Order Total</span>
                <span className="text-3xl font-black text-accent">{formatPrice(total)}</span>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="table" className="block text-xs font-black text-secondary-text uppercase tracking-widest mb-2 ml-1">
                    Enter Table Number
                  </label>
                  <input
                    id="table"
                    type="text"
                    inputMode="numeric"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full bg-background border-2 border-white/10 rounded-2xl px-6 py-5 text-2xl font-black text-primary-text placeholder-white/20 focus:border-accent transition-all text-center"
                  />
                </div>
                
                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || items.length === 0}
                  className="w-full bg-accent text-background font-black text-xl py-6 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-30 uppercase tracking-tight"
                >
                  {isSubmitting ? 'Sending...' : 'CONFIRM & SEND ORDER'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
