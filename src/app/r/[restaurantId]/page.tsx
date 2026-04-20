'use client';

import { useEffect, useState, use } from 'react';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MenuItem as MenuItemType } from '@/types/menu';
import MenuList from '../../customer/components/MenuList';
import Cart from '../../customer/components/Cart';
import { UtensilsCrossed, ExternalLink, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface RestaurantData {
  name: string;
}

export default function RestaurantMenuPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = use(params);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Check for active order in local storage
    const lastId = localStorage.getItem('last_order_id');
    if (lastId) {
      setTimeout(() => setActiveOrderId(lastId), 0);
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch Restaurant Info directly by ID
        const rDocRef = doc(db, 'restaurants', restaurantId);
        const rDoc = await getDoc(rDocRef);
        
        if (!rDoc.exists()) {
          setError("Restaurant not found. Please check the link or scan the QR code again.");
          setIsLoading(false);
          return;
        }

        const rData = rDoc.data();
        setRestaurant({ name: rData.name });

        // 2. Fetch Menu Items for this specific restaurant
        const q = query(
          collection(db, 'menus'),
          where('restaurantId', '==', restaurantId)
        );
        const querySnapshot = await getDocs(q);
        
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MenuItemType[];
        setMenuItems(items);
      } catch (error) {
        console.error("Critical: Data fetch failed:", error);
        setError("Failed to load menu. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 p-6 rounded-full mb-6">
          <AlertTriangle size={48} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-primary-text mb-2">Access Denied</h1>
        <p className="text-secondary-text max-w-xs">{error}</p>
        <Link href="/" className="mt-8 text-accent font-bold hover:underline">Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary-text">
      <header className="relative w-full h-36 sm:h-48 bg-background overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/15 blur-[100px] rounded-full" />
          <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
        </div>
        
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 pb-4 sm:pb-6">
          <div className="flex items-end justify-between max-w-4xl mx-auto w-full">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-1">
                <Image src="/logo.png" alt="Tablio Logo" width={48} height={48} className="h-8 sm:h-10 w-auto object-contain" />
                <h1 className="text-2xl sm:text-4xl font-black text-primary-text tracking-tight leading-none">
                  {restaurant?.name || 'Tablio Kitchen'}
                </h1>
              </div>
              <p className="text-secondary-text text-xs sm:text-sm font-medium ml-1">Elevated dining, ordered instantly.</p>
            </div>
            
            {activeOrderId && (
              <Link 
                href={`/customer/track/${activeOrderId}`}
                className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-primary-text rounded-2xl text-sm font-bold shadow-xl active:scale-95 transition-all"
              >
                <ExternalLink size={16} />
                <span className="hidden sm:inline">Track Order</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="w-full mx-auto pb-8">
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

      <Cart restaurantIdOverride={restaurantId} />
    </div>
  );
}
