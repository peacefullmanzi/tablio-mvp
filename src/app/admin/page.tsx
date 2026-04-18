'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types/order';
import OrderList from './components/OrderList';
import { RefreshCcw, Bell, BellOff, History, Inbox, Trash2, MessageSquare } from 'lucide-react';

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  
  const handleMessageCountChange = useCallback((orderId: string, count: number) => {
    setMessageCounts(prev => {
      if (prev[orderId] === count) return prev;
      return { ...prev, [orderId]: count };
    });
  }, []);

  const activeChatRooms = Object.values(messageCounts).reduce((a, b) => a + b, 0);
  
  const prevOrderCount = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleRefresh = () => {
    console.log("[AdminPage] Manual refresh triggered.");
    setRefreshKey(prev => prev + 1);
  };


  const handleClearHistory = async () => {
    const completedOrders = orders.filter(o => o.status === 'completed');
    if (completedOrders.length === 0 || !confirm(`Delete all ${completedOrders.length} completed orders? This cannot be undone.`)) return;

    try {
      const pin = localStorage.getItem('tablio_admin_auth');
      const response = await fetch('/api/admin/orders/clear-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear history');
      }
      alert("History cleared successfully!");
    } catch (error: unknown) {
      console.error("Failed to clear history:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to clear history.";
      alert(errorMessage);
    }
  };

  useEffect(() => {
    // Setup real-time listener for orders
    const q = query(
      collection(db, 'orders'),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log(`[AdminPage] Snapshot received. Found ${querySnapshot.size} orders.`);
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedOrders.push({ 
          id: doc.id, 
          ...data,
          created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at
        } as Order);
      });
      setOrders(fetchedOrders);
      
      // Cleanup message counts for completed or missing orders
      setMessageCounts(prev => {
        const newCounts = { ...prev };
        let changed = false;
        Object.keys(newCounts).forEach(orderId => {
          const order = fetchedOrders.find(o => o.id === orderId);
          if (!order || order.status === 'completed') {
            delete newCounts[orderId];
            changed = true;
          }
        });
        return changed ? newCounts : prev;
      });
      
      setIsLoading(false);
    }, (error) => {
      console.error("[AdminPage] Error receiving real-time orders updates: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [refreshKey]);

  // Handle Notifications
  useEffect(() => {
    if (isLoading || !notificationsEnabled) return;

    // Filter for non-completed orders to track new ones
    const activeOrders = orders.filter(o => o.status !== 'completed');

    if (prevOrderCount.current !== null && activeOrders.length > prevOrderCount.current) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio play blocked:", e));
      }
    }
    prevOrderCount.current = activeOrders.length;
  }, [orders, isLoading, notificationsEnabled]);

  const filteredOrders = orders.filter(order => 
    showCompleted ? order.status === 'completed' : order.status !== 'completed'
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className={`bg-background/80 backdrop-blur-xl border-b border-white/10 py-6 sticky top-0 z-10`}>
        <div className="container mx-auto px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black text-primary-text tracking-tight">Active Orders</h1>
            <div className="flex gap-4 items-center">
              {activeChatRooms > 0 && (
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-sm cursor-default animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <MessageSquare size={16} />
                  <span className="hidden sm:inline">{activeChatRooms} Active {activeChatRooms === 1 ? 'Chat' : 'Chats'}</span>
                  <span className="sm:hidden">{activeChatRooms}</span>
                </div>
              )}
              <button 
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-secondary-text transition-colors font-bold text-sm"
              >
                <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setShowCompleted(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !showCompleted 
                    ? 'bg-accent text-background shadow-lg shadow-accent/10' 
                    : 'bg-white/5 text-secondary-text hover:bg-white/10'
                }`}
              >
                <Inbox size={16} /> Active Orders
                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${!showCompleted ? 'bg-background/20' : 'bg-white/10'}`}>
                  {orders.filter(o => o.status !== 'completed').length}
                </span>
              </button>
              <button
                onClick={() => setShowCompleted(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  showCompleted 
                    ? 'bg-accent text-background shadow-lg shadow-accent/10' 
                    : 'bg-white/5 text-secondary-text hover:bg-white/10'
                }`}
              >
                <History size={16} /> History
                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${showCompleted ? 'bg-background/20' : 'bg-white/10'}`}>
                  {orders.filter(o => o.status === 'completed').length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-6 w-full sm:w-auto">
              {showCompleted && orders.filter(o => o.status === 'completed').length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={14} /> Clear History
                </button>
              )}

              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  notificationsEnabled ? 'text-accent bg-accent/10 border border-accent/20' : 'text-secondary-text bg-white/5 border border-white/10'
                }`}
              >
                {notificationsEnabled ? <Bell size={14} className="animate-bounce" /> : <BellOff size={14} />}
                KITCHEN BELL: {notificationsEnabled ? 'ON' : 'OFF'}
              </button>
              
              <div className="hidden lg:flex gap-4 text-xs font-medium border-l border-white/10 pl-6">
                <div className="flex items-center gap-1.5 text-yellow-500">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  {orders.filter(o => o.status === 'pending').length} New
                </div>
                <div className="flex items-center gap-1.5 text-orange-500">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  {orders.filter(o => o.status === 'preparing').length} Kitchen
                </div>
              </div>
            </div>
          </div>
        </div>
        <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2857/2857-preview.mp3" preload="auto" />
      </header>

      <main className="container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-secondary-text bg-card rounded-2xl border border-white/5">
            <p className="text-lg">{showCompleted ? 'No history found' : 'No active orders'}</p>
          </div>
        ) : (
          <OrderList orders={filteredOrders} onMessageCountChange={handleMessageCountChange} />
        )}
      </main>
    </div>
  );
}
