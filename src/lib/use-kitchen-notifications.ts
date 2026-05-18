'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, query, onSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UseKitchenNotificationsProps {
  restaurantId: string | null;
}

export function useKitchenNotifications({ restaurantId }: UseKitchenNotificationsProps) {
  const [hasNewOrder, setHasNewOrder] = useState(false);
  const prevOrderCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!restaurantId) return;

    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      where('status', '==', 'pending'),
      orderBy('created_at', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentCount = snapshot.size;
      const prevCount = prevOrderCountRef.current;

      if (currentCount > prevCount && prevCount > 0) {
        setHasNewOrder(true);
        playNotification();
        
        setTimeout(() => setHasNewOrder(false), 5000);
      }

      prevOrderCountRef.current = currentCount;
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const playNotification = () => {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('New order received');
        utterance.rate = 1.2;
        utterance.pitch = 1.1;
        utterance.volume = 1;
        speechSynthesis.speak(utterance);
      }

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch (error) {
      console.warn('[KitchenNotifications] Audio playback failed:', error);
    }
  };

  return { hasNewOrder };
}