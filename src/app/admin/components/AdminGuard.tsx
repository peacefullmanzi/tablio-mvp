'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { createContext, useContext } from 'react';
import { adminFetch } from '@/lib/api-client';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

const BELL_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; // Clean bell sound

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

  const getRestaurantId = () => ridParam || localStorage.getItem('tablio_rid') || process.env.NEXT_PUBLIC_RESTAURANT_ID;

  useEffect(() => {
    setTimeout(() => setHasMounted(true), 0);
    
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

  // --- Real-time Chat Notification Listener ---
  const setHasNewMessages = useStore(state => state.setHasNewMessages);
  
  useEffect(() => {
    if (!authorized || pathname === '/admin/login') return;
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    console.log(`[AdminGuard] Monitoring for new messages for: ${restaurantId}`);
    
    // We only want to notify for messages created AFTER the staff opened the dashboard
    const startTime = new Date();

    const q = query(
      collection(db, 'messages'),
      where('restaurantId', '==', restaurantId),
      where('sender', '==', 'customer')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Check if any of the changes are new additions
      const newMessages = snapshot.docChanges().filter(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const createdAt = data.createdAt?.toDate?.() || new Date();
          return createdAt > startTime;
        }
        return false;
      });

      if (newMessages.length > 0) {
        console.log(`[AdminGuard] ${newMessages.length} new customer messages!`);
        
        // 1. Update UI dot
        if (pathname !== '/admin/chat') {
          setHasNewMessages(true);
        }

        // 2. Play sound (Bell)
        const audio = new Audio(BELL_SOUND);
        audio.play().catch(e => console.warn("Sound play blocked by browser:", e));
      }
    });

    return () => unsubscribe();
  }, [authorized, ridParam, pathname]);

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
      <div className="h-screen bg-background flex overflow-hidden w-full">
        <AdminSidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
