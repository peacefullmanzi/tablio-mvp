import Link from 'next/link';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-500/10 p-6 rounded-full mb-6">
        <AlertTriangle size={48} className="text-red-500" />
      </div>
      <h1 className="text-4xl font-black text-primary-text mb-2">404</h1>
      <h2 className="text-xl font-bold text-secondary-text mb-4">Page Not Found</h2>
      <p className="text-secondary-text text-sm mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link 
        href="/"
        className="flex items-center gap-2 bg-accent hover:bg-emerald-400 text-background font-black px-8 py-3 rounded-xl transition-all"
      >
        <Home size={18} />
        Back to Home
      </Link>
    </div>
  );
}