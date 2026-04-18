'use client';

import { MenuItem as MenuItemType } from '@/types/menu';
import MenuItemCard from './MenuItem';

interface MenuListProps {
  items: MenuItemType[];
}

export default function MenuList({ items }: MenuListProps) {
  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItemType[]>);

  const categories = Object.keys(groupedItems).sort();

  return (
    <div className="space-y-10 pb-32">
      {categories.map((category) => (
        <div key={category}>
          <h2 className="text-2xl font-bold text-primary-text mb-6 px-1 border-b border-white/10 pb-2">
            {category}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {groupedItems[category].map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-center text-secondary-text py-10">
          No menu items available.
        </div>
      )}
    </div>
  );
}
