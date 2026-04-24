'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, Send, MessageCircle } from 'lucide-react';

interface GlobalChatProps {
  restaurantId: string;
  tableNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  message: string;
  sender: 'customer' | 'admin';
  createdAt: unknown;
  roomId: string;
}

export default function GlobalChat({ restaurantId, tableNumber, isOpen, onClose }: GlobalChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !restaurantId || !tableNumber) return;

    const roomId = `${restaurantId}_${tableNumber}`;
    const q = query(
      collection(db, 'messages'),
      where('roomId', '==', roomId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      // Sort client-side to avoid index requirements
      msgs.sort((a, b) => {
        const timeA = (a.createdAt as any)?.seconds || 0;
        const timeB = (b.createdAt as any)?.seconds || 0;
        return timeA - timeB;
      });

      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [isOpen, restaurantId, tableNumber]);

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
      await addDoc(collection(db, 'messages'), {
        restaurantId,
        tableNumber,
        roomId: `${restaurantId}_${tableNumber}`,
        message: inputText,
        sender: 'customer',
        createdAt: serverTimestamp()
      });
      setInputText('');
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="w-full max-w-md bg-card h-[80vh] sm:h-[600px] relative flex flex-col border-t sm:border border-white/10 shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 p-2 rounded-lg">
              <MessageCircle size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-primary-text">Staff Support</h3>
              <p className="text-[10px] text-secondary-text uppercase tracking-widest">Table {tableNumber}</p>
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
              <div className="bg-white/5 p-4 rounded-full mb-4">
                <MessageCircle size={32} className="text-secondary-text/30" />
              </div>
              <p className="text-secondary-text text-sm">Need assistance? Send a message to our staff!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.sender === 'customer' 
                    ? 'bg-accent text-background rounded-tr-none font-medium' 
                    : 'bg-white/10 text-primary-text rounded-tl-none'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-background/50">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
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
        </div>
      </div>
    </div>
  );
}
