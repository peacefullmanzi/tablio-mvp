'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, onSnapshot, orderBy, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types/order';
import OrderList from './components/OrderList';
import { RefreshCcw, Bell, BellOff, History, Inbox, Trash2, MessageSquare, Search, Menu } from 'lucide-react';
import { OrderCardSkeleton } from './components/Skeleton';
import { useSidebar } from './components/AdminGuard';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminFetch } from '@/lib/api-client';

function AdminContent() {
  const searchParams = useSearchParams();
  const ridParam = searchParams.get('rid');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const prevOrderCount = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleMessageCountChange = useCallback((orderId: string, count: number) => {
    setMessageCounts(prev => {
      if (prev[orderId] === count) return prev;
      return { ...prev, [orderId]: count };
    });
  }, []);

  const activeChatRooms = Object.values(messageCounts).reduce((a, b) => a + b, 0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleClearHistory = async () => {
    const completedOrders = orders.filter(o => o.status === 'completed');
    if (completedOrders.length === 0 || !confirm(`Delete all ${completedOrders.length} completed orders? This cannot be undone.`)) return;

    try {
      if (!restaurantId) return;
      const response = await adminFetch('/api/admin/orders/clear-history', {
        method: 'POST',
        body: JSON.stringify({ restaurantId })
      });

      if (!response.ok) throw new Error('Failed to clear history');
      alert("History cleared successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to clear history.");
    }
  };

  // Sync restaurantId from URL or Storage
  useEffect(() => {
    const rid = ridParam || localStorage.getItem('tablio_rid') || process.env.NEXT_PUBLIC_RESTAURANT_ID;
    if (rid && rid !== restaurantId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRestaurantId(rid);
      if (rid !== localStorage.getItem('tablio_rid')) {
        localStorage.setItem('tablio_rid', rid);
      }
    }
  }, [ridParam]);

  useEffect(() => {
    if (!restaurantId) {
      console.log("[AdminPage] Waiting for restaurantId...");
      return;
    }

    console.log(`[AdminPage] Starting real-time listener for: ${restaurantId}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log(`[AdminPage] Snapshot update: Found ${querySnapshot.size} orders for ${restaurantId}`);
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedOrders.push({ 
          id: doc.id, 
          ...data,
          created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at
        } as Order);
      });

      const sortedOrders = fetchedOrders.sort((a, b) => {
        const dateA = a.created_at instanceof Date ? a.created_at.getTime() : 0;
        const dateB = b.created_at instanceof Date ? b.created_at.getTime() : 0;
        return dateB - dateA;
      });

      setOrders(sortedOrders);

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
      console.error("[AdminPage] Firestore error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId, refreshKey]);

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

  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Sticky Header */}
      <header className="bg-background/80 backdrop-blur-xl border-b border-white/5 pt-6 pb-6 sticky top-0 z-10">
        <div className="container mx-auto px-6">
          {/* Top Row: Title & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 -ml-2 lg:hidden text-primary-text hover:bg-white/5 rounded-lg"
              >
                <Menu size={24} />
              </motion.button>
              <div>
                <motion.h1 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-2xl lg:text-3xl font-black text-primary-text tracking-tight flex items-center gap-3"
                >
                  Admin Control Center
                  <span className="bg-accent/10 text-accent text-xs px-3 py-1 rounded-full border border-accent/20">
                    {filteredOrders.length}
                  </span>
                </motion.h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-secondary-text text-sm font-medium hidden lg:block">Real-time table order management</p>
                  <span className="text-[10px] text-secondary-text/30 font-mono uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                    ID: {restaurantId || 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative flex-1 max-w-md"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" size={18} />
              <input 
                type="text" 
                placeholder="Search Table, Item, or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-accent outline-none transition-all"
              />
            </motion.div>
          </div>

          {/* Bottom Row: Tabs & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCompleted(false)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  !showCompleted 
                    ? 'bg-accent text-background shadow-lg shadow-accent/20' 
                    : 'text-secondary-text hover:text-white'
                }`}
              >
                <Inbox size={18} />
                Active Orders
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCompleted(true)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  showCompleted 
                    ? 'bg-accent text-background shadow-lg shadow-accent/20' 
                    : 'text-secondary-text hover:text-white'
                }`}
              >
                <History size={18} />
                Order History
              </motion.button>
            </div>

            <div className="flex items-center gap-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-secondary-text rounded-xl border border-white/10 transition-all text-sm font-bold"
              >
                <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Sync</span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold ${
                  notificationsEnabled ? 'text-accent bg-accent/10 border-accent/20' : 'text-secondary-text bg-white/5 border-white/10'
                }`}
              >
                {notificationsEnabled ? <Bell size={18} className="animate-bounce" /> : <BellOff size={18} />}
                <span className="hidden sm:inline">Alerts: {notificationsEnabled ? 'ON' : 'OFF'}</span>
              </motion.button>

              {showCompleted && filteredOrders.length > 0 && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearHistory}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all text-sm font-bold"
                >
                  <Trash2 size={18} />
                  <span className="hidden sm:inline">Clear History</span>
                </motion.button>
              )}
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
              <p className="text-lg">{showCompleted ? 'History is empty' : 'No active orders'}</p>
            </div>
          ) : (
            <OrderList orders={filteredOrders} onMessageCountChange={handleMessageCountChange} />
          )}
        </div>
      </main>

      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" preload="auto" />
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
