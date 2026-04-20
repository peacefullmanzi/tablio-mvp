'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const ridParam = searchParams.get('rid');
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const getRestaurantId = () => ridParam || localStorage.getItem('tablio_rid') || process.env.NEXT_PUBLIC_RESTAURANT_ID;

  useEffect(() => {
    // If already authenticated for THIS restaurant, verify and redirect
    const restaurantId = getRestaurantId();
    const authKey = restaurantId ? `tablio_admin_auth_${restaurantId}` : 'tablio_admin_auth';
    const auth = localStorage.getItem(authKey);
    
    if (auth && restaurantId) {
      router.push(`/admin?rid=${restaurantId}`);
    }
  }, [router, ridParam]);


  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pin.length < 6) {
      setError('PIN must be at least 6 digits');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        setError('No restaurant ID found. Please scan the QR code again.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/admin/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, restaurantId })
      });

      const data = await response.json();

      if (response.ok) {
        const authKey = `tablio_admin_auth_${restaurantId}`;
        localStorage.setItem(authKey, pin);
        router.push(`/admin?rid=${restaurantId}`);
      } else {
        setError(data.error || 'Invalid credentials');
        setPin('');
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('Connection failed. Try again.');
      setPin('');
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-background flex flex-col items-center justify-center p-4 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logo/Icon */}
        <div className="w-20 h-20 bg-accent/10 rounded-4xl flex items-center justify-center mb-8 border border-accent/20 shadow-2xl shadow-accent/5">
          <Lock className="text-accent" size={36} />
        </div>

        <h1 className="text-3xl font-black text-primary-text mb-3 tracking-tight">Staff Access</h1>
        <p className="text-secondary-text mb-12 text-center text-sm font-medium">Type your security PIN to continue</p>

        {/* Hidden Input for Keyboard Access */}
        <form onSubmit={handleSubmit} className="relative w-full flex flex-col items-center">
          <input
            ref={inputRef}
            type="tel"
            pattern="[0-9]*"
            inputMode="numeric"
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              if (val.length <= 8) {
                setPin(val);
                setError(null);
              }
            }}
            className="absolute opacity-0 inset-0 cursor-default"
            autoFocus
            disabled={isSubmitting}
          />

          {/* PIN Display (Dynamic Dots) */}
          <div className="flex gap-4 mb-12 h-12 items-center justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  pin.length > i 
                    ? 'bg-accent border-accent scale-125 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                    : 'border-white/10 bg-white/5'
                } ${error ? 'border-red-500 animate-shake' : ''}`}
              />
            ))}
            {pin.length > 6 && Array.from({ length: pin.length - 6 }).map((_, i) => (
              <div 
                key={i + 6}
                className="w-4 h-4 rounded-full border-2 bg-accent border-accent scale-125 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300"
              />
            ))}
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || pin.length < 6}
            className="w-full h-16 rounded-2xl bg-accent text-background flex items-center justify-center gap-3 font-black text-lg hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-xl shadow-accent/20 disabled:opacity-30 disabled:grayscale"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                CONTINUE <ArrowRight size={24} />
              </>
            )}
          </button>
        </form>

        {error && (
          <p className="mt-8 text-red-500 font-bold text-center animate-in fade-in slide-in-from-top-4 bg-red-500/10 px-6 py-2 rounded-full border border-red-500/20">
            {error}
          </p>
        )}

        <div className="mt-20 flex flex-col items-center gap-2">
          <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] text-secondary-text font-black uppercase tracking-[0.2em]">
            Secure Endpoint
          </div>
          <p className="text-secondary-text text-[10px] font-medium opacity-40">
            Tablio Security Layer v2.0 • Admin Dashboard
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
