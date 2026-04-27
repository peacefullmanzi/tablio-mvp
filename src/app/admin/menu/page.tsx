'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MenuItem } from '@/types/menu';
import MenuItemModal from '../components/MenuItemModal';
import { Utensils, Plus, Edit2, Trash2, Search, Filter, LayoutDashboard, Menu } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { MenuItemSkeleton } from '../components/Skeleton';
import { useSidebar } from '../components/AdminGuard';

import { useSearchParams } from 'next/navigation';
import { adminFetch } from '@/lib/api-client';

import { Suspense } from 'react';

function MenuContent() {
  const searchParams = useSearchParams();
  const ridParam = searchParams.get('rid');
  
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [restaurantName, setRestaurantName] = useState('Admin');
  const [role, setRole] = useState<'manager' | 'staff'>('manager');

  // Unified restaurantId logic
  const getRestaurantId = () => {
    return ridParam || localStorage.getItem('tablio_rid') || process.env.NEXT_PUBLIC_RESTAURANT_ID;
  };

  useEffect(() => {
    const rid = getRestaurantId();
    if (rid && rid !== localStorage.getItem('tablio_rid')) {
      localStorage.setItem('tablio_rid', rid);
    }
  }, [ridParam]);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await adminFetch('/api/admin/restaurant-info');
        const data = await response.json();
        if (data.success) {
          setRestaurantName(data.name);
          setRole(data.role);
        }
      } catch (err) {
        console.error("Error fetching info:", err);
      }
    };
    fetchInfo();
  }, []);

  useEffect(() => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) {
      console.error('[MenuManagement] No restaurantId found.');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'menus'),
      where('restaurantId', '==', restaurantId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
      setItems(fetchedItems);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [ridParam]);

  const categories = ['All', ...Array.from(new Set(items.map(item => item.category || 'Other'))).sort()];

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (item.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const restaurantId = getRestaurantId();
    if (!restaurantId) {
      alert('Configuration error: restaurantId not set.');
      return;
    }
    try {
      const response = await adminFetch(`/api/admin/menu/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ restaurantId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }
    } catch (error: unknown) {
      console.error("Error deleting item:", error);
      const errorMessage = error instanceof Error ? error.message : "Delete failed.";
      alert(errorMessage);
    }
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      <header className="bg-background/80 backdrop-blur-xl border-b border-white/5 pt-6 pb-6 sticky top-0 z-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 min-w-0">
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 -ml-2 lg:hidden text-primary-text hover:bg-white/5 rounded-lg shrink-0"
              >
                <Menu size={24} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl lg:text-2xl font-black text-primary-text tracking-tight truncate">
                    {restaurantName}
                  </h1>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${
                    role === 'manager' 
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                  }`}>
                    {role === 'manager' ? 'Manager' : 'Staff Mode'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-secondary-text text-xs font-bold uppercase tracking-wider opacity-60">Menu Manager</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-accent text-xs font-bold">{filteredItems.length} Items</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" size={16} />
                <input 
                  type="text" 
                  placeholder="Search dishes..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-accent outline-none transition-all"
                />
              </div>

              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2 bg-accent text-background rounded-xl text-sm font-black hover:bg-emerald-400 transition-all shadow-lg shadow-accent/20 active:scale-95"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Dish</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            <Filter size={14} className="text-secondary-text mr-2 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  activeCategory === cat 
                    ? 'bg-accent/10 border-accent text-accent' 
                    : 'bg-white/5 border-white/10 text-secondary-text hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-24">
        <div className="container mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <MenuItemSkeleton key={i} />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-white/5">
              <Utensils size={48} className="mx-auto text-secondary-text/20 mb-4" />
              <p className="text-secondary-text">No items found matching your filters.</p>
              {(searchQuery || activeCategory !== 'All') && (
                <button 
                  onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                  className="mt-4 text-accent hover:underline text-sm font-bold"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-card border border-white/5 rounded-2xl overflow-hidden group hover:border-accent/30 transition-all hover:shadow-2xl hover:shadow-accent/5">
                  {item.image && (
                    <div className="h-44 overflow-hidden bg-white/5 relative">
                      <Image 
                        src={item.image} 
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] text-white px-2 py-1 bg-black/50 backdrop-blur-md rounded-full uppercase tracking-widest font-black border border-white/10">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-primary-text leading-tight group-hover:text-accent transition-colors">{item.name}</h3>
                      <span className="text-accent font-black">{formatPrice(item.price)}</span>
                    </div>
                    <p className="text-secondary-text text-xs line-clamp-2 mb-4 h-8">{item.description}</p>
                    
                    <div className="flex gap-2 pt-4 border-t border-white/5">
                      <button 
                        onClick={() => openEdit(item)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-secondary-text rounded-xl text-xs font-bold transition-all"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <MenuItemModal 
        key={editingItem?.id || 'new'}
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {}} 
        editingItem={editingItem}
        existingItems={items}
      />
    </div>
  );
}

export default function MenuManagementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Utensils className="animate-spin text-accent" size={48} />
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
