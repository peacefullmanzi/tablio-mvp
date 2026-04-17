'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

    setIsSubmitting(true);
    try {
      const orderData = {
        items,
        total,
        table_number: tableNumber,
        status: 'pending',
        created_at: serverTimestamp()
      };

      console.log("[Cart] Attempting to place order in Firestore...", orderData);
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      console.log("[Cart] Order placed successfully. Doc ID:", docRef.id);
      
      alert('Order placed successfully!');
      localStorage.setItem('last_order_id', docRef.id);
      clearCart();
      setTableNumber('');
      setIsOpen(false);
      
      // Redirect to tracking page
      router.push(`/customer/track/${docRef.id}`);
    } catch (error) {
      console.error("[Cart] Error placing order in Firestore: ", error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (itemCount === 0) return null;

  return (
    <>
      {/* Sticky Bottom Bar (Always Visible when items exist) */}
      {!isOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-white/5 z-50 animate-in slide-in-from-bottom-full">
          <button
            onClick={() => setIsOpen(true)}
            className="w-full max-w-2xl mx-auto bg-accent text-background flex items-center justify-between px-6 py-5 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag size={24} strokeWidth={2.5} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-accent">
                  {itemCount}
                </span>
              </div>
              <span className="font-black text-lg tracking-tight uppercase">View My Order</span>
            </div>
            <span className="font-black text-xl">{formatPrice(total)}</span>
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
