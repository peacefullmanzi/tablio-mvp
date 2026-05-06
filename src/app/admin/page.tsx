'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, onSnapshot, orderBy, where, limit, startAfter, endBefore, getDocs, limitToLast, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types/order';
import OrderList from './components/OrderList';
import { RefreshCcw, Bell, BellOff, History, Inbox, Trash2, MessageSquare, Search, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [restaurantName, setRestaurantName] = useState('Admin');
  const [role, setRole] = useState<'manager' | 'staff'>('staff');

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const prevOrderCount = useRef<number | null>(null);

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

    const fetchInfo = async () => {
      try {
        const response = await adminFetch('/api/admin/restaurant-info');
        const data = await response.json();
        if (data.success) {
          setRestaurantName(data.name);
          setRole(data.role);
        }
      } catch (err) {
        console.error("Error fetching restaurant info:", err);
      }
    };

    fetchInfo();
  }, [restaurantId]);

  // REAL-TIME LISTENER FOR ACTIVE ORDERS
  useEffect(() => {
    if (!restaurantId || showCompleted) return;

    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedOrders.push({ 
          id: doc.id, 
          ...data,
      const sortedOrders = fetchedOrders
        .filter(o => o.status !== 'completed')
        .sort((a, b) => {
          const dateA = a.created_at instanceof Date ? a.created_at.getTime() : 0;
          const dateB = b.created_at instanceof Date ? b.created_at.getTime() : 0;
          return dateB - dateA;
        });

      setOrders(sortedOrders);
      setIsLoading(false);
    }, (error) => {
      console.error("[AdminPage] Active orders listener error:", error);
      if (error.message.includes('index')) {
        alert("Firestore Index Required: Please check the console and click the link to create the required composite index for orders.");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId, showCompleted]);

  // PAGINATED FETCH FOR HISTORY
  const fetchHistory = useCallback(async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
    if (!restaurantId) return;
    setIsFetchingHistory(true);

    try {
      let q = query(
        collection(db, 'orders'),
        where('restaurantId', '==', restaurantId),
        where('status', '==', 'completed'),
        orderBy('created_at', 'desc')
      );

      if (direction === 'next' && lastVisible) {
        q = query(q, startAfter(lastVisible), limit(10));
      } else if (direction === 'prev' && firstVisible) {
        q = query(q, endBefore(firstVisible), limitToLast(10));
      } else {
        q = query(q, limit(10));
      }

      const snapshot = await getDocs(q);
      const fetched: Order[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        fetched.push({
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at
        } as Order);
      });

      if (fetched.length > 0) {
        setHistoryOrders(fetched);
        setFirstVisible(snapshot.docs[0]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        if (direction === 'next') setPage(p => p + 1);
        if (direction === 'prev') setPage(p => Math.max(1, p - 1));
        if (direction === 'initial') {
          setPage(1);
          setHasMore(snapshot.docs.length === 10);
        }
      } else if (direction === 'next') {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("Error fetching history:", err);
      if (err.message?.includes('index')) {
        alert("Firestore Index Required for History: Please check the browser console for a link to generate the required index.");
      }
    } finally {
      setIsFetchingHistory(false);
      setIsLoading(false);
    }
  }, [restaurantId, lastVisible, firstVisible]);

  useEffect(() => {
    if (showCompleted && restaurantId) {
      fetchHistory('initial');
    }
  }, [showCompleted, restaurantId, refreshKey]);

  const filteredOrders = showCompleted ? historyOrders : orders;
  const matchesSearch = (order: Order) => {
    if (searchQuery === '') return true;
    return order.table_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const displayOrders = filteredOrders.filter(matchesSearch);

  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {role === 'staff' && (
        <div className="bg-blue-600 text-white py-1 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-center shadow-lg z-50">
          Staff Mode Active • Restricted Access
        </div>
      )}
      {/* Sticky Header */}
      <header className="bg-background/80 backdrop-blur-xl border-b border-white/5 pt-4 pb-4 sm:pt-6 sm:pb-6 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-4 min-w-0">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 -ml-2 lg:hidden text-primary-text hover:bg-white/5 rounded-lg shrink-0"
              >
                <Menu size={24} />
              </motion.button>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <motion.h1 
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="text-xl lg:text-2xl font-black text-primary-text tracking-tight truncate"
                  >
                    {restaurantName}
                  </motion.h1>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${
                    role === 'manager' 
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                  }`}>
                    {role === 'manager' ? 'Manager' : 'Staff Mode'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-secondary-text text-xs font-bold uppercase tracking-wider opacity-60">Dashboard</p>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-accent text-xs font-bold">{filteredOrders.length} active</span>
                </div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative flex-1 max-w-sm"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" size={16} />
              <input 
                type="text" 
                placeholder="Search Table or Item..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-accent outline-none transition-all"
              />
            </motion.div>
          </div>

          {/* Bottom Row: Tabs & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
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


            </div>
          </div>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        <div className="container mx-auto">
          {isLoading || isFetchingHistory ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          ) : displayOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-secondary-text bg-card rounded-2xl border border-white/5">
              <p className="text-lg">{showCompleted ? 'History is empty' : 'No active orders'}</p>
            </div>
          ) : (
            <>
              <OrderList orders={displayOrders} onMessageCountChange={handleMessageCountChange} />
              
              {showCompleted && (
                <div className="mt-12 flex items-center justify-center gap-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fetchHistory('prev')}
                    disabled={page === 1}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-primary-text font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={20} />
                    Previous
                  </motion.button>
                  
                  <div className="text-secondary-text font-black tracking-widest uppercase text-xs">
                    Page {page}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fetchHistory('next')}
                    disabled={!hasMore}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-primary-text font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                    <ChevronRight size={20} />
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
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
