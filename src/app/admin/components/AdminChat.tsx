'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, Send, MessageCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

interface AdminChatProps {
  orderId: string;
  tableNumber: string;
  isOpen: boolean;
  onClose: () => void;
  orderStatus: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'admin';
  timestamp: unknown;
}

export default function AdminChat({ orderId, tableNumber, isOpen, onClose, orderStatus }: AdminChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    const q = query(
      collection(db, 'orders', orderId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [isOpen, orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      const getRestaurantId = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('rid') || localStorage.getItem('tablio_rid') || '';
      };
      
      const restaurantId = getRestaurantId();
      const authKey = `tablio_admin_auth_${restaurantId}`;
      const pin = localStorage.getItem(authKey) || localStorage.getItem('tablio_admin_auth');

      const response = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          text: inputText,
          restaurantId,
          pin
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setInputText('');
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const chatUI = (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="w-full max-w-md bg-card h-[80vh] max-h-[600px] relative flex flex-col border border-white/10 shadow-2xl rounded-3xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 p-2 rounded-lg">
              <MessageCircle size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-primary-text">Table {tableNumber} Chat</h3>
              <p className="text-[10px] text-secondary-text uppercase tracking-widest">Order ID: {orderId.slice(0, 8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-secondary-text hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <p className="text-secondary-text text-sm">No messages yet. Customer hasn&apos;t asked for help.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.sender === 'admin' 
                    ? 'bg-blue-600 text-white rounded-tr-none font-medium' 
                    : 'bg-white/10 text-primary-text rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-background/50">
          {orderStatus === 'completed' ? (
            <p className="text-center text-secondary-text text-xs py-2 italic">
              Order delivered. Chat history is now read-only.
            </p>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input 
                autoFocus
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Reply to customer..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none transition-all"
              />
              <button 
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="bg-accent text-background p-3 rounded-xl disabled:opacity-50 transition-all active:scale-95"
              >
                <Send size={20} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(chatUI, document.body);
  }
  return null;
}
