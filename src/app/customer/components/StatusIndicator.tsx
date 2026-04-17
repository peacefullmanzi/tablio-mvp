'use client';

import { OrderStatus } from '@/types/order';
import { Clock, CheckCircle, ChefHat, CheckSquare, LucideIcon } from 'lucide-react';

interface StatusIndicatorProps {
  status: OrderStatus;
}

const statusSteps: { key: OrderStatus; label: string; icon: LucideIcon }[] = [
  { key: 'pending', label: 'Waiting for restaurant', icon: Clock },
  { key: 'accepted', label: 'Order confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Being prepared', icon: ChefHat },
  { key: 'ready', label: 'Ready for pickup', icon: CheckSquare },
  { key: 'completed', label: 'Delivered', icon: CheckCircle },
];

export default function StatusIndicator({ status }: StatusIndicatorProps) {
  const currentIndex = statusSteps.findIndex(step => step.key === status);

  return (
    <div className="w-full py-8">
      <div className="relative flex justify-between">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-white/5 -z-10" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-accent transition-all duration-500 -z-10" 
          style={{ width: `${(currentIndex / (statusSteps.length - 1)) * 100}%` }}
        />

        {statusSteps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center gap-3">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  isActive 
                    ? 'bg-accent border-accent text-background shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                    : 'bg-card border-white/10 text-secondary-text'
                } ${isCurrent ? 'scale-110' : 'scale-100'}`}
              >
                <Icon size={20} />
              </div>
              <span className={`text-[10px] md:text-xs font-medium text-center max-w-[80px] transition-colors ${
                isActive ? 'text-primary-text' : 'text-secondary-text'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
