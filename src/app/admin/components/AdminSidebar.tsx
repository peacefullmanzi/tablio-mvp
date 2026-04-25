'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Utensils, Settings, LogOut, ChevronLeft, ChevronRight, ExternalLink, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import SettingsModal from './SettingsModal';

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

export default function AdminSidebar({ isCollapsed, setIsCollapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { hasNewMessages, setHasNewMessages } = useStore();

  const getRestaurantId = () => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('rid') || localStorage.getItem('tablio_rid') || '';
  };

  const restaurantId = getRestaurantId();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: `/admin?rid=${restaurantId}` },
    { label: 'Menu Manager', icon: Utensils, href: `/admin/menu?rid=${restaurantId}` },
    { label: 'Support Chat', icon: MessageCircle, href: `/admin/chat?rid=${restaurantId}` },
    { label: 'Live Menu', icon: ExternalLink, href: `/r/${restaurantId}`, isExternal: true },
  ];

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside className={`h-screen fixed left-0 top-0 bg-card/95 backdrop-blur-2xl border-r border-white/10 flex flex-col z-50 transition-all duration-300 shadow-2xl
        ${isCollapsed ? '-translate-x-full lg:translate-x-0 w-20' : 'translate-x-0 w-64'}`}>
        
        {/* Collapse Toggle - Only on Desktop */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="absolute -right-3 top-8 bg-accent text-background rounded-full p-1 shadow-lg hover:scale-110 transition-transform hidden lg:block"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={`p-6 border-b border-white/10 flex items-center gap-3 ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <Image src="/logo.png" alt="Tablio Logo" width={48} height={48} className="h-10 w-auto object-contain shrink-0" />
          {!isCollapsed && (
            <h1 className="text-xl font-black text-primary-text tracking-tight whitespace-nowrap">Tablio OS</h1>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className={`text-xs font-black text-secondary-text/50 uppercase tracking-widest mb-4 px-2 ${isCollapsed ? 'lg:text-center lg:text-[10px]' : ''}`}>
            {isCollapsed ? 'Menu' : 'Main Menu'}
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href.split('?')[0];
            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.isExternal ? "_blank" : undefined}
                rel={item.isExternal ? "noopener noreferrer" : undefined}
                className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all relative ${
                  isActive
                    ? 'bg-accent/10 text-accent border border-accent/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'text-secondary-text hover:bg-white/5 hover:text-primary-text'
                } ${isCollapsed ? 'lg:justify-center' : 'gap-3'}`}
                onClick={() => {
                  if (item.label === 'Support Chat') setHasNewMessages(false);
                  if (window.innerWidth < 1024) setIsCollapsed(true);
                }}
              >
                <item.icon size={20} className={`shrink-0 ${isActive ? 'text-accent' : 'opacity-70'}`} />
                
                {/* Notification Dot */}
                {item.label === 'Support Chat' && hasNewMessages && (
                  <span className={`absolute bg-red-500 rounded-full border-2 border-card animate-pulse ${
                    isCollapsed ? 'top-2 right-2 w-3 h-3' : 'top-3 right-4 w-2.5 h-2.5'
                  }`} />
                )}
                {!isCollapsed && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2 bg-background/30">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-bold text-secondary-text hover:bg-white/5 hover:text-primary-text transition-all ${isCollapsed ? 'lg:justify-center' : 'gap-3'}`}
          >
            <Settings size={20} className="shrink-0 opacity-70" />
            {!isCollapsed && <span>Settings</span>}
          </button>
          <button
            onClick={() => {
              const rid = getRestaurantId();
              if (rid) {
                localStorage.removeItem(`tablio_admin_auth_${rid}`);
              } else {
                localStorage.removeItem('tablio_admin_auth');
              }
              localStorage.removeItem('tablio_token');
              router.push(`/admin/login${rid ? `?rid=${rid}` : ''}`);
            }}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-bold text-red-400 hover:bg-red-400/10 transition-all ${isCollapsed ? 'lg:justify-center' : 'gap-3'}`}
          >
            <LogOut size={20} className="shrink-0 opacity-70" />
            {!isCollapsed && <span>Logout</span>}
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
