'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Delete, ArrowRight, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If already authenticated, verify and redirect
    const auth = localStorage.getItem('tablio_admin_auth');
    if (auth) {
      router.push('/admin');
    }
  }, [router]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 8) {
      setPin(prev => prev + num);
      setError(null);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pin.length < 6) {
      setError('PIN must be at least 6 digits');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('tablio_admin_auth', pin);
        router.push('/admin');
      } else {
        setError(data.error || 'Invalid credentials');
        setPin('');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('Connection failed. Try again.');
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logo/Icon */}
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-accent/20">
          <Lock className="text-accent" size={32} />
        </div>

        <h1 className="text-2xl font-bold text-primary-text mb-2">Staff Access</h1>
        <p className="text-secondary-text mb-8 text-center">Enter your security PIN to continue</p>

        {/* PIN Display (Dynamic Dots) */}
        <div className="flex gap-3 mb-10 h-6">
          {Array.from({ length: Math.max(6, pin.length) }).map((_, i) => (
            <div 
              key={i}
              className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                pin.length > i 
                  ? 'bg-accent border-accent scale-110 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                  : 'border-white/20'
              } ${error ? 'border-red-500 animate-bounce' : ''}`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full px-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-16 rounded-xl bg-card border border-white/5 text-2xl font-bold text-primary-text hover:bg-white/5 active:scale-95 transition-all outline-none"
            >
              {num}
            </button>
          ))}
          <button 
            onClick={handleDelete}
            className="h-16 rounded-xl bg-card/50 flex items-center justify-center text-secondary-text hover:text-red-500 hover:bg-red-500/10 transition-colors outline-none"
          >
            <Delete size={24} />
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-xl bg-card border border-white/5 text-2xl font-bold text-primary-text hover:bg-white/5 active:scale-95 transition-all outline-none"
          >
            0
          </button>
          <button 
            onClick={() => !isSubmitting && handleSubmit()}
            disabled={isSubmitting || pin.length < 6}
            className="h-16 rounded-xl bg-accent flex items-center justify-center text-background hover:bg-emerald-400 active:scale-95 transition-all outline-none disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <ArrowRight size={24} />}
          </button>
        </div>

        {error && (
          <p className="mt-6 text-red-500 font-medium text-center animate-in fade-in slide-in-from-top-2 max-w-[80%]">
            {error}
          </p>
        )}

        <div className="mt-12 text-secondary-text text-[10px] uppercase tracking-widest opacity-50">
          Tablio Security Layer v2.0
        </div>
      </div>
    </div>
  );
}
