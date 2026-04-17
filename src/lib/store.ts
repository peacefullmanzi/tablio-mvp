import { create } from 'zustand';
import { CartItem } from '../types/order';

interface CartState {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useStore = create<CartState>((set, get) => ({
  items: [],
  addToCart: (item) => set((state) => {
    const existingItem = state.items.find(i => i.id === item.id);
    if (existingItem) {
      return {
        items: state.items.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      };
    }
    return { items: [...state.items, { ...item, quantity: 1 }] };
  }),
  removeFromCart: (itemId) => set((state) => {
    const existingItem = state.items.find(i => i.id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      return {
        items: state.items.map(i =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        )
      };
    }
    return {
      items: state.items.filter(i => i.id !== itemId)
    };
  }),
  clearCart: () => set({ items: [] }),
  getTotal: () => {
    const items = get().items;
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
}));
