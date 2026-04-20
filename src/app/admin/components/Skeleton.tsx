'use client';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-6 border border-white/5 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="pt-4 flex justify-between items-center">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-4 border border-white/5 flex gap-4">
      <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}
