'use client';

import { UtensilsCrossed, QrCode, Store, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-primary-text flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Tablio Logo" width={40} height={40} className="object-contain" />
          <span className="text-2xl font-black tracking-tighter">Tablio</span>
        </div>
        <Link 
          href="/admin" 
          className="text-sm font-bold text-secondary-text hover:text-accent transition-colors"
        >
          Restaurant Login
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto space-y-12 pb-24">
        <div className="relative">
          <div className="absolute -inset-4 bg-accent/20 blur-3xl rounded-full animate-pulse" />
          <div className="relative bg-white/5 border border-white/10 p-4 rounded-3xl rotate-3">
            <UtensilsCrossed size={64} className="text-accent" />
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[0.9]">
            The Future of <span className="text-accent">Dining</span> is Here.
          </h1>
          <p className="text-lg sm:text-xl text-secondary-text max-w-2xl font-medium">
            Scan. Order. Enjoy. Tablio brings the modern digital experience to your favorite restaurants.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link 
            href="/onboarding"
            className="flex-1 bg-accent text-background font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20"
          >
            GET STARTED <ChevronRight size={20} />
          </Link>
          <button className="flex-1 bg-white/5 border border-white/10 text-primary-text font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
            LEARN MORE
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 w-full">
          <div className="bg-card border border-white/5 p-8 rounded-3xl space-y-4 text-left">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <QrCode size={24} className="text-blue-500" />
            </div>
            <h3 className="font-black text-xl">Scan to Order</h3>
            <p className="text-secondary-text text-sm leading-relaxed">No more waiting for menus. Just scan the QR code and start choosing.</p>
          </div>

          <div className="bg-card border border-white/5 p-8 rounded-3xl space-y-4 text-left">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
              <Sparkles size={24} className="text-purple-500" />
            </div>
            <h3 className="font-black text-xl">Real-time Tracking</h3>
            <p className="text-secondary-text text-sm leading-relaxed">Watch your order move from the kitchen to your table in real-time.</p>
          </div>

          <div className="bg-card border border-white/5 p-8 rounded-3xl space-y-4 text-left">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
              <Store size={24} className="text-accent" />
            </div>
            <h3 className="font-black text-xl">Cloud Kitchen</h3>
            <p className="text-secondary-text text-sm leading-relaxed">Simple admin tools to manage your menu and orders from any device.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-12 text-center border-t border-white/5">
        <p className="text-secondary-text text-xs font-black uppercase tracking-widest">
          Please scan a restaurant QR code to view their menu.
        </p>
      </footer>
    </div>
  );
}
