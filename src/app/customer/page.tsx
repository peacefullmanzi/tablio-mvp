'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MenuItem as MenuItemType } from '@/types/menu';
import MenuList from './components/MenuList';
import Cart from './components/Cart';
import { UtensilsCrossed, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function CustomerPage() {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Check for active order in local storage
    const lastId = localStorage.getItem('last_order_id');
    if (lastId) setActiveOrderId(lastId);

    const fetchMenuItems = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'menus'));
        
        if (querySnapshot.empty) {
          setMenuItems([]);
        } else {
          const items = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as MenuItemType[];
          setMenuItems(items);
        }
      } catch (error) {
        console.error("Critical: Menu fetch failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  return (
    <div className="min-h-screen bg-background text-primary-text">
      <header className="border-b border-white/5 py-6 sticky top-0 z-10 backdrop-blur-md bg-card/80">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="text-accent" size={28} />
            <h1 className="text-2xl font-bold tracking-tight">Tablio</h1>
          </div>
          
          {activeOrderId && (
            <Link 
              href={`/customer/track/${activeOrderId}`}
              className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 text-accent rounded-lg text-sm font-bold hover:bg-accent hover:text-background transition-all"
            >
              <ExternalLink size={16} />
              Live Status
            </Link>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            <p className="text-secondary-text animate-pulse">Loading menu...</p>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-white/5 p-6 rounded-full mb-4">
              <UtensilsCrossed size={48} className="text-secondary-text/20" />
            </div>
            <h2 className="text-xl font-bold text-primary-text">Menu not available</h2>
            <p className="text-secondary-text mt-2">Check back later for our latest offerings.</p>
          </div>
        ) : (
          <MenuList items={menuItems} />
        )}
      </main>

      <Cart />
    </div>
  );
}
