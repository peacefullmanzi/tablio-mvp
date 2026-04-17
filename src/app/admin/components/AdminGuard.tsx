'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    
    // If we are on the login page, don't guard
    if (pathname === '/admin/login') {
      setAuthorized(true);
      return;
    }

    const auth = localStorage.getItem('tablio_admin_auth');
    const adminPin = process.env.NEXT_PUBLIC_ADMIN_PIN;

    // Strict check: if no PIN is configured in environment, or doesn't match, don't allow access
    if (!adminPin || auth !== adminPin) {
      if (auth) localStorage.removeItem('tablio_admin_auth');
      router.push('/admin/login');
      setAuthorized(false);
    } else {
      setAuthorized(true);
    }
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

  return <>{children}</>;
}
