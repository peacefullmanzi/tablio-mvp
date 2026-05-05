'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  QrCode, ChefHat, LayoutDashboard, Truck,
  XCircle, Clock, AlertTriangle, Users,
  CheckCircle, Zap, BarChart3, ShieldCheck,
  Hotel, Coffee, MapPin, UtensilsCrossed,
  ArrowRight, Send, Loader2, Mail, Phone
} from 'lucide-react';
import TemfyLogo from '@/components/ui/TemfyLogo';

// ─── Waitlist Form ─────────────────────────────────────────
function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [formData, setFormData] = useState({ name: '', email: '', business: 'restaurant' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');
    // Simulate API call — replace with real endpoint later
    await new Promise(r => setTimeout(r, 1200));
    setFormState('success');
  };

  if (formState === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-3 ${compact ? 'p-4' : 'p-6'} bg-accent/10 border border-accent/20 rounded-2xl`}
      >
        <CheckCircle className="text-accent shrink-0" size={24} />
        <div>
          <p className="font-bold text-primary-text">You&apos;re on the list!</p>
          <p className="text-sm text-secondary-text">We&apos;ll reach out with early access details soon.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-3 ${compact ? '' : 'max-w-md mx-auto'}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          required
          type="text"
          placeholder="Your name"
          value={formData.name}
          onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text/50 focus:border-accent focus:outline-none transition-colors"
        />
        <input
          required
          type="email"
          placeholder="Work email"
          value={formData.email}
          onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text/50 focus:border-accent focus:outline-none transition-colors"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={formData.business}
          onChange={e => setFormData(p => ({ ...p, business: e.target.value }))}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-secondary-text focus:border-accent focus:outline-none transition-colors appearance-none cursor-pointer"
        >
          <option value="restaurant">Restaurant</option>
          <option value="hotel">Hotel</option>
          <option value="cafe">Bar / Café</option>
          <option value="other">Other</option>
        </select>
        <button
          type="submit"
          disabled={formState === 'loading'}
          className="bg-accent hover:bg-emerald-400 text-background font-bold px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-60 shrink-0"
        >
          {formState === 'loading' ? (
            <><Loader2 size={18} className="animate-spin" /> Joining...</>
          ) : (
            <><Send size={16} /> Join Waitlist</>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Fade-in wrapper ───────────────────────────────────────
function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function LandingPage() {
  const problems = [
    { icon: XCircle, text: 'Waiters miss orders during rush hours' },
    { icon: Clock, text: 'Customers wait too long to be served' },
    { icon: AlertTriangle, text: 'Managers have no real-time visibility' },
    { icon: Users, text: 'Manual systems create costly errors' },
  ];

  const solutions = [
    { icon: QrCode, text: 'Customers scan QR and order instantly' },
    { icon: Zap, text: 'Kitchen and staff receive orders in real-time' },
    { icon: BarChart3, text: 'Managers track everything live' },
    { icon: ShieldCheck, text: 'No confusion. No lost orders.' },
  ];

  const steps = [
    { icon: QrCode, title: 'Scan QR', desc: 'Customer opens camera and scans the table code' },
    { icon: UtensilsCrossed, title: 'Place Order', desc: 'Browse the menu and order in under 30 seconds' },
    { icon: ChefHat, title: 'Kitchen Receives', desc: 'Staff sees the order instantly on their dashboard' },
    { icon: Truck, title: 'Delivered', desc: 'Order is prepared, tracked, and delivered to the table' },
  ];

  const useCases = [
    { icon: UtensilsCrossed, title: 'Restaurants', desc: 'Dine-in ordering without the wait' },
    { icon: Hotel, title: 'Hotels', desc: 'Room service at the tap of a phone' },
    { icon: Coffee, title: 'Bars & Cafés', desc: 'Fast drink orders, no queue' },
    { icon: MapPin, title: 'High-Traffic Venues', desc: 'Scale service without scaling staff' },
  ];

  return (
    <div className="min-h-screen bg-background text-primary-text flex flex-col overflow-x-hidden">

      {/* ═══ Navbar ═══ */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <TemfyLogo size={32} color="#10B981" />
            <span className="text-xl font-black tracking-tighter">Temfy</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-secondary-text hover:text-primary-text transition-colors hidden sm:block">
              Login
            </Link>
            <a href="#waitlist" className="bg-accent hover:bg-emerald-400 text-background text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-accent/20">
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="relative py-20 sm:py-28 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/8 blur-[120px] rounded-full" />
        </div>
        <div className="max-w-6xl mx-auto relative flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left">
            <FadeIn>
              <p className="text-accent font-bold text-sm tracking-widest uppercase mb-6">QR Ordering for Restaurants & Hotels</p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                Serve customers faster.<br />
                <span className="text-accent">Without the chaos.</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="text-lg sm:text-xl text-secondary-text max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                Real-time QR ordering that eliminates missed orders, long waits, and manual mistakes. Your customers order from their phone. Your staff sees it instantly.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start max-w-md mx-auto lg:mx-0">
                <a href="#waitlist" className="flex-1 bg-accent hover:bg-emerald-400 text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-accent/20 text-sm">
                  Join Waitlist <ArrowRight size={16} />
                </a>
                <a href="#how-it-works" className="flex-1 bg-white/5 border border-white/10 text-primary-text font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all text-sm">
                  See How It Works
                </a>
              </div>
            </FadeIn>
          </div>
          {/* Right: Mockup */}
          <FadeIn delay={0.2} className="flex-1 w-full max-w-xl lg:max-w-none">
            <div className="relative">
              <div className="absolute -inset-4 bg-accent/10 blur-3xl rounded-3xl pointer-events-none" />
              <Image
                src="/mockup.png"
                alt="Temfy - Customer ordering and Admin dashboard"
                width={1344}
                height={896}
                className="relative rounded-xl shadow-2xl shadow-black/40 border border-white/10 w-full h-auto"
                priority
              />
            </div>
          </FadeIn>
        </div>
      </section>



      {/* ═══ Problem ═══ */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-red-400/80 font-bold text-sm tracking-widest uppercase mb-4 text-center">The Problem</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center tracking-tight mb-14">
              Service is slow. Orders get lost.<br className="hidden sm:block" /> Staff gets overwhelmed.
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {problems.map((item, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="flex items-start gap-4 bg-card border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-colors">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-red-400" />
                  </div>
                  <p className="text-sm text-secondary-text leading-relaxed pt-2">{item.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Solution ═══ */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-accent font-bold text-sm tracking-widest uppercase mb-4 text-center">The Solution</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center tracking-tight mb-14">
              Temfy fixes this <span className="text-accent">instantly</span>.
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {solutions.map((item, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="flex items-start gap-4 bg-card border border-white/5 rounded-xl p-5 hover:border-accent/20 transition-colors">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-accent" />
                  </div>
                  <p className="text-sm text-primary-text leading-relaxed pt-2">{item.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section id="how-it-works" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-accent font-bold text-sm tracking-widest uppercase mb-4 text-center">How It Works</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center tracking-tight mb-14">
              Four steps. Zero friction.
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="relative bg-card border border-white/5 rounded-xl p-6 text-center hover:border-accent/20 transition-colors group">
                  <div className="absolute -top-3 -right-3 w-7 h-7 bg-accent text-background rounded-full flex items-center justify-center text-xs font-black">
                    {i + 1}
                  </div>
                  <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <step.icon size={24} className="text-accent" />
                  </div>
                  <h3 className="font-bold text-primary-text mb-1">{step.title}</h3>
                  <p className="text-sm text-secondary-text leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Use Cases ═══ */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-accent font-bold text-sm tracking-widest uppercase mb-4 text-center">Built For</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center tracking-tight mb-14">
              Works everywhere food is served.
            </h2>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {useCases.map((uc, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="bg-card border border-white/5 rounded-xl p-6 text-center hover:border-accent/20 transition-colors group">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <uc.icon size={22} className="text-accent" />
                  </div>
                  <h3 className="font-bold text-sm text-primary-text mb-1">{uc.title}</h3>
                  <p className="text-xs text-secondary-text leading-relaxed">{uc.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA / Waitlist ═══ */}
      <section id="waitlist" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap size={28} className="text-accent" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-4">
              Be among the first to use Temfy.
            </h2>
            <p className="text-secondary-text mb-10 max-w-lg mx-auto">
              Get early access and priority onboarding. No credit card required.
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <WaitlistForm />
          </FadeIn>
        </div>
      </section>

      {/* ═══ Contact ═══ */}
      <section id="contact" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <p className="text-accent font-bold text-sm tracking-widest uppercase mb-4">Get in Touch</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-6">
              Have questions? Let&apos;s talk.
            </h2>
            <p className="text-secondary-text mb-10 max-w-lg mx-auto">
              Whether you&apos;re ready to get started or just want to learn more, we&apos;d love to hear from you.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <a
                href="mailto:peacefullmanzi@gmail.com"
                className="flex-1 bg-card border border-white/10 rounded-xl p-5 flex items-center gap-4 hover:border-accent/30 transition-colors group"
              >
                <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Mail size={20} className="text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-secondary-text mb-0.5">Email</p>
                  <p className="text-sm font-bold text-primary-text">peacefullmanzi@gmail.com</p>
                </div>
              </a>
              <a
                href="tel:+250796348676"
                className="flex-1 bg-card border border-white/10 rounded-xl p-5 flex items-center gap-4 hover:border-accent/30 transition-colors group"
              >
                <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Phone size={20} className="text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-secondary-text mb-0.5">Phone</p>
                  <p className="text-sm font-bold text-primary-text">+250 796 348 676</p>
                </div>
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <TemfyLogo size={24} color="#10B981" />
            <span className="text-sm font-black tracking-tighter">Temfy</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xs text-secondary-text hover:text-primary-text transition-colors">
              Restaurant Login
            </Link>
            <Link href="/onboarding" className="text-xs text-secondary-text hover:text-primary-text transition-colors">
              Onboard
            </Link>
            <a href="#contact" className="text-xs text-secondary-text hover:text-primary-text transition-colors">
              Contact
            </a>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-secondary-text/50">
            <a href="mailto:peacefullmanzi@gmail.com" className="hover:text-secondary-text transition-colors">peacefullmanzi@gmail.com</a>
            <span className="hidden sm:inline">·</span>
            <a href="tel:+250796348676" className="hover:text-secondary-text transition-colors">+250 796 348 676</a>
          </div>
          <p className="text-xs text-secondary-text/50">
            © {new Date().getFullYear()} Temfy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
