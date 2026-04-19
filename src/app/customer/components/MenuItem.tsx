'use client';

import { MenuItem as MenuItemType } from '@/types/menu';
import { useStore } from '@/lib/store';
import { Plus, UtensilsCrossed } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

interface MenuItemProps {
  item: MenuItemType;
}

export default function MenuItem({ item }: MenuItemProps) {
  const addToCart = useStore((state) => state.addToCart);

  return (
    <div className="group bg-card/30 border border-white/5 rounded-2xl p-3 flex flex-col active:bg-white/5 transition-all h-full">
      {item.image ? (
        <div className="w-full h-28 sm:h-36 rounded-xl relative overflow-hidden bg-white/5 shrink-0 mb-3">
          <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
        </div>
      ) : (
        <div className="w-full h-28 sm:h-36 rounded-xl relative bg-linear-to-br from-white/5 to-transparent flex items-center justify-center shrink-0 mb-3">
          <UtensilsCrossed size={24} className="text-secondary-text/20" />
        </div>
      )}
      
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-primary-text leading-tight mb-1 line-clamp-2">{item.name}</h3>
          <p className="text-sm sm:text-base font-black text-accent">{formatPrice(item.price)}</p>
        </div>
        
        <div className="flex justify-end mt-2">
          <button 
            onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, quantity: 1 })}
            className="bg-white/10 hover:bg-accent hover:text-background text-primary-text w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md border border-white/5"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
