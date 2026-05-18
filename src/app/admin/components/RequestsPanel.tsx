'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, query, onSnapshot, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bell, Phone, Receipt, Check, X, Clock } from 'lucide-react';

interface CustomerRequest {
  id: string;
  restaurantId: string;
  tableNumber: string;
  type: 'call_staff' | 'request_bill';
  paymentMethod?: string;
  status: 'pending' | 'acknowledged' | 'completed';
  createdAt: any;
}

interface RequestsPanelProps {
  restaurantId: string;
}

export default function RequestsPanel({ restaurantId }: RequestsPanelProps) {
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const q = query(
      collection(db, 'customerRequests'),
      where('restaurantId', '==', restaurantId),
      where('status', '!=', 'completed'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CustomerRequest[];
      setRequests(reqs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const handleAcknowledge = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'customerRequests', requestId), {
        status: 'acknowledged'
      });
    } catch (error) {
      console.error('Failed to acknowledge request:', error);
    }
  };

  const handleComplete = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'customerRequests', requestId), {
        status: 'completed'
      });
    } catch (error) {
      console.error('Failed to complete request:', error);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (isLoading) return null;
  if (requests.length === 0) return null;

  return (
    <div className="bg-card border border-white/5 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={20} className="text-accent" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white animate-pulse">
                {pendingCount}
              </span>
            )}
          </div>
          <h3 className="font-bold text-primary-text">Customer Requests</h3>
        </div>
        <span className="text-xs text-secondary-text font-bold">{requests.length} active</span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {requests.map((request) => (
          <div 
            key={request.id} 
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              request.status === 'pending' 
                ? 'bg-accent/10 border-accent/20' 
                : 'bg-white/5 border-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                request.type === 'call_staff' ? 'bg-blue-500/20' : 'bg-purple-500/20'
              }`}>
                {request.type === 'call_staff' ? (
                  <Phone size={18} className="text-blue-400" />
                ) : (
                  <Receipt size={18} className="text-purple-400" />
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-primary-text">
                  Table {request.tableNumber}
                </p>
                <p className="text-xs text-secondary-text">
                  {request.type === 'call_staff' ? 'Called Staff' : `Bill • ${request.paymentMethod}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {request.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleAcknowledge(request.id)}
                    className="p-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all"
                    title="Acknowledge"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => handleComplete(request.id)}
                    className="p-2 bg-white/10 text-secondary-text rounded-lg hover:bg-white/20 transition-all"
                    title="Mark Complete"
                  >
                    <X size={16} />
                  </button>
                </>
              )}
              {request.status === 'acknowledged' && (
                <button
                  onClick={() => handleComplete(request.id)}
                  className="p-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all"
                  title="Mark Complete"
                >
                  <Check size={16} />
                </button>
              )}
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                request.status === 'pending' 
                  ? 'bg-accent/20 text-accent' 
                  : 'bg-white/10 text-secondary-text'
              }`}>
                {request.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}