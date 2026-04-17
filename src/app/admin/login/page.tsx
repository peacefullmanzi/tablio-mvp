'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Delete, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const ADMIN_PIN = "1234"; // Simple MVP PIN. In production, move to env or DB.

  useEffect(() => {
    // If already authenticated, skip login
    const auth = localStorage.getItem('tablio_admin_auth');
    if (auth === 'true') {
      router.push('/admin');
    }
  }, [router]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pin === ADMIN_PIN) {
      localStorage.setItem('tablio_admin_auth', 'true');
      router.push('/admin');
    } else {
      setError(true);
      setPin('');
      // Shake animation could be added here
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logo/Icon */}
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-accent/20">
          <Lock className="text-accent" size={32} />
        </div>

        <h1 className="text-2xl font-bold text-primary-text mb-2">Staff Access</h1>
        <p className="text-secondary-text mb-8 text-center">Enter your 4-digit security PIN to continue</p>

        {/* PIN Display */}
        <div className="flex gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
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
            onClick={() => pin.length === 4 && handleSubmit()}
            className="h-16 rounded-xl bg-accent flex items-center justify-center text-background hover:bg-emerald-400 active:scale-95 transition-all outline-none"
          >
            <ArrowRight size={24} />
          </button>
        </div>

        {error && (
          <p className="mt-6 text-red-500 font-medium animate-in fade-in slide-in-from-top-2">
            Incorrect PIN. Please try again.
          </p>
        )}

        <div className="mt-12 text-secondary-text text-[10px] uppercase tracking-widest opacity-50">
          Tablio Security Layer v1.0
        </div>
      </div>
    </div>
  );
}
