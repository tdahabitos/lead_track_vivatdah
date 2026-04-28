import { CreditCard, AlertTriangle, CheckCircle, Wallet, Loader2 } from 'lucide-react';
import { useCheckoutHealth } from '../hooks/useData';
import { useFilter } from '../contexts/FilterContext';
import { DateFilter } from '../components/shared/DateFilter';

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

export function CheckoutHealth() {
  const { days } = useFilter();
  const { data, isLoading } = useCheckoutHealth(1, days);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const { stats, salesList } = data;

  return (
    <div className="pb-10">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Relatório de Vendas & Checkout</h1>
          <p className="text-slate-400 mt-1">Análise granular de faturamento e atribuição de UTMs (Guru).</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-400 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Vendas em Tempo Real (Guru)
          </div>
          <DateFilter />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Initiate Checkout" value={stats.initCheckouts} icon={CreditCard} colorClass="text-indigo-400" />
        <KpiCard title="Taxa de Aprovação" value={`${stats.approvalRate}%`} icon={CheckCircle} colorClass="text-emerald-400" />
        <KpiCard title="Recusas de Cartão" value={stats.rejectedCount} icon={AlertTriangle} colorClass="text-rose-400" />
        <KpiCard title="Faturamento Líquido" value={`R$ ${stats.totalRevenue.toLocaleString()}`} icon={Wallet} colorClass="text-amber-400" />
      </div>

      {/* Tabela de Vendas Detalhada */}
      <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" /> 
          Histórico Detalhado de Transações
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] text-slate-300">
            <thead className="uppercase bg-slate-800/50 text-slate-400 border-y border-slate-700/50">
              <tr>
                <th className="px-4 py-4 font-semibold">Data/Hora</th>
                <th className="px-4 py-4 font-semibold">Lead / Contato</th>
                <th className="px-4 py-4 font-semibold">Status / Valor (Bruto/Líquido)</th>
                <th className="px-4 py-4 font-semibold">UTM Campaign</th>
                <th className="px-4 py-4 font-semibold">UTM Content</th>
                <th className="px-4 py-4 font-semibold">UTM Term</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {salesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Nenhuma venda registrada no período selecionado.</td>
                </tr>
              ) : salesList.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-4 text-slate-500 font-mono">{item.time}</td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-200">{item.name}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">{item.phone || '---'}</div>
                    <div className="text-slate-500">{item.email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black border mb-1
                      ${item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        item.status.includes('BEGIN') ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {item.status}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-100">Líq: R$ {parseFloat(item.net_value || '0').toLocaleString()}</span>
                      <span className="text-[9px] text-slate-500">Bruto: R$ {parseFloat(item.value || '0').toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-400">{item.utm_campaign || '---'}</td>
                  <td className="px-4 py-4 text-slate-500">{item.utm_content || '---'}</td>
                  <td className="px-4 py-4 text-slate-500">{item.utm_term || '---'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
