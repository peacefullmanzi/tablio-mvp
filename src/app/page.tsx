'use client';

import { UtensilsCrossed, QrCode, Store, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.5
      }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  } as const;

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  } as const;

  return (
    <div className="min-h-screen bg-background text-primary-text flex flex-col overflow-x-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full"
      >
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
      </motion.header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto space-y-12 pb-24">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-accent/20 blur-3xl rounded-full animate-pulse" />
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative bg-white/5 border border-white/10 p-4 rounded-3xl rotate-3"
          >
            <UtensilsCrossed size={64} className="text-accent" />
          </motion.div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.h1 variants={itemVariants} className="text-5xl sm:text-7xl font-black tracking-tight leading-[0.9]">
            The Future of <span className="text-accent">Dining</span> is Here.
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg sm:text-xl text-secondary-text max-w-2xl font-medium">
            Scan. Order. Enjoy. Tablio brings the modern digital experience to your favorite restaurants.
          </motion.p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
            <Link 
              href="/admin"
              className="w-full bg-accent text-background font-black py-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-accent/20"
            >
              ADMIN LOGIN <ChevronRight size={20} />
            </Link>
          </motion.div>
          <motion.button 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }}
            className="flex-1 bg-white/5 border border-white/10 text-primary-text font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          >
            LEARN MORE
          </motion.button>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 w-full">
          {[
            { icon: QrCode, title: "Scan to Order", desc: "No more waiting for menus. Just scan the QR code and start choosing.", color: "text-blue-500", bg: "bg-blue-500/10" },
            { icon: Sparkles, title: "Real-time Tracking", desc: "Watch your order move from the kitchen to your table in real-time.", color: "text-purple-500", bg: "bg-purple-500/10" },
            { icon: Store, title: "Cloud Kitchen", desc: "Simple admin tools to manage your menu and orders from any device.", color: "text-accent", bg: "bg-accent/10" }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-card border border-white/5 p-8 rounded-3xl space-y-4 text-left hover:border-white/20 transition-all group"
            >
              <div className={`w-12 h-12 ${feature.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <feature.icon size={24} className={feature.color} />
              </div>
              <h3 className="font-black text-xl">{feature.title}</h3>
              <p className="text-secondary-text text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="p-12 text-center border-t border-white/5"
      >
        <p className="text-secondary-text text-xs font-black uppercase tracking-widest">
          Please scan a restaurant QR code to view their menu.
        </p>
      </motion.footer>
    </div>
  );
}
