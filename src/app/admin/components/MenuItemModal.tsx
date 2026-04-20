'use client';

import { useState } from 'react';
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

    const getRestaurantId = () => {
      const params = new URLSearchParams(window.location.search);
      return params.get('rid') || localStorage.getItem('tablio_rid') || process.env.NEXT_PUBLIC_RESTAURANT_ID;
    };

    const restaurantId = getRestaurantId();
    if (!restaurantId) {
      alert('Configuration error: restaurantId not set. Cannot save item.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authKey = `tablio_admin_auth_${restaurantId}`;
      const pin = localStorage.getItem(authKey) || localStorage.getItem('tablio_admin_auth');
      
      const itemData = {
        name,
        price: parseFloat(price),
        category,
        image: image || null,
      };

      const response = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: itemData, pin, id: editingItem?.id, restaurantId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save item');
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error("Error saving menu item:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save item.";
      alert(errorMessage);
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(90vh-140px)] overflow-y-auto no-scrollbar">
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

          <div className="space-y-4">
            <label className="block text-sm font-medium text-secondary-text">Item Image</label>
            
            <div className="flex flex-col gap-4">
              {/* Image Preview */}
              {(image || editingItem?.image) && (
                <div className="relative h-48 w-full rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
                  <img 
                    src={image || editingItem?.image || ''} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image';
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <div className="relative">
                  <input
                    type="url"
                    value={image.startsWith('data:') ? '' : image}
                    onChange={(e) => {
                      setImage(e.target.value);
                    }}
                    placeholder="Paste Image URL..."
                    className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] uppercase tracking-widest text-secondary-text/50 font-bold">OR</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/10 rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer bg-white/[0.02]">
                  <div className="flex flex-col items-center justify-center pt-2 pb-2 text-center px-4">
                    <Save size={24} className="text-accent mb-3" />
                    <p className="text-xs text-secondary-text font-medium">
                      <span className="font-bold text-accent">Select from computer</span>
                    </p>
                    <p className="text-[10px] text-secondary-text/40 mt-1 uppercase tracking-tighter">JPG, PNG, WEBP (MAX 4MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 4 * 1024 * 1024) {
                          alert("Image is too large! Please use an image smaller than 4MB.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setImage(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-white/5 bg-background/50">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-accent hover:bg-emerald-400 text-background font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-accent/20"
          >
           <Save size={18} />
           {isSubmitting ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
