'use client';

import { useState, useEffect } from 'react';
import { Shield, LayoutGrid, Trash2, ExternalLink, Activity, Users, Plus, Loader2, Lock, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Restaurant {
  id: string;
  name: string;
  createdAt: any;
  ownerEmail?: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  businessType: string;
  createdAt: string | null;
}

export default function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterKey, setMasterKey] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'restaurants' | 'leads'>('restaurants');

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

  const fetchLeads = async (key: string) => {
    setLeadsLoading(true);
    try {
      const response = await fetch('/api/super-admin/leads', {
        headers: { 'x-super-admin-key': key }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('tablio_master_key');
    if (savedKey) {
      setMasterKey(savedKey);
      fetchRestaurants(savedKey);
      fetchLeads(savedKey);
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

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this lead?')) return;
    
    try {
      const response = await fetch('/api/super-admin/leads', {
        method: 'DELETE',
        headers: { 
          'x-super-admin-key': masterKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });
      
      if (response.ok) {
        setLeads(prev => prev.filter(l => l.id !== id));
      } else {
        alert('Failed to delete lead');
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const businessLabel = (type: string) => {
    const map: Record<string, string> = { restaurant: 'Restaurant', hotel: 'Hotel', cafe: 'Bar / Café', other: 'Other' };
    return map[type] || type;
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
              fetchLeads(masterKey);
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
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-accent rounded-2xl text-black">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Platform Overview</h1>
            <p className="text-zinc-500 text-sm">Controlling {restaurants.length} restaurants · {leads.length} leads</p>
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

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex gap-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1.5 w-fit">
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'restaurants' ? 'bg-accent text-black' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <LayoutGrid size={16} />
            Restaurants ({restaurants.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('leads');
              if (leads.length === 0) fetchLeads(masterKey);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'leads' ? 'bg-accent text-black' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Users size={16} />
            Leads ({leads.length})
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto">

        {/* ═══ Restaurants Tab ═══ */}
        {activeTab === 'restaurants' && (
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
        )}

        {/* ═══ Leads Tab ═══ */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            {leadsLoading && (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-zinc-800 rounded" />
                        <div className="h-3 w-48 bg-zinc-800 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!leadsLoading && leads.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-zinc-600" />
                </div>
                <p className="text-zinc-400 font-bold">No leads yet</p>
                <p className="text-zinc-600 text-sm mt-1">Leads from the landing page waitlist will appear here.</p>
              </div>
            )}

            {!leadsLoading && leads.length > 0 && (
              <>
                {/* Table — Desktop */}
                <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest px-5 py-3">#</th>
                        <th className="text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest px-5 py-3">Name</th>
                        <th className="text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest px-5 py-3">Email</th>
                        <th className="text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest px-5 py-3">Business</th>
                        <th className="text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest px-5 py-3">Date</th>
                        <th className="text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead, i) => (
                        <tr key={lead.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                          <td className="px-5 py-4 text-xs text-zinc-600 font-mono">{i + 1}</td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-sm text-white">{lead.name}</span>
                          </td>
                          <td className="px-5 py-4">
                            <a href={`mailto:${lead.email}`} className="text-sm text-accent hover:underline">{lead.email}</a>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-lg">
                              {businessLabel(lead.businessType)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs text-zinc-500">{formatDate(lead.createdAt)}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-2 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all inline-flex"
                              title="Delete Lead"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards — Mobile */}
                <div className="md:hidden space-y-3">
                  {leads.map((lead) => (
                    <div key={lead.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm text-white">{lead.name}</p>
                          <a href={`mailto:${lead.email}`} className="text-xs text-accent hover:underline">{lead.email}</a>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg shrink-0">
                          {businessLabel(lead.businessType)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                          <Calendar size={12} />
                          {formatDate(lead.createdAt)}
                        </div>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1.5 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
