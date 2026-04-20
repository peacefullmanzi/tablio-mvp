'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MenuItem } from '@/types/menu';
import MenuItemModal from '../components/MenuItemModal';
import { Utensils, Plus, Edit2, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function MenuContent() {
  const searchParams = useSearchParams();
  const ridParam = searchParams.get('rid');
  
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

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
    const restaurantId = getRestaurantId();
    if (!restaurantId) {
      console.error('[MenuManagement] No restaurantId found.');
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
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const restaurantId = getRestaurantId();
    if (!restaurantId) {
      alert('Configuration error: restaurantId not set.');
      return;
    }
    try {
      const pin = localStorage.getItem('tablio_admin_auth');
      const response = await fetch(`/api/admin/menu/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, restaurantId })
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

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-background/80 backdrop-blur-xl border-b border-white/10 py-6 mb-8 sticky top-0 z-10">
        <div className="container mx-auto px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-primary-text tracking-tight">Menu Manager</h1>
            <p className="text-secondary-text text-sm mt-1">Manage your restaurant offerings</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-6 py-3 bg-accent text-background rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-accent/20 active:scale-95"
            >
              <Plus size={18} />
              Add New Item
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-white/5">
            <Utensils size={48} className="mx-auto text-secondary-text/20 mb-4" />
            <p className="text-secondary-text">No items in the menu yet.</p>
            <button onClick={openAdd} className="mt-4 text-accent hover:underline">Add your first item</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-card border border-white/5 rounded-xl overflow-hidden group hover:border-accent/30 transition-colors">
                {item.image && (
                  <div className="h-40 overflow-hidden bg-white/5 relative">
                    <Image 
                      src={item.image} 
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-primary-text">{item.name}</h3>
                      <span className="text-xs text-secondary-text px-2 py-0.5 bg-white/5 rounded-full border border-white/10 uppercase tracking-wider font-semibold">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-accent">{formatPrice(item.price)}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-6">
                    <button 
                      onClick={() => openEdit(item)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-primary-text rounded-lg text-sm font-medium transition-colors"
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <MenuItemModal 
        key={editingItem?.id || 'new'}
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {}} 
        editingItem={editingItem}
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
