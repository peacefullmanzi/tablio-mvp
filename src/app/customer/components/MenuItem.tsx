'use client';

import { MenuItem as MenuItemType } from '@/types/menu';
import { useStore } from '@/lib/store';
import { Plus } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface MenuItemProps {
  item: MenuItemType;
}

export default function MenuItem({ item }: MenuItemProps) {
  const addToCart = useStore((state) => state.addToCart);

  return (
    <div className="bg-card rounded-2xl p-4 flex flex-col justify-between border border-white/5 active:bg-white/5 transition-colors">
      <div className="flex gap-4">
        {item.image && (
          <div className="w-20 h-20 bg-white/5 rounded-xl overflow-hidden shrink-0">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 py-1">
          <h3 className="text-xl font-bold text-primary-text leading-tight mb-1">{item.name}</h3>
          <p className="text-lg font-bold text-accent">{formatPrice(item.price)}</p>
        </div>
      </div>
      
      <button 
        onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, quantity: 1 })}
        className="w-full bg-accent text-background font-black py-4 px-6 rounded-xl flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all shadow-lg"
      >
        <Plus size={24} strokeWidth={3} />
        ADD TO ORDER
      </button>
    </div>
  );
}
