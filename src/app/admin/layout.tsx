import { Suspense } from 'react';
import AdminGuard from './components/AdminGuard';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    }>
      <AdminGuard>
        {children}
      </AdminGuard>
    </Suspense>
  );
}
