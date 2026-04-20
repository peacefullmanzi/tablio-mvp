'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Shield, Check, AlertCircle, Loader2, QrCode, Download, Printer } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'security' | 'qrcode'>('security');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [restaurantName, setRestaurantName] = useState('My Restaurant');
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getRestaurantId = () => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('rid') || localStorage.getItem('tablio_rid') || '';
  };

  const restaurantId = getRestaurantId();

  useEffect(() => {
    if (isOpen && restaurantId) {
      const fetchName = async () => {
        try {
          const docRef = doc(db, 'restaurants', restaurantId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setRestaurantName(snap.data().name);
          }
        } catch (err) {
          console.error("Failed to fetch restaurant name:", err);
        }
      };
      fetchName();
    }
  }, [isOpen, restaurantId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPin.length < 6 || !/^\d+$/.test(newPin)) {
      setError('New PIN must be at least 6 digits and numeric');
      return;
    }

    if (newPin !== confirmPin) {
      setError('New PINs do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/settings/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin, restaurantId })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        localStorage.setItem(`tablio_admin_auth_${restaurantId}`, newPin);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setCurrentPin('');
          setNewPin('');
          setConfirmPin('');
        }, 2000);
      } else {
        setError(data.error || 'Failed to update PIN');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadQR = () => {
    if (!canvasRef.current || !restaurantId) return;
    setIsDownloading(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Card Dimensions (Standard A6-ish aspect ratio or square card)
    const width = 1200;
    const height = 1600;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Restaurant Name
    ctx.fillStyle = '#000000';
    ctx.font = '900 80px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(restaurantName.toUpperCase(), width / 2, 200);

    // Subtle Subtitle
    ctx.font = '500 40px Inter, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('SCAN TO VIEW MENU', width / 2, 280);

    // Draw QR Code
    const qrSize = 800;
    const qrX = (width - qrSize) / 2;
    const qrY = 400;

    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    const menuUrl = `${window.location.origin}/r/${restaurantId}`;
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(menuUrl)}&margin=10`;

    qrImg.onload = () => {
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Footer branding
      ctx.textAlign = 'right';
      ctx.font = 'italic 700 40px Inter, sans-serif';
      ctx.fillStyle = '#10B981'; // Tablio Accent
      ctx.fillText('tablio', width - 80, height - 80);
      
      ctx.fillStyle = '#999999';
      ctx.font = '500 30px Inter, sans-serif';
      ctx.fillText('DIGITAL MENU SYSTEM', width - 80, height - 130);

      // Final step: Download
      const link = document.createElement('a');
      link.download = `${restaurantName.toLowerCase().replace(/\s+/g, '-')}-qr-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setIsDownloading(false);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-card border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold text-primary-text">Settings</h2>
            <div className="flex bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'security' ? 'bg-accent text-background shadow-lg' : 'text-secondary-text hover:text-white'
                }`}
              >
                <Shield size={16} /> Security
              </button>
              <button
                onClick={() => setActiveTab('qrcode')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'qrcode' ? 'bg-accent text-background shadow-lg' : 'text-secondary-text hover:text-white'
                }`}
              >
                <QrCode size={16} /> QR Card
              </button>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-secondary-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'security' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {success ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-90 duration-300">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                    <Check className="text-accent" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-primary-text">PIN Updated!</h3>
                  <p className="text-secondary-text mt-2">Your security PIN has been changed successfully.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-secondary-text uppercase tracking-widest mb-2 ml-1">Current PIN</label>
                      <input
                        type="password"
                        maxLength={10}
                        value={currentPin}
                        onChange={(e) => setCurrentPin(e.target.value)}
                        className="w-full bg-background border-2 border-white/5 rounded-2xl px-6 py-4 text-xl font-mono tracking-[1em] focus:border-accent outline-none transition-all"
                        placeholder="****"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-secondary-text uppercase tracking-widest mb-2 ml-1">New PIN</label>
                        <input
                          type="password"
                          maxLength={10}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value)}
                          className="w-full bg-background border-2 border-white/5 rounded-2xl px-6 py-4 text-xl font-mono tracking-[0.5em] focus:border-accent outline-none transition-all"
                          placeholder="******"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-secondary-text uppercase tracking-widest mb-2 ml-1">Confirm PIN</label>
                        <input
                          type="password"
                          maxLength={10}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value)}
                          className="w-full bg-background border-2 border-white/5 rounded-2xl px-6 py-4 text-xl font-mono tracking-[0.5em] focus:border-accent outline-none transition-all"
                          placeholder="******"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-in shake duration-300">
                      <AlertCircle size={18} />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-primary-text rounded-2xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] px-6 py-4 bg-accent hover:scale-[1.02] active:scale-95 text-background rounded-2xl font-black text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-accent/20"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'UPDATE PIN'}
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-primary-text tracking-tight uppercase">{restaurantName}</h3>
                    <p className="text-secondary-text leading-relaxed">
                      This QR code card is designed to be placed on your tables. 
                      Customers can scan it to view your menu and place orders instantly.
                    </p>
                  </div>
                  
                  <div className="space-y-3 pt-4">
                    <button
                      onClick={handleDownloadQR}
                      disabled={isDownloading}
                      className="w-full bg-accent text-background font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20 disabled:opacity-50"
                    >
                      {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                      DOWNLOAD AS IMAGE
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="w-full bg-white/5 hover:bg-white/10 text-primary-text font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
                    >
                      <Printer size={20} /> PRINT CARD
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  {/* Preview Card */}
                  <div className="w-full max-w-[280px] aspect-[3/4] bg-white rounded-3xl p-8 flex flex-col items-center justify-between shadow-2xl ring-1 ring-black/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="text-center z-10">
                      <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-1">Welcome to</p>
                      <h4 className="text-xl font-black text-black uppercase tracking-tight leading-tight">{restaurantName}</h4>
                    </div>

                    <div className="w-full aspect-square bg-black/5 rounded-2xl flex items-center justify-center p-2 z-10">
                      {/* Placeholder QR using the same API for preview */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/r/${restaurantId}`)}`}
                        alt="QR Code Preview"
                        className="w-full h-full"
                      />
                    </div>

                    <div className="w-full flex flex-col items-end z-10">
                      <p className="text-[8px] font-bold text-black/30 uppercase tracking-tighter leading-none mb-1">Digital Menu by</p>
                      <p className="text-lg font-black text-accent italic leading-none">tablio</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden canvas for generation */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
