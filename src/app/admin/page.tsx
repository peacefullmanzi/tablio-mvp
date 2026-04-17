'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types/order';
import OrderList from './components/OrderList';
import { LayoutDashboard, RefreshCcw, LogOut, Bell, BellOff, History, Inbox, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

export default function AdminPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const prevOrderCount = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleRefresh = () => {
    console.log("[AdminPage] Manual refresh triggered.");
    setRefreshKey(prev => prev + 1);
  };

  const handleSeed = async () => {
    if (orders.length > 0 || !confirm("Seed demo menu items? This only works if the menu is empty.")) return;
    
    setIsSeeding(true);
    try {
      const pin = localStorage.getItem('tablio_admin_auth');
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Seeding failed');
      }
      
      alert("Demo menu seeded successfully!");
    } catch (error: any) {
      console.error("Seeding failed:", error);
      alert(error.message || "Seeding failed.");
    } finally {
      setIsSeeding(false);
    }
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
    } catch (error: any) {
      console.error("Failed to clear history:", error);
      alert(error.message || "Failed to clear history.");
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
      <header className={`bg-card border-b border-white/5 py-6 sticky top-0 z-10`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Tablio Logo" className="h-16 w-auto object-contain" />
              <h1 className="text-2xl font-bold text-primary-text tracking-tight">Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-accent rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Seed Demo
              </button>
              <a 
                href="/admin/menu"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-accent text-background rounded-lg text-sm font-bold hover:bg-emerald-400 transition-colors whitespace-nowrap"
              >
                Manage Menu
              </a>
              <button 
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-secondary-text transition-colors cursor-pointer"
                title="Refresh Orders"
              >
                <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('tablio_admin_auth');
                  router.push('/admin/login');
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-secondary-text transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-white/5">
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
          <OrderList orders={filteredOrders} />
        )}
      </main>
    </div>
  );
}
