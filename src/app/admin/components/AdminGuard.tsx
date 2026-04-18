'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setTimeout(() => setHasMounted(true), 0);
    
    // If we are on the login page, don't guard
    if (pathname === '/admin/login') {
      setTimeout(() => setAuthorized(true), 0);
      return;
    }

    const verifyAccess = async () => {
      const auth = localStorage.getItem('tablio_admin_auth');
      
      if (!auth) {
        router.push('/admin/login');
        setAuthorized(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: auth })
        });

        if (response.ok) {
          setAuthorized(true);
        } else {
          localStorage.removeItem('tablio_admin_auth');
          router.push('/admin/login');
          setAuthorized(false);
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
        // Fallback: stay unauthorized if verify fails
        setAuthorized(false);
      }
    };

    verifyAccess();
  }, [pathname, router]);

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
    <div className="flex min-h-screen bg-background">
      <AdminSidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {children}
      </div>
    </div>
  );
}
