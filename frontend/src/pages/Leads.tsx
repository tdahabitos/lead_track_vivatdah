import { useState } from 'react';
import { Search, Download, ChevronRight, User, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLeads } from '../hooks/useData';
import { useFilter } from '../contexts/FilterContext';
import { DateFilter } from '../components/shared/DateFilter';

export function Leads() {
  const { days } = useFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'customer' | 'lead'>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const { data: leads, isLoading, error } = useLeads(1, days);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400">Erro ao carregar leads: {(error as Error).message}</div>;
  }

  const uniqueSources = Array.from(new Set((leads || []).map(l => l.first_utm_source || 'direct')));

  const filteredLeads = (leads || []).filter(lead => {
    const matchesSearch = (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lead.lt_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || 
      (stageFilter === 'customer' ? lead.is_customer : !lead.is_customer);
    
    const matchesSource = sourceFilter === 'all' || 
      (lead.first_utm_source || 'direct') === sourceFilter;

    return matchesSearch && matchesStage && matchesSource;
  });

  return (
    <div className="pb-10">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Gestão de Leads</h1>
          <p className="text-slate-400 mt-1">Todos os contatos e cookies anônimos capturados.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar nome, email ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/80 border border-slate-700 text-sm rounded-lg pl-9 pr-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-full md:w-64 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={stageFilter}
              onChange={(e: any) => setStageFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
            >
              <option value="all">Todos Status</option>
              <option value="customer">Clientes VIP</option>
              <option value="lead">Leads Frios</option>
            </select>
            <select 
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
            >
              <option value="all">Todas Origens</option>
              {uniqueSources.map(s => (
                <option key={s} value={s} className="capitalize">{s === 'direct' ? 'Direto' : s}</option>
              ))}
            </select>
          </div>
          <DateFilter />
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-600/20">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Tabela Principal */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium">Lead / Identificação</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Localização</th>
                <th className="px-6 py-4 font-medium">Origem (Primeira)</th>
                <th className="px-6 py-4 font-medium">Atividade</th>
                <th className="px-6 py-4 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${lead.is_identified ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {lead.is_identified ? lead.name?.charAt(0) : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{lead.is_identified ? lead.name : 'Lead Anônimo'}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{lead.lt_id}</p>
                        {lead.email && <p className="text-xs text-slate-400 mt-0.5">{lead.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${lead.is_customer ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                      {lead.is_customer ? 'Cliente VIP' : 'Lead Frio'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-300">{lead.city || '-'}</p>
                    <p className="text-xs text-slate-500">{lead.state ? `${lead.state}, ${lead.country || 'BR'}` : 'Desconhecido'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-300 capitalize">{lead.first_utm_source || 'Tráfego Direto'}</p>
                    {lead.first_utm_campaign && <p className="text-xs text-slate-500 truncate w-32">{lead.first_utm_campaign}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-300">{lead.total_events} eventos</p>
                    <p className="text-xs text-slate-500">em {lead.total_visits} visitas</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/leads/${lead.id}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
