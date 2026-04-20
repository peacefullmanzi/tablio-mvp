'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, ShieldCheck, ArrowRight, Loader2, Copy, Check } from 'lucide-react';

export default function OnboardingPage() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || pin.length < 6) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/create-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create restaurant');
      }

      setCreatedId(data.restaurantId);
    } catch (error) {
      console.error("Onboarding error:", error);
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdId) return;
    navigator.clipboard.writeText(createdId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdId) {
    const restaurantUrl = `${window.location.origin}/r/${createdId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(restaurantUrl)}`;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-card border border-white/10 rounded-3xl p-8 text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={40} className="text-accent" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-primary-text tracking-tight">Setup Complete!</h1>
            <p className="text-secondary-text text-sm">Your restaurant is now live on Tablio.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center bg-background/50 border border-white/5 p-8 rounded-3xl">
            <div className="space-y-4 text-left">
              <div>
                <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest mb-1">Your Menu Link</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono font-bold text-accent truncate max-w-[120px]">{restaurantUrl}</code>
                  <button onClick={() => {
                    navigator.clipboard.writeText(restaurantUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }} className="text-secondary-text hover:text-white">
                    {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-secondary-text leading-relaxed uppercase font-bold">
                Print this QR code and place it on your tables to let customers order instantly.
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl flex items-center justify-center shadow-2xl shadow-accent/20">
              <img src={qrUrl} alt="Restaurant QR Code" className="w-full max-w-[150px] aspect-square" />
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push(`/r/${createdId}`)}
              className="w-full bg-white text-background font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
            >
              VIEW LIVE MENU <ExternalLink size={20} />
            </button>
            <button
              onClick={() => router.push(`/admin?rid=${createdId}`)}
              className="w-full bg-accent text-background font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
            >
              GO TO DASHBOARD <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10 rotate-3">
            <Store size={32} className="text-accent" />
          </div>
          <h1 className="text-4xl font-black text-primary-text tracking-tighter">Welcome to Tablio</h1>
          <p className="text-secondary-text">Let's set up your digital kitchen.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-secondary-text uppercase tracking-widest mb-2 ml-1">Restaurant Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mama's Kitchen"
                className="w-full bg-background border-2 border-white/5 rounded-2xl px-6 py-4 text-primary-text placeholder-white/20 focus:border-accent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-secondary-text uppercase tracking-widest mb-2 ml-1">Admin PIN (6+ Digits)</label>
              <input
                type="password"
                required
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter a secure PIN"
                className="w-full bg-background border-2 border-white/5 rounded-2xl px-6 py-4 text-primary-text placeholder-white/20 focus:border-accent transition-all outline-none"
              />
              <p className="text-[10px] text-secondary-text mt-2 ml-1 uppercase font-bold tracking-tight">Only digits allowed. This PIN will be used for all admin actions.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name || pin.length < 6}
            className="w-full bg-accent disabled:opacity-30 text-background font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'CREATE MY RESTAURANT'}
            {!isSubmitting && <ArrowRight size={20} />}
          </button>
        </form>

        <p className="text-center text-secondary-text text-sm font-medium">
          Already have a restaurant? <button onClick={() => router.push('/admin')} className="text-accent font-black hover:underline">Log in here</button>
        </p>
      </div>
    </div>
  );
}
