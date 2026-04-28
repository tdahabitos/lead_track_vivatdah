import { useState } from 'react';
import { 
  TrendingUp, DollarSign, Target, ArrowUpRight, 
  Search, Calendar, Loader2, BarChart3,
  Percent, Wallet
} from 'lucide-react';
import { useRoiReport } from '../hooks/useData';

export function RoiDashboard() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const { data, isLoading } = useRoiReport(dateRange.start, dateRange.end);

  // Totais
  const totals = (data || []).reduce((acc: any, curr: any) => ({
    spend: acc.spend + Number(curr.total_spend),
    sales: acc.sales + Number(curr.total_sales),
    count: acc.count + Number(curr.conversion_count)
  }), { spend: 0, sales: 0, count: 0 });

  const totalRoas = totals.spend > 0 ? (totals.sales / totals.spend).toFixed(2) : '0.00';

  return (
    <div className="pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <TrendingUp className="text-indigo-500 w-8 h-8" />
            ROI Forense
          </h1>
          <p className="text-slate-400 mt-1">Análise real de investimento vs retorno por campanha.</p>
        </div>

        <div className="flex items-center gap-3 bg-[#16161a] p-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-700/50">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent text-xs text-slate-200 outline-none border-none focus:ring-0"
            />
            <span className="text-slate-600 px-1">até</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent text-xs text-slate-200 outline-none border-none focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <RoiKpi 
          title="Investimento Total" 
          value={`R$ ${totals.spend.toLocaleString()}`} 
          sub="Meta Ads Spend"
          icon={Wallet} 
          color="text-blue-400"
        />
        <RoiKpi 
          title="Vendas Totais" 
          value={`R$ ${totals.sales.toLocaleString()}`} 
          sub={`${totals.count} conversões`}
          icon={DollarSign} 
          color="text-emerald-400"
        />
        <RoiKpi 
          title="ROAS Geral" 
          value={`${totalRoas}x`} 
          sub="Retorno sobre investimento"
          icon={BarChart3} 
          color="text-indigo-400"
        />
        <RoiKpi 
          title="Líquido (Estimado)" 
          value={`R$ ${(totals.sales - totals.spend).toLocaleString()}`} 
          sub="Faturamento - Gasto"
          icon={Percent} 
          color="text-purple-400"
        />
      </div>

      {/* Campaign Table */}
      <div className="bg-[#16161a]/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-slate-200 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Performance por Campanha
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filtrar campanha..." 
              className="bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 focus:border-indigo-500 outline-none transition-all w-64"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-4">Campanha</th>
                  <th className="px-6 py-4 text-right">Investimento</th>
                  <th className="px-6 py-4 text-right">Vendas</th>
                  <th className="px-6 py-4 text-center">Conv.</th>
                  <th className="px-6 py-4 text-right">CPA</th>
                  <th className="px-6 py-4 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {(data || []).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">{row.campaign_name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-tight">Meta Ads</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-300">R$ {Number(row.total_spend).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-400">R$ {Number(row.total_sales).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-300">{row.conversion_count}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-300">R$ {Number(row.cpa).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${Number(row.roas) >= 2 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {Number(row.roas).toFixed(2)}x
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data || data.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic">
                      Nenhum dado de ROI localizado no período selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RoiKpi({ title, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-[#16161a]/90 border border-slate-800/50 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-xl">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition-transform ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-700 group-hover:text-slate-500" />
        </div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</h3>
        <div className="text-2xl font-bold text-slate-100">{value}</div>
        <div className="text-[10px] text-slate-500 mt-2">{sub}</div>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
        <Icon size={100} />
      </div>
    </div>
  );
}
