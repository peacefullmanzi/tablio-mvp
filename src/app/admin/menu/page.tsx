'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MenuItem } from '@/types/menu';
import MenuItemModal from '../components/MenuItemModal';
import { Utensils, Plus, Edit2, Trash2, ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

export default function MenuManagementPage() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    // Auth Guard
    if (localStorage.getItem('tablio_admin_auth') !== 'true') {
      router.push('/admin/login');
      return;
    }

    const q = query(collection(db, 'menus'));
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
    try {
      await deleteDoc(doc(db, 'menus', id));
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Delete failed.");
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
      <header className="bg-card border-b border-white/5 py-6 mb-8 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-secondary-text transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <Utensils className="text-accent" size={28} />
              <h1 className="text-2xl font-bold text-primary-text tracking-tight">Menu Manager</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                localStorage.removeItem('tablio_admin_auth');
                router.push('/admin/login');
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-secondary-text transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-lg text-sm font-bold hover:bg-emerald-400 transition-colors"
            >
              <Plus size={18} />
              Add Item
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
                  <div className="h-40 overflow-hidden bg-white/5">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
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
