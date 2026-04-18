'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Utensils, Settings, LogOut } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import SettingsModal from './SettingsModal';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Menu Manager', icon: Utensils, href: '/admin/menu' },
  ];

  return (
    <>
      <aside className="w-64 h-screen fixed left-0 top-0 bg-card/70 backdrop-blur-2xl border-r border-white/10 flex flex-col z-50">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Image src="/logo.png" alt="Tablio Logo" width={48} height={48} className="h-10 w-auto object-contain" />
          <h1 className="text-xl font-black text-primary-text tracking-tight">Tablio OS</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-black text-secondary-text/50 uppercase tracking-widest mb-4 px-2">Main Menu</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive
                    ? 'bg-accent/10 text-accent border border-accent/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'text-secondary-text hover:bg-white/5 hover:text-primary-text'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-accent' : 'opacity-70'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2 bg-background/30">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-secondary-text hover:bg-white/5 hover:text-primary-text transition-all"
          >
            <Settings size={20} className="opacity-70" />
            Settings
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('tablio_admin_auth');
              router.push('/admin/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={20} className="opacity-70" />
            Logout
          </button>
        </div>
      </aside>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
}
