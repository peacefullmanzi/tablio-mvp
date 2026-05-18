'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError] Application error:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-[#0F172A] min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight">System Error</h1>
            <p className="text-slate-400 text-sm">
              Something went wrong. Please try again or return to the homepage.
            </p>
            {error.digest && (
              <p className="text-xs text-slate-500 font-mono">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              <Home size={18} />
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}