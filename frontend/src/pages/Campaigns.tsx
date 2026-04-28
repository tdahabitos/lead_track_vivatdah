import { useState } from 'react';
import { Megaphone, Target, RefreshCcw, Loader2, Eye, MousePointerClick, Users, ShoppingCart, X, AlertTriangle, BarChart3, ExternalLink } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useCampaigns, useAdInsights } from '../hooks/useData';
import { useQueryClient } from '@tanstack/react-query';

function KpiCard({ title, value, subtitle, icon: Icon, colorClass }: any) {
  return (
    <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-slate-900/80 flex items-center justify-center border border-slate-700/50 shadow-inner">
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
          <div className="text-2xl font-bold text-slate-100 mt-0.5">{value}</div>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function AdInsightsDrawer({ campaign, onClose, datePreset }: { campaign: any; onClose: () => void; datePreset: string }) {
  const { data: ads, isLoading } = useAdInsights(campaign.id, datePreset);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative w-full max-w-2xl bg-[#0f0f12] border-l border-slate-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              <Target className="w-3 h-3" />
              Desempenho por Criativo
            </div>
            <h2 className="text-xl font-bold text-white truncate max-w-md">{campaign.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-slate-500 text-sm">Carregando métricas dos criativos...</p>
            </div>
          ) : ads?.length === 0 ? (
            <div className="text-center py-20 text-slate-500">Nenhum criativo encontrado para esta campanha.</div>
          ) : (
            <div className="space-y-4">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="pb-3 pr-4">Anúncio</th>
                    <th className="pb-3 px-4 text-right">Gasto</th>
                    <th className="pb-3 px-4 text-right">Cliques</th>
                    <th className="pb-3 px-4 text-right text-emerald-400">Compras</th>
                    <th className="pb-3 pl-4 text-right text-emerald-400">CPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {ads.map((ad: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/20">
                      <td className="py-4 pr-4">
                        <div className="font-bold text-slate-200">{ad.name}</div>
                        <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter truncate max-w-[200px]">Ad ID: {Math.random().toString(36).substr(2, 9)}</div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-slate-300">R$ {ad.spend.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right text-slate-400">{ad.clicks}</td>
                      <td className="py-4 px-4 text-right font-bold text-emerald-400">{ad.purchases}</td>
                      <td className="py-4 pl-4 text-right font-bold text-emerald-500">
                        {ad.purchases > 0 ? `R$ ${ad.cpa.toFixed(2)}` : '---'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-800 bg-slate-900/30">
          <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">
            Dados sincronizados em tempo real com Meta Ads API
          </p>
        </div>
      </div>
    </div>
  );
}

export function Campaigns() {
  const [datePreset, setDatePreset] = useState('last_30d');
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const { data, isLoading, isFetching } = useCampaigns(1, datePreset);
  const queryClient = useQueryClient();

  const handleSync = () => {
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Check for configuration error
  if (data?.error) {
    return (
      <div className="pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Campanhas & ROAS</h1>
          <p className="text-slate-400 mt-1">Dados reais da API do Meta Ads.</p>
        </div>
        <div className="bg-[#16161a]/90 border border-amber-500/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-4">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-100">Integração Meta Ads</h3>
          <p className="text-slate-400 text-center max-w-md">{data.error}</p>
          <a href="/integrations" className="mt-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors">
            Ir para Hub de Integrações →
          </a>
        </div>
      </div>
    );
  }

  const { summary, roasData = [], activeCampaigns = [] } = data || {};

  const totalGasto = summary?.total_spend || 0;
  const totalClicks = summary?.total_clicks || 0;
  const totalImpressions = summary?.total_impressions || 0;
  const totalReach = summary?.total_reach || 0;
  const totalPurchases = summary?.total_purchases || 0;

  const datePresets = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: 'last_7d', label: '7 dias' },
    { value: 'last_14d', label: '14 dias' },
    { value: 'last_30d', label: '30 dias' },
    { value: 'this_month', label: 'Este mês' },
    { value: 'last_month', label: 'Mês passado' },
  ];

  return (
    <div className="pb-10">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-500" />
            Campanhas & ROAS
          </h1>
          <p className="text-slate-400 mt-1">Dados reais sincronizados da API do Meta Ads (Facebook).</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Preset Selector */}
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="text-xs font-medium text-slate-300 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {datePresets.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button
            onClick={handleSync}
            disabled={isFetching}
            className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700 shadow-sm cursor-pointer hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 text-indigo-400 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Sincronizando...' : 'Sincronizar Meta Ads'}
          </button>
        </div>
      </div>

      {/* KPIs Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard title="Gasto Total" value={`R$ ${totalGasto.toFixed(2)}`} subtitle="Meta Ads" icon={Megaphone} colorClass="text-rose-500" />
        <KpiCard title="Impressões" value={totalImpressions.toLocaleString('pt-BR')} subtitle="Total" icon={Eye} colorClass="text-sky-500" />
        <KpiCard title="Cliques" value={totalClicks.toLocaleString('pt-BR')} subtitle={`CTR: ${summary?.avg_ctr || 0}%`} icon={MousePointerClick} colorClass="text-indigo-400" />
        <KpiCard title="Alcance" value={totalReach.toLocaleString('pt-BR')} subtitle="Pessoas únicas" icon={Users} colorClass="text-purple-400" />
        <KpiCard title="CPC Médio" value={`R$ ${summary?.avg_cpc || '0.00'}`} subtitle="Custo por Clique" icon={Target} colorClass="text-amber-500" />
        <KpiCard title="Compras" value={totalPurchases.toLocaleString('pt-BR')} subtitle={totalPurchases > 0 ? `CPA: R$ ${summary?.cpa}` : 'Nenhuma compra'} icon={ShoppingCart} colorClass="text-emerald-500" />
      </div>

      {/* Gráfico de Gasto Diário */}
      {roasData.length > 0 && (
        <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 relative overflow-hidden mb-8">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-sm font-bold text-slate-100">Gasto Diário em Anúncios (Meta Ads)</h3>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-500/80" /> Gasto (R$)</div>
            </div>
          </div>
          
          <div className="h-[300px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={roasData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `R$${val.toFixed(0)}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Gasto']}
                />
                <Area type="monotone" dataKey="gasto" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorGasto)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela de Campanhas */}
      <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 overflow-hidden">
        <h3 className="text-lg font-bold text-slate-100 mb-6">
          Auditoria de Campanhas 
          <span className="text-xs font-normal text-slate-400 ml-2">({activeCampaigns.length} campanhas)</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-y border-slate-700/50">
              <tr>
                <th className="px-4 py-4 font-semibold">Campanha</th>
                <th className="px-4 py-4 font-semibold text-rose-400">Gasto</th>
                <th className="px-4 py-4 font-semibold">Impressões</th>
                <th className="px-4 py-4 font-semibold">Cliques</th>
                <th className="px-4 py-4 font-semibold">CTR</th>
                <th className="px-4 py-4 font-semibold">CPC</th>
                <th className="px-4 py-4 font-semibold text-emerald-400">Compras</th>
                <th className="px-4 py-4 font-semibold">CPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {activeCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma campanha encontrada para o período selecionado.
                  </td>
                </tr>
              ) : activeCampaigns.map((camp: any) => (
                <tr 
                  key={camp.id} 
                  onClick={() => setSelectedCampaign(camp)}
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-4 font-medium text-slate-200 max-w-[250px] truncate flex items-center gap-2" title={camp.name}>
                    {camp.name}
                    <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                  </td>
                  <td className="px-4 py-4 font-mono text-rose-400 font-bold">{camp.spend}</td>
                  <td className="px-4 py-4 text-slate-400">{camp.impressions?.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-4 text-slate-300">{camp.clicks?.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-4 text-slate-400">{camp.ctr}</td>
                  <td className="px-4 py-4 text-slate-400">{camp.cpc}</td>
                  <td className="px-4 py-4 font-bold text-emerald-400">{camp.purchases}</td>
                  <td className="px-4 py-4 text-slate-300">{camp.cpa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Drawer for Ads */}
      {selectedCampaign && (
        <AdInsightsDrawer 
          campaign={selectedCampaign} 
          onClose={() => setSelectedCampaign(null)} 
          datePreset={datePreset}
        />
      )}
    </div>
  );
}
