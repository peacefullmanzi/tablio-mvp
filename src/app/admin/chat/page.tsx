'use client';

import { useEffect, useState, use } from 'react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MessageCircle, Send, User, ChevronRight, Menu } from 'lucide-react';
import { useSidebar } from '../components/AdminGuard';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { adminFetch } from '@/lib/api-client';
import { useStore } from '@/lib/store';

interface Message {
  id: string;
  message: string;
  sender: 'customer' | 'admin';
  tableNumber: string;
  restaurantId: string;
  createdAt: unknown;
  roomId: string;
  orderId: string;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const ridParam = searchParams.get('rid');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrderIds, setActiveOrderIds] = useState<Set<string>>(new Set());

  const { setHasNewMessages } = useStore();
  
  const getRestaurantId = () => ridParam || localStorage.getItem('tablio_rid') || process.env.NEXT_PUBLIC_RESTAURANT_ID;

  // Clear notifications on mount
  useEffect(() => {
    setHasNewMessages(false);
  }, [setHasNewMessages]);

  // Listen for messages
  useEffect(() => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    const q = query(
      collection(db, 'messages'),
      where('restaurantId', '==', restaurantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      msgs.sort((a, b) => {
        const timeA = (a.createdAt as any)?.seconds || 0;
        const timeB = (b.createdAt as any)?.seconds || 0;
        return timeA - timeB;
      });

      setMessages(msgs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [ridParam]);

  // Listen for active orders to filter chat
  useEffect(() => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeIds = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status !== 'completed') {
          activeIds.add(doc.id);
        }
      });
      setActiveOrderIds(activeIds);
    });

    return () => unsubscribe();
  }, [ridParam]);

  // Group unique rooms and filter out completed ones
  const rooms = Array.from(new Set(messages.map(m => m.roomId))).map(roomId => {
    const firstMsg = messages.find(m => m.roomId === roomId);
    return {
      roomId,
      tableNumber: firstMsg?.tableNumber || '?',
      orderId: firstMsg?.orderId || '?'
    };
  })
  .filter(room => {
    return !room.orderId || room.orderId === 'PRE-ORDER' || activeOrderIds.has(room.orderId);
  })
  .sort((a, b) => a.tableNumber.localeCompare(b.tableNumber));

  const selectedRoom = rooms.find(r => r.roomId === selectedRoomId);
  const filteredMessages = selectedRoomId 
    ? messages.filter(m => m.roomId === selectedRoomId)
    : [];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;

    const restaurantId = getRestaurantId();
    try {
      await adminFetch('/api/admin/chat', {
        method: 'POST',
        body: JSON.stringify({
          restaurantId,
          tableNumber: selectedRoom.tableNumber,
          orderId: selectedRoom.orderId,
          message: inputText
        })
      });
      setInputText('');
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send reply. Please try again.");
    }
  };

  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <div className="flex-1 flex flex-col h-screen bg-background overflow-hidden">
      <header className="bg-background/80 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 -ml-2 lg:hidden text-primary-text hover:bg-white/5 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-2xl font-black text-primary-text tracking-tight flex items-center gap-3">
            Support Center
            {rooms.length > 0 && (
              <span className="bg-accent/10 text-accent text-[10px] px-2 py-0.5 rounded-full border border-accent/20">
                {rooms.length} Active Sessions
              </span>
            )}
          </h1>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Room List - Hidden on mobile when a room is selected */}
        <div className={`
          ${selectedRoomId ? 'hidden lg:flex' : 'flex w-full lg:w-64'} 
          border-r border-white/5 flex-col shrink-0 bg-card/30
        `}>
          <div className="p-4 border-b border-white/5 text-xs font-black text-secondary-text/50 uppercase tracking-widest">
            Active Chats
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {rooms.length === 0 ? (
              <div className="p-8 text-center text-secondary-text text-sm italic">
                No active messages
              </div>
            ) : (
              rooms.map(room => (
                <button
                  key={room.roomId}
                  onClick={() => setSelectedRoomId(room.roomId)}
                  className={`w-full flex flex-col p-4 rounded-xl transition-all text-left ${
                    selectedRoomId === room.roomId 
                      ? 'bg-accent text-background shadow-lg shadow-accent/20' 
                      : 'text-secondary-text hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span className="font-bold">Table {room.tableNumber}</span>
                    </div>
                    <ChevronRight size={14} className={selectedRoomId === room.roomId ? 'opacity-100' : 'opacity-30'} />
                  </div>
                  <div className={`text-[9px] font-mono opacity-60 truncate ${selectedRoomId === room.roomId ? 'text-background' : 'text-secondary-text'}`}>
                    Order: {room.orderId.slice(-8).toUpperCase()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window - Hidden on mobile when NO room is selected */}
        <div className={`
          ${!selectedRoomId ? 'hidden lg:flex' : 'flex w-full'} 
          flex-1 flex flex-col bg-background/50 relative
        `}>
          {!selectedRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center text-secondary-text p-12 text-center">
              <div className="bg-white/5 p-6 rounded-full mb-6">
                <MessageCircle size={48} className="opacity-20" />
              </div>
              <h2 className="text-xl font-bold text-primary-text mb-2">Select a session to start chatting</h2>
              <p className="max-w-xs text-sm">Customer messages will appear here grouped by their specific order session.</p>
            </div>
          ) : (
            <>
              {/* Mobile Back Header */}
              <div className="lg:hidden p-4 border-b border-white/5 flex items-center gap-3 bg-card/50">
                <button 
                  onClick={() => setSelectedRoomId(null)}
                  className="p-2 -ml-2 text-accent hover:bg-accent/10 rounded-lg flex items-center gap-1 text-sm font-bold"
                >
                  <ChevronRight size={20} className="rotate-180" />
                  All Tables
                </button>
                <div className="h-4 w-px bg-white/10 mx-2" />
                <span className="text-sm font-black text-primary-text">Table {selectedRoom.tableNumber}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 flex flex-col">
                {filteredMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                      msg.sender === 'admin' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-card border border-white/5 text-primary-text rounded-tl-none'
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-secondary-text mt-1 px-1">
                      {msg.sender === 'admin' ? 'Support' : `Table ${msg.tableNumber}`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-card/50 border-t border-white/5">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Reply to Table ${selectedRoom.tableNumber}...`}
                    className="flex-1 bg-background border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-accent outline-none transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="bg-accent text-background px-8 rounded-2xl font-black hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-accent/20 disabled:opacity-30"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminChatPage() {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}
