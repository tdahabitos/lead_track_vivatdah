import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Funnel, Link2, MapPin, Activity, CalendarDays, PlayCircle, Smartphone, ShoppingCart, Megaphone, Blocks, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Leads', path: '/leads', icon: Users },
  { name: 'Funil', path: '/funnel', icon: Funnel },
  { name: 'Análise UTM', path: '/utm', icon: Link2 },
  { name: 'Geográfico', path: '/geo', icon: MapPin },
  { name: 'Eventos', path: '/events', icon: Activity },
  { name: 'Temporal', path: '/temporal', icon: CalendarDays },
  { name: 'Engajamento VSL', path: '/vsl', icon: PlayCircle },
  { name: 'Dispositivos', path: '/devices', icon: Smartphone },
  { name: 'Saúde Checkout', path: '/checkout', icon: ShoppingCart },
  { name: 'Campanhas & ROAS', path: '/campaigns', icon: Megaphone },
  { name: 'ROI Forense', path: '/roi', icon: TrendingUp },
  { name: 'Integrações', path: '/integrations', icon: Blocks },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-[220px] fixed inset-y-0 left-0 bg-[#0f0f11] border-r border-slate-800/60 shadow-[4px_0_24px_rgba(0,0,0,0.4)] flex flex-col z-20">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/60 relative">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">LeadTrack</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                isActive 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              )}
            >
              <item.icon className={clsx("w-5 h-5", isActive ? "text-indigo-200" : "text-slate-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Dados em tempo real
        </div>
      </div>
    </aside>
  );
}
