import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';
import { useLeads } from '../hooks/useData';

export function Geographic() {
  const { data: leads = [], isLoading } = useLeads();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Calculate geoData from leads
  const stateStats: Record<string, { visits: number, leads: number, customers: number }> = {};
  
  leads.forEach(lead => {
    if (!lead.state) return;
    const state = lead.state.toUpperCase();
    if (!stateStats[state]) {
      stateStats[state] = { visits: 0, leads: 0, customers: 0 };
    }
    stateStats[state].visits += (lead.total_visits || 1);
    stateStats[state].leads += 1;
    if (lead.is_customer) {
      stateStats[state].customers += 1;
    }
  });

  const geoData = Object.entries(stateStats)
    .map(([state, stats]) => ({
      state: state,
      visits: stats.visits,
      leads: stats.leads,
      customers: stats.customers
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  // If no data, provide fallback for design preview
  const finalData = geoData.length > 0 ? geoData : [
    { state: 'N/A', visits: 0, leads: 0, customers: 0 }
  ];

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Geográfico</h1>
        <p className="text-slate-400 mt-1">Descubra de onde vem o tráfego e as vendas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-6">Top Estados (Brasil)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={finalData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="state" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={120} />
                <Tooltip cursor={{ fill: '#334155', opacity: 0.2 }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="visits" radius={[0, 4, 4, 0]} fill="#4f46e5" barSize={30}>
                  {finalData.map((_, index) => (
                    <Cell key={`cell-${index}`} fillOpacity={1 - index * 0.15} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-700/50">
            <h3 className="text-lg font-bold text-slate-100">Desempenho por Estado</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium text-right">Visitas</th>
                  <th className="px-6 py-4 font-medium text-right">Conversões</th>
                  <th className="px-6 py-4 font-medium text-right">Taxa (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {finalData.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 text-slate-200 font-medium">{item.state}</td>
                    <td className="px-6 py-4 text-right text-slate-300">{item.visits.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-emerald-400">{item.customers}</td>
                    <td className="px-6 py-4 text-right text-slate-400">{((item.customers / item.visits) * 100).toFixed(1)}%</td>
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
