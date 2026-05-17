'use client';

import { Order } from '@/types/order';
import OrderCard from './OrderCard';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderListProps {
  orders: Order[];
  onMessageCountChange?: (orderId: string, count: number) => void;
}

export default function OrderList({ orders, onMessageCountChange }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-card rounded-xl border border-white/5"
      >
        <p className="text-secondary-text">No active orders found.</p>
      </motion.div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  } as const;

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  } as const;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
    >
      <AnimatePresence mode='popLayout'>
        {orders.map((order) => (
          <motion.div 
            key={order.id} 
            variants={item}
            layout
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <OrderCard order={order} onMessageCountChange={onMessageCountChange} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
