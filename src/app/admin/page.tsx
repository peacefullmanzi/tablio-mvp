'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, onSnapshot, orderBy, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types/order';
import OrderList from './components/OrderList';
import { RefreshCcw, Bell, BellOff, History, Inbox, Trash2, MessageSquare, Search } from 'lucide-react';
import { OrderCardSkeleton } from './components/Skeleton';
import AdminSidebar from './components/AdminSidebar';

import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function AdminContent() {
  const searchParams = useSearchParams();
  const ridParam = searchParams.get('rid');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Unified restaurantId logic
  const getRestaurantId = () => {
    return ridParam || localStorage.getItem('tablio_rid') || process.env.NEXT_PUBLIC_RESTAURANT_ID;
  };

  useEffect(() => {
    const rid = getRestaurantId();
    if (rid && rid !== localStorage.getItem('tablio_rid')) {
      localStorage.setItem('tablio_rid', rid);
    }
  }, [ridParam]);

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
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        alert('Configuration error: restaurantId not set.');
        return;
      }
      const authKey = `tablio_admin_auth_${restaurantId}`;
      const pin = localStorage.getItem(authKey) || localStorage.getItem('tablio_admin_auth');

      const response = await fetch('/api/admin/orders/clear-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, restaurantId })
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
    // Setup real-time listener for this restaurant's orders only
    const restaurantId = getRestaurantId();
    if (!restaurantId) {
      console.error('[AdminPage] No restaurantId found. Cannot load orders.');
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      orderBy('created_at', 'desc'),
      limit(100)
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
  }, [refreshKey, ridParam]);

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

  const filteredOrders = orders.filter(order => {
    const matchesStatus = showCompleted ? order.status === 'completed' : order.status !== 'completed';
    const matchesSearch = searchQuery === '' || 
      order.table_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'pl-20' : 'pl-64'}`}>
        {/* Sticky Header */}
        <header className="bg-background/80 backdrop-blur-xl border-b border-white/5 pt-8 pb-6 sticky top-0 z-10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black text-primary-text tracking-tight flex items-center gap-3">
                  {showCompleted ? 'Order History' : 'Active Orders'}
                  <span className="bg-accent/10 text-accent text-xs px-3 py-1 rounded-full border border-accent/20">
                    {filteredOrders.length}
                  </span>
                </h1>
                <p className="text-secondary-text text-sm font-medium mt-1">Manage and track live table orders</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search Table or Item..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-accent outline-none transition-all"
                  />
                </div>

                <button 
                  onClick={() => setShowCompleted(!showCompleted)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    showCompleted 
                      ? 'bg-accent text-background shadow-lg shadow-accent/20' 
                      : 'bg-white/5 text-secondary-text border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <History size={18} />
                  {showCompleted ? 'Active' : 'History'}
                </button>

                <button 
                  onClick={handleRefresh}
                  className="p-3 bg-white/5 hover:bg-white/10 text-secondary-text rounded-xl border border-white/10 transition-all"
                >
                  <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>

                <button 
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`p-3 rounded-xl border transition-all ${
                    notificationsEnabled ? 'text-accent bg-accent/10 border-accent/20' : 'text-secondary-text bg-white/5 border-white/10'
                  }`}
                >
                  {notificationsEnabled ? <Bell size={18} className="animate-bounce" /> : <BellOff size={18} />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-6 pb-24">
          <div className="container mx-auto">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <OrderCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-secondary-text bg-card rounded-2xl border border-white/5">
                <p className="text-lg">{showCompleted ? 'No history found' : 'No active orders'}</p>
              </div>
            ) : (
              <OrderList orders={filteredOrders} onMessageCountChange={handleMessageCountChange} />
            )}
          </div>
        </main>

        <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2857/2857-preview.mp3" preload="auto" />
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCcw className="animate-spin text-accent" size={48} />
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}
