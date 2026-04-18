'use client';

import { useState } from 'react';
import { X, Shield, Check, AlertCircle, Loader2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        body: JSON.stringify({ currentPin, newPin })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        localStorage.setItem('tablio_admin_auth', newPin);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Shield className="text-accent" size={20} />
            </div>
            <h2 className="text-xl font-bold text-primary-text">Admin Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-secondary-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  <label className="block text-sm font-medium text-secondary-text mb-1.5">Current PIN</label>
                  <input
                    type="password"
                    maxLength={10}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-mono tracking-[1em] focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                    placeholder="****"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1.5">New PIN</label>
                    <input
                      type="password"
                      maxLength={10}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                      placeholder="******"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1.5">Confirm New PIN</label>
                    <input
                      type="password"
                      maxLength={10}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                      placeholder="******"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-in shake duration-300">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-primary-text rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 px-4 py-3 bg-accent hover:bg-emerald-400 text-background rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Updating...
                    </>
                  ) : (
                    'Update PIN'
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
