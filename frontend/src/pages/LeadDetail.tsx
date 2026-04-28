import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, User, MapPin, MousePointerClick, MousePointer2, 
  ShoppingCart, Eye, Activity, 
  Globe, Loader2, Mail, ShieldCheck, Zap, Clock, UserCheck 
} from 'lucide-react';
import { useLeadDetail, useLeadTimeline } from '../hooks/useData';

// Helper para mapear estilos de eventos
const getEventStyles = (type: string, name?: string) => {
  const n = (name || '').toLowerCase();
  
  if (n.includes('📧 abriu e-mail') || n.includes('mautic.email_on_open')) return { icon: Mail, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', label: '📧 E-mail Aberto' };
  if (n.includes('🖱️ clicou') || n.includes('mautic.email_on_click')) return { icon: MousePointer2, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', label: '🖱️ Clique no E-mail' };
  if (n.includes('👤 contato identificado') || n.includes('mautic.lead_identified')) return { icon: UserCheck, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', label: '👤 Sync CRM' };
  
  switch (type) {
    case 'pageview': return { icon: Eye, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', label: '📄 Visualizou Página' };
    case 'click': return { icon: MousePointerClick, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', label: '🖱️ Clique no Botão' };
    case 'form_submit': return { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: '📝 Formulário Capturado' };
    case 'identify': return { icon: User, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', label: '👤 Identificação do Lead' };
    case 'purchase': return { icon: ShoppingCart, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: '💰 Compra Aprovada' };
    case 'time_on_page': return { icon: Clock, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', label: '⏱️ Tempo de Retenção' };
    case 'scroll': return { icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20', label: '📊 Engajamento (Scroll)' };
    case 'begin_checkout': return { icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: '🛒 Iniciou Checkout' };
    default: return { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', label: name || type };
  }
};

function MiniKpi({ title, value, icon: Icon, colorClass }: any) {
  return (
    <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-xl rounded-xl p-4 flex flex-col justify-center">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-4 h-4 ${colorClass}`} />
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="text-xl font-bold text-slate-100 pl-7 truncate">{value}</div>
    </div>
  );
}

export function LeadDetail() {
  const { id } = useParams();
  const leadId = Number(id);
  const [activeTab, setActiveTab] = useState<'all' | 'visits' | 'events'>('all');

  const { data: lead, isLoading: loadingLead, refresh: refreshLead } = useLeadDetail(leadId);
  const { data: allTimelineItems = [], isLoading: loadingTimeline, refresh: refreshTimeline } = useLeadTimeline(leadId);

  useEffect(() => {
    if (!leadId) return;
    const timer = setInterval(() => {
      if (typeof refreshLead === 'function') refreshLead();
      if (typeof refreshTimeline === 'function') refreshTimeline();
    }, 10000);
    return () => clearInterval(timer);
  }, [leadId, refreshLead, refreshTimeline]);

  if (loadingLead || loadingTimeline) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!lead) return <div className="text-red-400 p-10">Lead não encontrado.</div>;

  const timelineItems = allTimelineItems.filter(item => {
    if (activeTab === 'visits') return item._isVisit;
    if (activeTab === 'events') return !item._isVisit;
    return true;
  });

  return (
    <div className="pb-10 max-w-5xl mx-auto animate-in fade-in duration-500">
      <Link to="/leads" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-indigo-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para a lista
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl font-bold text-indigo-400 shadow-lg shadow-indigo-500/10">
            {lead.is_identified ? lead.name?.charAt(0) : '?'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{lead.is_identified ? lead.name : 'Lead Anônimo'}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${lead.is_identified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                {lead.is_identified ? 'Identificado' : 'Rastreando ID'}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">{lead.email || 'Identificação pendente'}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50">
           <div className="text-right">
             <p className="text-[10px] font-bold text-slate-500 uppercase">Lead Score</p>
             <p className="text-2xl font-bold text-emerald-400">{lead.score || 0}</p>
           </div>
           <div className="w-[1px] h-10 bg-slate-800" />
           <div className="text-right">
             <p className="text-[10px] font-bold text-slate-500 uppercase">Estágio</p>
             <p className="text-sm font-bold text-slate-200 capitalize">{lead.lead_stage || 'Visitante'}</p>
           </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MiniKpi title="Visitas" value={lead.total_visits || 0} icon={Eye} colorClass="text-blue-400" />
        <MiniKpi title="Eventos" value={lead.total_events || allTimelineItems.filter(i => !i._isVisit).length} icon={Activity} colorClass="text-emerald-400" />
        <MiniKpi title="Origem" value={lead.first_utm_source || 'Direto'} icon={Globe} colorClass="text-amber-400" />
        <MiniKpi title="Cidade" value={lead.city || 'Desconhecido'} icon={MapPin} colorClass="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#16161a]/90 border border-slate-700/40 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Identidade Forense</h3>
            <div className="space-y-5">
               <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">LT_ID (Cookie Principal)</p>
                  <p className="text-[11px] font-mono text-slate-300 break-all">{lead.lt_id}</p>
               </div>
               <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Endereço IP</p>
                    <p className="text-xs text-slate-200 font-mono break-all bg-slate-900/30 p-2 rounded border border-slate-800/30">{lead.ip_address || '---'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Facebook FBP</p>
                      <p className="text-[10px] text-slate-400 font-mono break-all">{lead.fbp || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Facebook FBC</p>
                      <p className="text-[10px] text-slate-400 font-mono break-all">{lead.fbc || '---'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Dispositivo</p><p className="text-xs text-slate-200 capitalize">{lead.device_type || '---'}</p></div>
                    <div><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Sistema</p><p className="text-xs text-slate-200">{lead.os_name || '---'}</p></div>
                  </div>
               </div>
            </div>
          </div>
          <div className="bg-[#16161a]/90 border border-slate-700/40 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-amber-500" /> Atribuição</h3>
            <div className="space-y-5">
              {[
                { label: 'Campaign', val: lead.first_utm_campaign },
                { label: 'Source', val: lead.first_utm_source },
                { label: 'Medium', val: lead.first_utm_medium }
              ].map((utm, i) => (
                <div key={i} className="border-b border-slate-800/50 pb-3 last:border-0">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{utm.label}</p>
                  <p className="text-xs text-slate-200 font-medium">{utm.val || '---'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#16161a]/90 border border-slate-700/40 rounded-2xl p-6 shadow-xl">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest"><Activity className="w-4 h-4 text-indigo-400" /> Timeline</h3>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {['all', 'visits', 'events'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-3 py-1.5 text-[9px] font-bold uppercase rounded-md transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{tab}</button>
                  ))}
                </div>
             </div>
             <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 pb-4">
                {timelineItems.map((item: any, i) => {
                  const isVisit = item._isVisit;
                  const style = isVisit ? { icon: Globe, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20', label: '🌐 Início de Sessão' } : getEventStyles(item.event_type, item.event_name);
                  const Icon = style.icon;
                  const rawDate = item.timestamp || item.event_at || item.visit_at;
                  const timeStr = rawDate ? new Date(rawDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                  return (
                    <div key={i} className="relative pl-8 group">
                      <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-2 ${style.border} ${style.bg} flex items-center justify-center ring-4 ring-[#16161a]`}>
                        <Icon className={`w-3.5 h-3.5 ${style.color}`} />
                      </div>
                      <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                           <span className={`text-[10px] font-bold uppercase ${style.color}`}>{style.label}</span>
                           <span className="text-[10px] text-slate-500">{timeStr}</span>
                        </div>
                        <div className="text-sm text-slate-300">
                          {isVisit ? <p>Acessou <span className="text-indigo-300 font-medium">"{item.page_path}"</span></p> : (
                            <>
                              {item.event_type === 'pageview' && <p>Navegou até <span className="text-blue-300 font-medium">"{item.page_path || item.metadata?.page_path || '---'}"</span></p>}
                              {item.event_type === 'click' && <p>Interação: <span className="text-amber-400 font-medium">"{item.element_text || item.metadata?.element_text || '---'}"</span></p>}
                              {item.event_type === 'scroll' && <p>Rolou até <span className="text-indigo-400 font-bold">{item.metadata?.scroll_percent || item.metadata?.percent || '---'}%</span> da página</p>}
                              {item.event_type === 'purchase' && <p className="text-emerald-400 font-bold">💰 Compra: R$ {item.event_value || item.metadata?.value}</p>}
                              {item.event_type === 'time_on_page' && <p className="text-orange-400 font-medium flex items-center gap-2"><Clock className="w-3 h-3" /> Visitante retido por {item.metadata?.seconds || item.metadata?.time_on_page || '---'} segundos</p>}
                              {item.event_type === 'exit_intent' && <p className="text-rose-400 font-medium">🚪 Intenção de Saída detectada (Scroll: {item.metadata?.scroll_percent || '---'}%)</p>}
                              {item.event_type === 'page_hide' && <p className="text-slate-400 italic font-medium">⏱️ Sessão encerrada após {item.metadata?.time_on_page || '---'}s</p>}

                              {item.event_type === 'identify' && (
                                <div className="mt-2 bg-indigo-500/5 p-3 rounded border border-indigo-500/10 text-xs">
                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><p className="text-slate-500 uppercase font-bold text-[9px] mb-1">Nome</p><p className="text-slate-200 font-medium">{item.metadata?.name || '---'}</p></div>
                                      <div><p className="text-slate-500 uppercase font-bold text-[9px] mb-1">E-mail</p><p className="text-slate-200 font-medium">{item.metadata?.email || '---'}</p></div>
                                      <div><p className="text-slate-500 uppercase font-bold text-[9px] mb-1">Telefone</p><p className="text-slate-200 font-medium">{item.metadata?.phone || '---'}</p></div>
                                   </div>
                                </div>
                              )}
                              {item.event_type === 'form_submit' && (
                                <div className="mt-2 bg-emerald-500/5 p-3 rounded border border-emerald-500/10 text-xs">
                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><p className="text-slate-500 uppercase font-bold text-[9px] mb-1">E-mail Capturado</p><p className="text-slate-200 font-medium">{item.metadata?.lead_email || '---'}</p></div>
                                      <div><p className="text-slate-500 uppercase font-bold text-[9px] mb-1">Nome Capturado</p><p className="text-slate-200 font-medium">{item.metadata?.lead_name || '---'}</p></div>
                                      <div><p className="text-slate-500 uppercase font-bold text-[9px] mb-1">Telefone Capturado</p><p className="text-slate-200 font-medium">{item.metadata?.lead_phone || '---'}</p></div>
                                   </div>
                                </div>
                              )}
                              {item.event_type === 'custom' && <p className="text-[11px] text-slate-500 italic uppercase">Via {item.metadata?.provider || 'Mautic'}</p>}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
