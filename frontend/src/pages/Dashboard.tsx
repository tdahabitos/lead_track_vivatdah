import { Users, Eye, Activity, Target, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

import { useDashboardStats, useLeads } from '../hooks/useData';
import { useFilter } from '../contexts/FilterContext';
import { DateFilter } from '../components/shared/DateFilter';

function KpiCard({ title, value, icon: Icon, growth, suffix = '' }: any) {
  const isPositive = growth > 0;
  return (
    <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
      {/* 3D Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <div className="w-10 h-10 rounded-xl bg-slate-900/80 flex items-center justify-center border border-slate-700/50 shadow-inner">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-white">{value}{suffix}</div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {Math.abs(growth)}%
          </span>
          <span className="text-xs text-slate-500">vs último mês</span>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { days } = useFilter();
  const { data: metrics, isLoading: loadingMetrics } = useDashboardStats(1, days);
  const { data: leads, isLoading: loadingLeads } = useLeads(1, days);

  if (loadingMetrics || loadingLeads) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!metrics || !leads) return null;

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h1>
          <p className="text-slate-400 mt-1">Acompanhe a jornada dos seus leads em tempo real.</p>
        </div>
        <DateFilter />
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Total de Leads" value={metrics.totalLeads.toLocaleString()} icon={Users} growth={metrics.leadsGrowth} />
        <KpiCard title="Visitantes Únicos" value={metrics.totalVisits.toLocaleString()} icon={Eye} growth={metrics.visitsGrowth} />
        <KpiCard title="Tempo Médio Conversão" value={metrics.avgTime} icon={Activity} growth={0} />
        <KpiCard title="Taxa de Conversão" value={metrics.conversionRate} suffix="%" icon={Target} growth={4.2} />
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Funil de Vendas (Estilo Visual 3D) */}
        <div className="lg:col-span-1 bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/5 pointer-events-none" />
          <h3 className="text-lg font-bold text-slate-100 mb-1 relative z-10">Funil de Vendas</h3>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <p className="text-xs text-slate-400">Visitantes → Clientes</p>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 rounded-md border border-indigo-500/20">
              <Activity className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-300 uppercase">Velocidade: {metrics.avgTime}</span>
            </div>
          </div>
          
          <div className="h-[340px] w-full max-w-[320px] mx-auto relative z-10 flex flex-col mt-6 mb-4">
            {/* 3D Top Ellipse (A "boca" do funil) */}
            <div className="absolute -top-4 -left-[2px] w-[calc(100%+4px)] h-10 rounded-[50%] bg-gradient-to-b from-orange-400/90 to-orange-600/90 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.6),_0_4px_8px_rgba(0,0,0,0.4)] z-20" />
            
            {/* Funnel Body Clipped */}
            <div className="flex-1 w-full flex flex-col shadow-2xl shadow-black drop-shadow-2xl" style={{ clipPath: 'polygon(0 0, 100% 0, 65% 100%, 35% 100%)' }}>
              {[
                { bg: 'from-orange-700/80 via-orange-500/80 to-orange-800/80', text: 'text-orange-100', py: 'pt-6 pb-2' },
                { bg: 'from-blue-700/80 via-blue-500/80 to-blue-800/80', text: 'text-blue-100', py: 'py-2' },
                { bg: 'from-emerald-700/80 via-emerald-500/80 to-emerald-800/80', text: 'text-emerald-100', py: 'py-2' },
                { bg: 'from-amber-700/80 via-amber-500/80 to-amber-800/80', text: 'text-amber-100', py: 'py-2' },
                { bg: 'from-purple-700/80 via-purple-500/80 to-purple-800/80', text: 'text-purple-100', py: 'pt-2 pb-6' }
              ].map((style, index) => {
                const step = metrics.funnel[index];
                if (!step) return null;
                return (
                  <div key={index} className={`flex-1 bg-gradient-to-r ${style.bg} flex flex-col items-center justify-center text-white text-xs font-bold ${style.py} ${index < 4 ? 'border-b border-black/20' : ''}`}>
                    <span className="drop-shadow-md">{step.percentage}%</span>
                    <span className="uppercase text-[10px] tracking-wider my-0.5 text-white/90 drop-shadow-md">{step.name}</span>
                    <span className={`${style.text} drop-shadow-md`}>{step.value.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Últimos Leads Tabela */}
        <div className="lg:col-span-2 bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-0 overflow-hidden relative">
          <div className="p-6 border-b border-slate-700/50 relative z-10 bg-[#16161a]">
            <h3 className="text-lg font-bold text-slate-100">Leads Recentes (Radar)</h3>
          </div>
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0f0f11] text-slate-400 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Usuário</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Origem (UTM)</th>
                  <th className="px-6 py-4 font-medium">Visitas</th>
                  <th className="px-6 py-4 font-medium">Última Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {leads.slice(0, 5).map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${lead.is_identified ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-700 text-slate-300'}`}>
                          {lead.is_identified ? lead.name?.charAt(0) : '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{lead.is_identified ? lead.name : 'Lead Anônimo'}</p>
                          <p className="text-xs text-slate-500 font-mono">{lead.lt_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${lead.is_customer ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                        {lead.is_customer ? 'Cliente' : 'Lead Frio'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 capitalize">{lead.first_utm_source || 'Direto'}</td>
                    <td className="px-6 py-4 text-slate-300">{lead.total_visits}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{new Date(lead.last_visit_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
