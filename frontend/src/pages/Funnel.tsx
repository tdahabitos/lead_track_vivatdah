import { ArrowRight, Loader2, Target, Users, ShoppingCart, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDashboardStats } from '../hooks/useData';
import { useFilter } from '../contexts/FilterContext';
import { DateFilter } from '../components/shared/DateFilter';

function FunnelKpi({ title, value, subtext, icon: Icon, suffix = '' }: { title: string; value: string; subtext: string, icon: any, suffix?: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 flex justify-between items-start">
      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
        <div className="text-3xl font-bold text-white">{value}{suffix}</div>
        <p className="text-xs text-slate-500 mt-2">{subtext}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-slate-900/80 flex items-center justify-center border border-slate-700/50 shadow-inner">
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}

export function Funnel() {
  const { days } = useFilter();
  const { data: metrics, isLoading } = useDashboardStats(1, days);

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const { funnel, totalCustomers, conversionRate } = metrics;

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Funil de Vendas</h1>
          <p className="text-slate-400 mt-1">Métricas de conversão em cada etapa da jornada.</p>
        </div>
        <DateFilter />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <FunnelKpi title="Taxa de Conversão" value={`${conversionRate}`} suffix="%" subtext="Lead para Cliente" icon={Target} />
        <FunnelKpi title="Total de Visitantes" value={funnel[0].value.toLocaleString()} subtext="Tráfego total capturado" icon={Users} />
        <FunnelKpi title="Total de Clientes" value={totalCustomers.toLocaleString()} subtext="Compras confirmadas" icon={ShoppingCart} />
        <FunnelKpi title="Tempo Médio" value={metrics.avgTime} subtext="Do 1º clique até a compra" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Funnel */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-8">
          <h3 className="text-lg font-bold text-slate-100 mb-8">Jornada de Consciência</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 80, left: 40, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#ffffff', fontSize: 14, fontWeight: 'bold' }} width={160} />
                <Tooltip 
                  cursor={{ fill: '#ffffff', opacity: 0.1 }} 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff' }} 
                  itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  formatter={(value: any) => [value.toLocaleString(), 'Usuários']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} label={{ position: 'right', fill: '#ffffff', fontSize: 14, fontWeight: 'bold', formatter: (val: any) => val.toLocaleString() }}>
                  {funnel.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === funnel.length - 1 ? '#10b981' : '#4f46e5'} opacity={1 - (index * 0.15)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Insights Automáticos</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <h4 className="text-sm font-bold text-emerald-400 mb-1">Conversão Saudável</h4>
                <p className="text-xs text-slate-300">A passagem de "Checkout" para "Clientes" está em 44%, acima da média do mercado (30%).</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <h4 className="text-sm font-bold text-amber-400 mb-1">Gargalo Identificado</h4>
                <p className="text-xs text-slate-300">Há {funnel[2].value - totalCustomers} leads na fase de Checkout que ainda não comprararão. Sugere-se campanha de remarketing.</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-indigo-400 mb-4">Ações Recomendadas</h3>
            <button className="w-full flex items-center justify-between bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-3 rounded-lg transition-colors shadow-lg shadow-indigo-600/20 mb-3">
              Exportar Públicos (Facebook)
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-sm font-medium px-4 py-3 rounded-lg transition-colors">
              Disparar Webhook (N8N)
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
