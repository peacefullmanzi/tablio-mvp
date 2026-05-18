'use client';

import { useState } from 'react';
import { Bell, Receipt, X, Phone, CreditCard, Smartphone } from 'lucide-react';
import { useStore } from '@/lib/store';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface QuickActionsProps {
  restaurantId: string;
}

export default function QuickActions({ restaurantId }: QuickActionsProps) {
  const { tableNumber } = useStore();
  const [showBillModal, setShowBillModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCallStaff = async () => {
    if (!tableNumber) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'customerRequests'), {
        restaurantId,
        tableNumber,
        type: 'call_staff',
        paymentMethod: null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setFeedback({ type: 'success', message: 'Staff has been notified!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to notify staff. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestBill = async (paymentMethod: string) => {
    if (!tableNumber) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'customerRequests'), {
        restaurantId,
        tableNumber,
        type: 'request_bill',
        paymentMethod,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setShowBillModal(false);
      setFeedback({ type: 'success', message: `Bill requested via ${paymentMethod}!` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to request bill. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tableNumber) return null;

  return (
    <>
      <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3">
        <button
          onClick={handleCallStaff}
          disabled={isSubmitting}
          className="w-14 h-14 bg-card border border-white/10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
          title="Call Staff"
        >
          <Phone size={24} className="text-accent" />
        </button>
        
        <button
          onClick={() => setShowBillModal(true)}
          disabled={isSubmitting}
          className="w-14 h-14 bg-card border border-white/10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
          title="Request Bill"
        >
          <Receipt size={24} className="text-accent" />
        </button>
      </div>

      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowBillModal(false)} />
          
          <div className="w-full max-w-sm bg-card relative flex flex-col border-t sm:border border-white/10 shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-primary-text text-lg">Request Bill</h3>
              <button onClick={() => setShowBillModal(false)} className="p-2 text-secondary-text hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-3">
              <p className="text-sm text-secondary-text mb-4">Select your preferred payment method:</p>
              
              <button
                onClick={() => handleRequestBill('cash')}
                className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
              >
                <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                  <Receipt size={20} className="text-accent" />
                </div>
                <span className="font-bold text-primary-text">Cash</span>
              </button>
              
              <button
                onClick={() => handleRequestBill('card')}
                className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
              >
                <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                  <CreditCard size={20} className="text-accent" />
                </div>
                <span className="font-bold text-primary-text">Card</span>
              </button>
              
              <button
                onClick={() => handleRequestBill('mobile_money')}
                className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
              >
                <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                  <Smartphone size={20} className="text-accent" />
                </div>
                <span className="font-bold text-primary-text">Mobile Money</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div className={`fixed top-6 left-0 right-0 z-50 flex justify-center px-4 animate-in slide-in-from-top-4 fade-in`}>
          <div className={`px-6 py-3 rounded-full font-bold text-sm shadow-lg ${
            feedback.type === 'success' 
              ? 'bg-accent text-background' 
              : 'bg-red-500 text-white'
          }`}>
            {feedback.message}
          </div>
        </div>
      )}
    </>
  );
}