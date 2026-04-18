'use client';

import { MenuItem as MenuItemType } from '@/types/menu';
import MenuItemCard from './MenuItem';
import { useState, useEffect } from 'react';

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
  const [activeCategory, setActiveCategory] = useState(categories[0] || '');

  // Update active category based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // offset for sticky header
      
      for (const category of categories) {
        const element = document.getElementById(`category-${category}`);
        if (element) {
          const { top, bottom } = element.getBoundingClientRect();
          const elementTop = top + window.scrollY;
          const elementBottom = bottom + window.scrollY;
          
          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            setActiveCategory(category);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  return (
    <div className="w-full pb-32">
      {/* Sticky Category Nav */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 py-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-3 max-w-4xl mx-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  const el = document.getElementById(`category-${category}`);
                  if (el) {
                    const y = el.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-black transition-all active:scale-95 ${
                  activeCategory === category 
                    ? 'bg-accent text-background shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : 'bg-white/5 text-secondary-text hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-12 px-4 pt-8">
      {categories.map((category) => (
        <div key={category} id={`category-${category}`} className="scroll-mt-32">
          <h2 className="text-2xl font-black text-primary-text mb-6 tracking-tight">
            {category}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
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
    </div>
  );
}
