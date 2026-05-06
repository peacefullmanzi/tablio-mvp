'use client';

import { useEffect, useState, Suspense } from 'react';
import { adminFetch } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { BarChart3, TrendingUp, Receipt, Calendar, Menu, ArrowLeft, RefreshCcw } from 'lucide-react';
import { useSidebar } from '../components/AdminGuard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface ChartData {
  name: string;
  revenue: number;
}

interface SalesData {
  totalRevenue: number;
  ordersCount: number;
  chartData: ChartData[];
}

type FilterType = 'today' | 'thisWeek' | 'thisMonth';

function SalesContent() {
  const [data, setData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('thisMonth');
  const [restaurantName, setRestaurantName] = useState('Admin');
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const fetchSales = async (currentFilter: FilterType) => {
    setIsLoading(true);
    try {
      const response = await adminFetch(`/api/admin/sales-summary?filter=${currentFilter}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch sales');
      }
      
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await adminFetch('/api/admin/restaurant-info');
        const info = await response.json();
        if (info.success) setRestaurantName(info.name);
      } catch (err) {
        console.error("Error fetching info:", err);
      }
    };
    fetchInfo();
    fetchSales(filter);
  }, [filter]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-screen text-center p-6">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
          <BarChart3 size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-secondary-text max-w-sm mb-6">{error}</p>
        <Link href="/admin" className="px-6 py-3 bg-accent text-background font-bold rounded-xl transition-all hover:scale-105 active:scale-95">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto pb-20">
      <header className="bg-background/80 backdrop-blur-xl border-b border-white/5 pt-6 pb-6 sticky top-0 z-10">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 -ml-2 lg:hidden text-primary-text hover:bg-white/5 rounded-lg shrink-0"
              >
                <Menu size={24} />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl lg:text-2xl font-black text-primary-text tracking-tight truncate">
                  Sales Analytics
                </h1>
                <p className="text-secondary-text text-[10px] font-black uppercase tracking-widest opacity-60 mt-0.5">
                  {restaurantName}
                </p>
              </div>
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
              {(['today', 'thisWeek', 'thisMonth'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                    filter === f 
                      ? 'bg-accent text-background shadow-lg shadow-accent/20' 
                      : 'text-secondary-text hover:text-white'
                  }`}
                >
                  {f.replace('this', '').toLowerCase() || 'today'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      
      <main className="p-6 max-w-6xl mx-auto w-full space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={80} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-black text-secondary-text uppercase tracking-[0.2em] mb-3">Revenue</p>
              <h3 className="text-4xl sm:text-5xl font-black text-primary-text tracking-tighter">
                {isLoading ? <div className="h-10 w-32 bg-white/5 animate-pulse rounded-lg" /> : formatPrice(data?.totalRevenue || 0)}
              </h3>
              <div className="mt-4 flex items-center gap-2 text-accent text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Live from {filter.replace('this', '').toLowerCase() || 'today'}
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Receipt size={80} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-black text-secondary-text uppercase tracking-[0.2em] mb-3">Total Orders</p>
              <h3 className="text-4xl sm:text-5xl font-black text-primary-text tracking-tighter">
                {isLoading ? <div className="h-10 w-24 bg-white/5 animate-pulse rounded-lg" /> : data?.ordersCount || 0}
              </h3>
              <p className="mt-4 text-secondary-text text-xs font-bold uppercase tracking-widest opacity-60">
                Completed Orders
              </p>
            </div>
          </motion.div>
        </div>
        
        {/* Chart Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-white/5 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent border border-accent/20">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Revenue Trends</h3>
                <p className="text-xs text-secondary-text font-bold uppercase tracking-widest opacity-60">Performance Overview</p>
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full">
            {isLoading ? (
              <div className="w-full h-full bg-white/5 animate-pulse rounded-3xl" />
            ) : data && data.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111C2E', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      padding: '12px 16px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: '#10B981', fontWeight: 'bold', fontSize: '14px' }}
                    labelStyle={{ color: '#9CA3AF', marginBottom: '4px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                    formatter={(value: any) => [formatPrice(Number(value) || 0), 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white/2 rounded-3xl border border-dashed border-white/10">
                <p className="text-secondary-text font-bold uppercase tracking-widest text-sm">No data for this period</p>
                <p className="text-secondary-text/40 text-[10px] mt-1">Check back later or try another filter</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCcw className="animate-spin text-accent" size={48} />
      </div>
    }>
      <SalesContent />
    </Suspense>
  );
}
