'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { BarChart3, TrendingUp, Receipt, Calendar, Menu } from 'lucide-react';
import { useSidebar } from '../components/AdminGuard';

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  salesByDay: Record<string, number>;
  recentOrders: any[];
}

export default function SalesSummaryPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantName, setRestaurantName] = useState('Admin');
  const [role, setRole] = useState<'manager' | 'staff'>('manager');
  const { isCollapsed, setIsCollapsed } = useSidebar();

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await adminFetch('/api/admin/restaurant-info');
        const data = await response.json();
        if (data.success) {
          setRestaurantName(data.name);
          setRole(data.role);
        }
      } catch (err) {
        console.error("Error fetching info:", err);
      }
    };
    fetchInfo();

    const fetchSales = async () => {
      try {
        const response = await adminFetch('/api/admin/sales-summary');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch sales summary');
        }
        
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSales();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-screen text-center p-6">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <BarChart3 size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-red-500 mb-2">Access Denied</h2>
        <p className="text-secondary-text max-w-sm">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto">
      <header className="bg-background/80 backdrop-blur-xl border-b border-white/5 pt-6 pb-6 sticky top-0 z-10">
        <div className="container mx-auto px-6 flex items-center gap-4">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 -ml-2 lg:hidden text-primary-text hover:bg-white/5 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-2xl lg:text-3xl font-black text-primary-text tracking-tight flex items-center gap-3">
            {restaurantName}
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              role === 'manager' 
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}>
              {role === 'manager' ? 'Manager Mode' : 'Staff Mode'}
            </span>
            <span className="text-secondary-text/30 mx-2 text-sm">|</span>
            <span className="text-lg">Sales Summary</span>
          </h1>
        </div>
      </header>
      
      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-white/5 p-6 rounded-3xl shadow-xl flex items-center gap-6">
            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
              <TrendingUp size={32} />
            </div>
            <div>
              <p className="text-sm font-black text-secondary-text uppercase tracking-widest mb-1">Total Revenue</p>
              <h3 className="text-4xl font-black text-primary-text">{formatPrice(data.totalRevenue)}</h3>
            </div>
          </div>
          
          <div className="bg-card border border-white/5 p-6 rounded-3xl shadow-xl flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500">
              <Receipt size={32} />
            </div>
            <div>
              <p className="text-sm font-black text-secondary-text uppercase tracking-widest mb-1">Total Orders</p>
              <h3 className="text-4xl font-black text-primary-text">{data.totalOrders}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-white/5 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <Calendar size={20} className="text-accent" />
            <h3 className="text-lg font-bold text-primary-text">Sales by Day</h3>
          </div>
          <div className="p-6">
            {Object.keys(data.salesByDay).length === 0 ? (
              <p className="text-secondary-text text-sm">No sales data available yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.salesByDay).sort((a,b) => b[0].localeCompare(a[0])).map(([dateStr, amount]) => (
                  <div key={dateStr} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-primary-text font-medium">{dateStr}</span>
                    <span className="text-accent font-mono font-bold">{formatPrice(amount as number)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-white/5 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <Receipt size={20} className="text-accent" />
            <h3 className="text-lg font-bold text-primary-text">Recent Orders</h3>
          </div>
          <div className="p-6">
            {data.recentOrders.length === 0 ? (
              <p className="text-secondary-text text-sm">No recent orders.</p>
            ) : (
              <div className="space-y-3">
                {data.recentOrders.map((order, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-primary-text font-bold">Table {order.table_number}</p>
                      <p className="text-xs text-secondary-text uppercase tracking-wider">{order.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-accent font-mono font-bold">{formatPrice(order.total)}</p>
                      <p className="text-xs text-secondary-text">
                        {order.created_at ? new Date(order.created_at).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
