'use client';

import { useState, useEffect } from 'react';
import { Shield, LayoutGrid, Trash2, ExternalLink, Activity, Users, Plus, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';

interface Restaurant {
  id: string;
  name: string;
  createdAt: any;
  ownerEmail?: string;
}

export default function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterKey, setMasterKey] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = async (key: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/super-admin/restaurants', {
        headers: { 'x-super-admin-key': key }
      });
      const data = await response.json();
      
      if (response.ok) {
        setRestaurants(data.restaurants);
        setIsAuthenticated(true);
        localStorage.setItem('tablio_master_key', key);
      } else {
        setError(data.error || 'Invalid Master Key');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('tablio_master_key');
    if (savedKey) {
      setMasterKey(savedKey);
      fetchRestaurants(savedKey);
    }
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you absolutely sure? This will delete the restaurant and ALL its data permanently.')) return;
    
    try {
      const response = await fetch('/api/super-admin/restaurants', {
        method: 'DELETE',
        headers: { 
          'x-super-admin-key': masterKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });
      
      if (response.ok) {
        setRestaurants(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="inline-flex p-4 bg-accent/10 rounded-3xl mb-4 border border-accent/20">
            <Shield size={48} className="text-accent" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Command Center</h1>
          <p className="text-zinc-500 text-sm">Enter Master Key to access platform control</p>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              fetchRestaurants(masterKey);
            }}
            className="space-y-4"
          >
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="password"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="Enter Master Key"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-12 py-4 text-white focus:border-accent outline-none transition-all"
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'INITIALIZE SYSTEM'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-accent rounded-2xl text-black">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Platform Overview</h1>
            <p className="text-zinc-500 text-sm">Controlling {restaurants.length} active restaurants</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 flex items-center gap-4">
            <Activity className="text-accent" size={20} />
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Status</p>
              <p className="font-bold text-sm">Operational</p>
            </div>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('tablio_master_key');
              setIsAuthenticated(false);
            }}
            className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors"
          >
            <Lock size={20} className="text-zinc-500" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map(res => (
            <div key={res.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 group hover:border-accent/30 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-1 truncate max-w-[200px]">{res.name}</h3>
                  <p className="text-xs font-mono text-zinc-500">{res.id}</p>
                </div>
                <div className="flex gap-2">
                  <Link 
                    href={`/r/${res.id}`} 
                    target="_blank"
                    className="p-2 bg-black rounded-xl text-zinc-500 hover:text-white transition-colors"
                  >
                    <ExternalLink size={18} />
                  </Link>
                  <button 
                    onClick={() => handleDelete(res.id)}
                    className="p-2 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Created At</p>
                  <p className="text-xs font-bold truncate">
                    {res.createdAt?.toDate ? new Date(res.createdAt.toDate()).toLocaleDateString() : 'Initial'}
                  </p>
                </div>
                <Link 
                  href={`/admin/login?rid=${res.id}`}
                  className="bg-accent/5 border border-accent/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-accent/10 transition-all"
                >
                  <p className="text-[9px] font-black text-accent uppercase tracking-widest">Dashboard</p>
                  <span className="text-[10px] font-bold">Login Link</span>
                </Link>
              </div>
            </div>
          ))}

          {/* Add New Quick Link */}
          <Link 
            href="/onboarding"
            className="border-2 border-dashed border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-zinc-600 hover:border-accent hover:text-accent transition-all group"
          >
            <div className="p-4 bg-zinc-900 rounded-full group-hover:scale-110 transition-all">
              <Plus size={32} />
            </div>
            <span className="font-black uppercase tracking-widest text-sm">Register New Restaurant</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
