'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { X, Save } from 'lucide-react';
import { MenuItem } from '@/types/menu';

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem?: MenuItem | null;
}

export default function MenuItemModal({ isOpen, onClose, onSuccess, editingItem }: MenuItemModalProps) {
  const [name, setName] = useState(editingItem?.name || '');
  const [price, setPrice] = useState(editingItem?.price.toString() || '');
  const [category, setCategory] = useState(editingItem?.category || '');
  const [image, setImage] = useState(editingItem?.image || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category) return;

    setIsSubmitting(true);
    try {
      const itemData = {
        name,
        price: parseFloat(price),
        category,
        image: image || null,
      };

      if (editingItem) {
        await updateDoc(doc(db, 'menus', editingItem.id), itemData);
      } else {
        await addDoc(collection(db, 'menus'), itemData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving menu item:", error);
      alert("Failed to save item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary-text">
            {editingItem ? 'Edit Menu Item' : 'Add New Item'}
          </h2>
          <button onClick={onClose} className="text-secondary-text hover:text-primary-text transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">Item Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Classic Burger"
              className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-primary-text focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-primary-text focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Category</label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Food"
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-primary-text focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">Image URL (Optional)</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-primary-text focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent hover:bg-emerald-400 text-background font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
           <Save size={18} />
           {isSubmitting ? 'Saving...' : 'Save Item'}
          </button>
        </form>
      </div>
    </div>
  );
}
