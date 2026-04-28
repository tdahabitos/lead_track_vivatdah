import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';
import { useDashboardStats } from '../hooks/useData';
import { useFilter } from '../contexts/FilterContext';
import { DateFilter } from '../components/shared/DateFilter';

const COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

export function UTMAnalysis() {
  const { days } = useFilter();
  const { data: metrics, isLoading } = useDashboardStats(1, days);

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const data = metrics.topSources;

  return (
    <div className="pb-10">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Análise de Origem (UTM)</h1>
          <p className="text-slate-400 mt-1">Identifique os canais que trazem os leads mais qualificados.</p>
        </div>
        <DateFilter />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Bar Chart */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-6">Top Origens (UTM Source)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="source" tick={{ fill: '#ffffff', fontSize: 12 }} axisLine={false} tickLine={false} style={{ textTransform: 'capitalize' }} />
                <YAxis tick={{ fill: '#ffffff', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#ffffff', opacity: 0.1 }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', textTransform: 'capitalize', color: '#ffffff' }} itemStyle={{ color: '#ffffff' }} />
                <Bar dataKey="visits" radius={[4, 4, 0, 0]}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-6">Distribuição de Tráfego</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="visits"
                  nameKey="source"
                  stroke="none"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', textTransform: 'capitalize', color: '#ffffff' }} itemStyle={{ color: '#ffffff' }} />
                <Legend formatter={(value) => <span className="capitalize text-white font-medium">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela Detalhada */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-lg font-bold text-slate-100">Performance Detalhada por UTM</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Origem (Source)</th>
                <th className="px-6 py-4 font-medium text-right">Visitas Totais</th>
                <th className="px-6 py-4 font-medium text-right">% do Total</th>
                <th className="px-6 py-4 font-medium text-right">Conversão Estimada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {data.map((item, index) => {
                const percentage = metrics.totalVisits > 0 ? ((item.visits / metrics.totalVisits) * 100).toFixed(1) : '0.0';
                // Fake conversion rate for demo based on index to be pure
                const fakeConversion = ((index * 1.5) + 2).toFixed(1);
                return (
                  <tr key={index} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="capitalize text-slate-200 font-medium">{item.source}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-white font-medium">{item.visits.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-slate-100">{percentage}%</td>
                    <td className="px-6 py-4 text-right text-emerald-300 font-bold">{fakeConversion}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
