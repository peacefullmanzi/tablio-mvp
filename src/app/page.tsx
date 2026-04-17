import Link from "next/link";
import { UtensilsCrossed, LayoutDashboard, Utensils } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl p-8 shadow-2xl border border-white/5 text-center">
        <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
          <UtensilsCrossed className="text-accent" size={32} />
        </div>
        
        <h1 className="text-3xl font-bold text-primary-text mb-2">Tablio</h1>
        <p className="text-secondary-text mb-8">Modern Digital Menu System</p>

        <div className="space-y-4">
          <Link 
            href="/customer"
            className="flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-accent hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/5 p-3 rounded-lg group-hover:bg-accent/10 transition-colors">
                <Utensils className="text-primary-text group-hover:text-accent transition-colors" size={24} />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-primary-text group-hover:text-accent transition-colors">Customer View</h2>
                <p className="text-sm text-secondary-text">Browse menu and place orders</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin"
            className="flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-accent hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/5 p-3 rounded-lg group-hover:bg-accent/10 transition-colors">
                <LayoutDashboard className="text-primary-text group-hover:text-accent transition-colors" size={24} />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-primary-text group-hover:text-accent transition-colors">Admin Dashboard</h2>
                <p className="text-sm text-secondary-text">Manage live orders and status</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

