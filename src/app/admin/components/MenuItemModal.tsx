'use client';

import { useState, useEffect } from 'react';
import { X, Save, Plus, Loader2 } from 'lucide-react';
import { MenuItem } from '@/types/menu';
import { adminFetch } from '@/lib/api-client';

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem?: MenuItem | null;
  existingItems?: MenuItem[];
}

export default function MenuItemModal({ isOpen, onClose, onSuccess, editingItem, existingItems = [] }: MenuItemModalProps) {
  const [name, setName] = useState(editingItem?.name || '');
  const [price, setPrice] = useState(editingItem?.price.toString() || '');
  const [category, setCategory] = useState(editingItem?.category || '');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [image, setImage] = useState(editingItem?.image || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const getRestaurantId = () => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('rid') || localStorage.getItem('tablio_rid') || process.env.NEXT_PUBLIC_RESTAURANT_ID || '';
  };

  const restaurantId = getRestaurantId();

  useEffect(() => {
    if (isOpen && restaurantId) {
      fetchCategories();
    }
  }, [isOpen, restaurantId]);

  const fetchCategories = async () => {
    setIsFetchingCategories(true);
    try {
      const response = await adminFetch(`/api/categories/get`);
      const data = await response.json();
      if (data.success) {
        // Merge API categories with existing item categories for complete list
        const apiCategories = data.categories.map((c: any) => c.name);
        const itemCategories = existingItems.map(item => item.category).filter(Boolean);
        const allUnique = Array.from(new Set([...apiCategories, ...itemCategories]))
          .filter(name => name !== 'ADD_NEW')
          .map(name => ({ id: name, name }));
          
        setCategories(allUnique as {id: string, name: string}[]);
        
        if (allUnique.length === 0 && !editingItem) {
          setShowNewCategoryInput(true);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsFetchingCategories(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);
    try {
      const response = await adminFetch('/api/categories/create', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName })
      });
      const data = await response.json();
      if (data.success) {
        await fetchCategories();
        setCategory(data.name);
        setShowNewCategoryInput(false);
        setNewCategoryName('');
      } else {
        alert(data.error || "Failed to create category");
      }
    } catch (error) {
      alert("Error creating category");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category) return;

    if (!restaurantId) {
      alert('Configuration error: restaurantId not set. Cannot save item.');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemData = {
        name,
        price: parseFloat(price),
        category,
        image: image || null,
      };

      const response = await adminFetch('/api/admin/menu', {
        method: 'POST',
        body: JSON.stringify({ item: itemData, id: editingItem?.id, restaurantId })
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
              {showNewCategoryInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="flex-1 bg-background border border-white/10 rounded-lg px-4 py-2.5 text-primary-text focus:outline-none focus:border-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={isCreatingCategory}
                    className="p-2.5 bg-accent text-background rounded-lg hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {isCreatingCategory ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryInput(false)}
                    className="p-2.5 bg-white/5 text-secondary-text rounded-lg hover:bg-white/10"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === 'ADD_NEW') {
                      setShowNewCategoryInput(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-primary-text focus:outline-none focus:border-accent transition-colors appearance-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                  <option value="ADD_NEW" className="text-accent font-bold text-lg">+ Add new category</option>
                </select>
              )}
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

                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/10 rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer bg-white/2">
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
