import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Activity, Hash, FileText, Users, Loader2 } from 'lucide-react';
import { useAllEvents, useDashboardStats } from '../hooks/useData';
import { useFilter } from '../contexts/FilterContext';
import { DateFilter } from '../components/shared/DateFilter';

const COLORS = ['#ea580c', '#22c55e', '#3b82f6', '#8b5cf6', '#eab308'];

function KpiCard({ title, value, icon: Icon, colorClass }: any) {
  return (
    <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-slate-900/80 flex items-center justify-center border border-slate-700/50 shadow-inner">
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
          <div className="text-2xl font-bold text-white mt-0.5">{value}</div>
        </div>
      </div>
    </div>
  );
}

export function Events() {
  const { days } = useFilter();
  const { data: events = [], isLoading: loadingEvents } = useAllEvents(1, days);
  const { data: metrics, isLoading: loadingMetrics } = useDashboardStats(1, days);

  if (loadingEvents || loadingMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const totalEvents = metrics?.totalEvents || 0;
  const uniqueTypes = new Set(events.map(e => e.event_type)).size;
  const uniquePages = new Set(events.map(e => e.page_path)).size;

  // Gerar pieData dinâmico
  const typeCounts: Record<string, number> = {};
  events.forEach((e: any) => {
    typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
  });
  const pieData = Object.entries(typeCounts).map(([name, value], i) => ({
    name, value, fill: COLORS[i % COLORS.length]
  }));

  // Gerar lineData dinâmico (últimos 7 dias)
  const dateCounts: Record<string, number> = {};
  events.forEach((e: any) => {
    const d = new Date(e.event_at);
    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
  });
  const lineData = Object.entries(dateCounts)
    .map(([date, count]) => ({ date, events: count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="pb-10">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Eventos</h1>
          <p className="text-slate-400 mt-1">Rastreamento de ações dos usuários</p>
        </div>
        <DateFilter />
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Total de Eventos" value={totalEvents} icon={Activity} colorClass="text-orange-500" />
        <KpiCard title="Tipos Únicos" value={uniqueTypes} icon={Hash} colorClass="text-amber-600" />
        <KpiCard title="Páginas" value={uniquePages} icon={FileText} colorClass="text-amber-500" />
        <KpiCard title="Leads com Eventos" value={metrics?.totalLeads || 0} icon={Users} colorClass="text-orange-400" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/5 pointer-events-none" />
          <h3 className="text-sm font-bold text-slate-100 mb-6 relative z-10">Por Tipo de Evento</h3>
          <div className="h-[250px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#334155', borderRadius: '12px', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/5 pointer-events-none" />
          <h3 className="text-sm font-bold text-slate-100 mb-6 relative z-10">Eventos ao Longo do Tempo</h3>
          <div className="h-[250px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" stroke="#ffffff" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#ffffff' }} />
                <YAxis stroke="#ffffff" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#ffffff' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#334155', borderRadius: '12px', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="events" name="Eventos" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-0 overflow-hidden relative">
        <div className="p-6 border-b border-slate-700/50 relative z-10 bg-[#16161a]">
          <h3 className="text-sm font-bold text-slate-100">Eventos Recentes</h3>
        </div>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-[#0f0f11] text-slate-400 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Página</th>
                <th className="px-6 py-4 font-medium">Elemento</th>
                <th className="px-6 py-4 font-medium">Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {events.slice(0, 5).map((event: any, idx: number) => (
                <tr key={event.id || idx} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">{event.event_type}</td>
                  <td className="px-6 py-4 text-slate-400">{event.event_name ? event.event_name.replace(/_/g, ' ') : '-'}</td>
                  <td className="px-6 py-4 text-slate-300 font-mono text-[10px] md:text-xs truncate max-w-[200px] md:max-w-xs">{event.page_path || '-'}</td>
                  <td className="px-6 py-4 text-slate-400">{event.element_text || '-'}</td>
                  <td className="px-6 py-4 text-slate-400 text-[10px] md:text-xs">{new Date(event.event_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
