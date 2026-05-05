'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { createContext, useContext } from 'react';
import { adminFetch } from '@/lib/api-client';
import { requestNotificationPermission } from '@/lib/fcm';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Bell } from 'lucide-react';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'admin';
  createdAt: unknown;
  roomId: string;
  orderId?: string;
}

interface GlobalChatProps {
  restaurantId: string;
  tableNumber: string;
  orderId: string; // Required for order-specific chat
  isOpen: boolean;
  onClose: () => void;
}

const BELL_SOUND = "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"; // Softer digital alert for messages
const ORDER_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; // Loud bell for orders (must be noticeable)

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within SidebarProvider');
  return context;
};

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ridParam = searchParams.get('rid');

  const [authorized, setAuthorized] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeNotification, setActiveNotification] = useState<{ table: string; orderId: string; type: 'chat' | 'order' } | null>(null);

  const getRestaurantId = () => ridParam || localStorage.getItem('tablio_rid') || process.env.NEXT_PUBLIC_RESTAURANT_ID;

  useEffect(() => {
    setTimeout(() => setHasMounted(true), 0);

    // Request native notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // If we are on the login page, don't guard
    if (pathname === '/admin/login') {
      setTimeout(() => setAuthorized(true), 0);
      return;
    }

    const verifyAccess = async () => {
      const restaurantId = getRestaurantId();
      const token = localStorage.getItem('tablio_token');

      if (!token || !restaurantId) {
        router.push(`/admin/login${restaurantId ? `?rid=${restaurantId}` : ''}`);
        setAuthorized(false);
        return;
      }

      try {
        const response = await adminFetch('/api/admin/auth/session');
        const data = await response.json();

        if (response.ok && data.restaurantId === restaurantId) {
          localStorage.setItem('tablio_role', data.role);
          setAuthorized(true);
        } else {
          console.warn(`[AdminGuard] Session mismatch or invalid. Expected: ${restaurantId}, Got: ${data.restaurantId}`);
          localStorage.removeItem('tablio_token');
          router.push(`/admin/login?rid=${restaurantId}`);
          setAuthorized(false);
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
        setAuthorized(false);
      }
    };

    verifyAccess();
  }, [pathname, router]);

  // --- Register FCM token for push notifications ---
  useEffect(() => {
    if (!authorized) return;

    const registerFCM = async () => {
      try {
        const token = await requestNotificationPermission();
        if (token) {
          await adminFetch('/api/admin/fcm', {
            method: 'POST',
            body: JSON.stringify({ token }),
          });
          console.log('[FCM] Token registered successfully');
        }
      } catch (err) {
        console.warn('[FCM] Registration skipped:', err);
      }
    };

    registerFCM();
  }, [authorized]);

  // --- Real-time Chat Notification Listener ---
  const setHasNewMessages = useStore(state => state.setHasNewMessages);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!authorized) return;
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    console.log(`[AdminGuard] Monitoring for new messages for: ${restaurantId}`);

    const startTime = new Date();

    const q = query(
      collection(db, 'messages'),
      where('restaurantId', '==', restaurantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docChanges().filter(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.sender !== 'customer') return false;
          
          const createdAt = data.createdAt?.toDate?.() || new Date();
          return createdAt.getTime() > startTime.getTime() - 2000;
        }
        return false;
      });

      if (newMessages.length > 0) {
        // Only notify if we are NOT on the chat page
        if (pathnameRef.current !== '/admin/chat') {
          const firstNew = newMessages[0].doc.data();
          setHasNewMessages(true);
          setActiveNotification({
            table: firstNew.tableNumber,
            orderId: firstNew.orderId || '?',
            type: 'chat'
          });

          // Native Background Notification
          if (Notification.permission === 'granted') {
            new Notification(`New Message: Table ${firstNew.tableNumber}`, {
              body: firstNew.message || 'Customer sent a new message.',
              icon: '/logo.svg'
            });
          }

          // Vibrate and Play Sound (Foreground)
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
          const audio = new Audio(BELL_SOUND);
          audio.play().catch(e => console.warn("Sound play blocked by browser.", e));
        }
      }
    });

    // --- GLOBAL ORDER LISTENER ---
    const qOrders = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId)
    );

    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const newOrders = snapshot.docChanges().filter(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Use a 5-second window to be safe against slight clock drifts
          const createdAt = data.created_at?.toDate?.() || new Date();
          return createdAt.getTime() > startTime.getTime() - 5000;
        }
        return false;
      });

      if (newOrders.length > 0) {
        // Always notify for orders regardless of page
        const firstOrder = newOrders[0].doc.data();
        setActiveNotification({
          table: firstOrder.table_number,
          orderId: newOrders[0].doc.id,
          type: 'order'
        });

        // Native Background Notification
        if (Notification.permission === 'granted') {
          new Notification(`⚡ New Order! Table ${firstOrder.table_number}`, {
            body: `A new order has been placed.`,
            icon: '/logo.svg'
          });
        }

        // Vibrate and Play Sound (Foreground)
        if ('vibrate' in navigator) {
          navigator.vibrate([500, 110, 500, 110, 450]);
        }
        const audio = new Audio(ORDER_SOUND);
        audio.play().catch(e => console.warn("Order sound blocked.", e));
      }
    });

    return () => {
      unsubscribe();
      unsubscribeOrders();
    };
  }, [authorized, ridParam]);

  // During SSR or until mounted, show a loader to prevent any flash
  if (!hasMounted || (!authorized && pathname !== '/admin/login')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="text-secondary-text animate-pulse">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed: isSidebarCollapsed, setIsCollapsed: setIsSidebarCollapsed }}>
      <div className="h-screen bg-background flex flex-col overflow-hidden w-full relative">

        {/* HIGH VISIBILITY NOTIFICATION BANNER */}
        <AnimatePresence>
          {activeNotification && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-9999 w-full max-w-md px-4"
            >
              <div className="bg-red-600 text-white rounded-2xl shadow-2xl shadow-red-500/40 p-4 flex items-center justify-between border border-red-500/50">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl animate-pulse ${activeNotification.type === 'order' ? 'bg-amber-500/20 text-amber-500' : 'bg-white/20 text-white'}`}>
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">
                      {activeNotification.type === 'order' ? '⚡ New Order Arrived!' : '💬 New Message Received!'}
                    </h4>
                    <p className="text-xs opacity-90 font-medium">Table {activeNotification.table} • {activeNotification.type === 'order' ? 'Pending Kitchen' : `Session ${activeNotification.orderId.slice(-6).toUpperCase()}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (activeNotification.type === 'order') {
                        router.push(`/admin?rid=${getRestaurantId()}`);
                      } else {
                        router.push(`/admin/chat?rid=${getRestaurantId()}`);
                      }
                      setActiveNotification(null);
                    }}
                    className="bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-white/90 transition-all active:scale-95"
                  >
                    {activeNotification.type === 'order' ? 'View Order' : 'Reply'}
                  </button>
                  <button
                    onClick={() => setActiveNotification(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex overflow-hidden">
          <AdminSidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
          <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
            {children}
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
