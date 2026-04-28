import { useState } from 'react';
import { Blocks, Key, CheckCircle2, XCircle, Globe, MessageCircle, CreditCard, Mail, Activity, Eye, Loader2, Save, X, ExternalLink, Trash2 } from 'lucide-react';
import { useCompany, useUpdateCompany } from '../hooks/useData';

// Definição dos campos que cada integração precisa
const integrationFields: Record<string, { label: string; key: string; type: string; placeholder: string; help: string }[]> = {
  meta: [
    { label: 'Pixel ID', key: 'fb_pixel_id', type: 'text', placeholder: 'Ex: 1234567890123456', help: 'Events Manager → Data Sources → Selecionar Pixel → ID numérico no topo' },
    { label: 'ID de Conversão do Pixel', key: 'fb_conversion_id', type: 'text', placeholder: 'Ex: conversion_123...', help: 'ID de conversão específico configurado no seu Pixel' },
    { label: 'Ad Account ID (Conta de Anúncios)', key: 'fb_ad_account_id', type: 'text', placeholder: 'Ex: act_1234567890 ou apenas 1234567890', help: 'Meta Business Suite → Configurações → Contas de Anúncios → ID da conta (começa com act_)' },
    { label: 'Access Token (Permanente)', key: 'fb_access_token', type: 'password', placeholder: 'Cole o token gerado no Events Manager', help: 'Events Manager → Settings → Conversions API → "Gerar token de acesso"' },
    { label: 'Test Event Code (opcional)', key: 'fb_test_event_code', type: 'text', placeholder: 'Ex: TEST12345', help: 'Events Manager → Test Events → Copiar código (apenas para debug)' },
  ],
  guru: [
    { label: 'Webhook Secret / Token', key: 'webhook_secret', type: 'password', placeholder: 'Cole o token de segurança do Guru', help: 'Painel Guru → Configurações → Webhooks → Token de Segurança' },
  ],
  manychat: [
    { label: 'API Token (Pro)', key: 'manychat_api_token', type: 'password', placeholder: 'Cole o token gerado no ManyChat', help: 'ManyChat → Settings → API → "Generate Your Token" (requer plano Pro)' },
  ],
  brevo: [
    { label: 'API Key (v3)', key: 'brevo_api_key', type: 'password', placeholder: 'Cole a API Key do Brevo', help: 'Brevo → Perfil → SMTP & API → API Keys → "Generate a new API key"' },
  ],
  mautic: [
    { label: 'URL da Instância', key: 'mautic_url', type: 'text', placeholder: 'https://mautic.seudominio.com.br', help: 'A URL completa da sua instância Mautic' },
    { label: 'Username (Admin)', key: 'mautic_username', type: 'text', placeholder: 'Seu login de admin', help: 'O mesmo login que você usa para acessar o painel do Mautic' },
    { label: 'Password', key: 'mautic_password', type: 'password', placeholder: 'Sua senha de admin', help: 'A mesma senha que você usa para acessar o painel do Mautic' },
  ],
  clarity: [
    { label: 'Project ID', key: 'clarity_project_id', type: 'text', placeholder: 'Ex: k7a9b2c1d3', help: 'Clarity → Settings → Setup → Copiar Project ID' },
  ],
};

// Documentação e links de cada plataforma
const integrationDocs: Record<string, { url: string; label: string }> = {
  meta: { url: 'https://business.facebook.com/events_manager2/', label: 'Abrir Events Manager' },
  guru: { url: 'https://digitalmanager.guru/', label: 'Abrir Painel Guru' },
  manychat: { url: 'https://manychat.com/', label: 'Abrir ManyChat' },
  brevo: { url: 'https://app.brevo.com/', label: 'Abrir Brevo' },
  mautic: { url: 'https://mautic.org/', label: 'Documentação Mautic' },
  clarity: { url: 'https://clarity.microsoft.com/', label: 'Abrir Clarity' },
};

// Reusable configurations for UI presentation
const baseIntegrations = [
  { id: 'meta', name: 'Meta Ads (Facebook CAPI)', type: 'Fonte de Tráfego / Conversions API', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'guru', name: 'Digital Manager Guru', type: 'Gateway de Pagamento / Webhooks', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'manychat', name: 'ManyChat', type: 'Automação WhatsApp / Messenger', icon: MessageCircle, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { id: 'brevo', name: 'Brevo / Sendinblue', type: 'CRM E-mail Marketing', icon: Mail, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  { id: 'mautic', name: 'Mautic', type: 'CRM E-mail Avançado / Automação', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'clarity', name: 'Microsoft Clarity', type: 'Heatmaps & Gravação de Sessão', icon: Eye, color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

export function IntegrationsHub() {
  const { data: company, isLoading } = useCompany();
  const updateCompany = useUpdateCompany();
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Checa status baseado nas colunas reais do banco
  const getStatus = (id: string): 'connected' | 'disconnected' => {
    if (!company) return 'disconnected';
    const c = company as any;
    switch (id) {
      case 'meta': return c.fb_pixel_id && c.fb_access_token ? 'connected' : 'disconnected';
      case 'guru': return c.webhook_secret ? 'connected' : 'disconnected';
      case 'manychat': return c.manychat_api_token ? 'connected' : 'disconnected';
      case 'brevo': return c.brevo_api_key ? 'connected' : 'disconnected';
      case 'mautic': return c.mautic_url && c.mautic_username ? 'connected' : 'disconnected';
      case 'clarity': return c.clarity_project_id ? 'connected' : 'disconnected';
      default: return 'disconnected';
    }
  };

  const integrations = baseIntegrations.map(integration => ({
    ...integration,
    status: getStatus(integration.id),
  }));

  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  const handleConnect = (app: any) => {
    setSelectedApp(app);
    setSaveSuccess(false);
    
    // Pre-fill from database
    const values: Record<string, string> = {};
    const fields = integrationFields[app.id] || [];
    
    if (app.id === 'meta') {
      values.fb_pixel_id = (company as any)?.fb_pixel_id || '';
      values.fb_conversion_id = (company as any)?.fb_conversion_id || '';
      values.fb_ad_account_id = (company as any)?.fb_ad_account_id || '';
      values.fb_access_token = (company as any)?.fb_access_token || '';
      values.fb_test_event_code = (company as any)?.fb_test_event_code || '';
    } else {
      fields.forEach(field => {
        values[field.key] = (company as any)?.[field.key] || '';
      });
    }
    setFormValues(values);
  };

  const handleSave = async () => {
    if (!selectedApp || !company) return;
    setIsSaving(true);
    setSaveSuccess(false);
    
    const updates: Record<string, any> = {};
    const fields = integrationFields[selectedApp.id] || [];
    fields.forEach(field => {
      const val = formValues[field.key];
      updates[field.key] = val && val.trim() !== '' ? val.trim() : null;
    });

    console.log('[IntegrationsHub] Saving updates:', updates, 'for company id:', company.id);

    try {
      await updateCompany.mutateAsync({ id: company.id, updates });
      setSaveSuccess(true);
      setTimeout(() => {
        setSelectedApp(null);
        setSaveSuccess(false);
      }, 1500);
    } catch (error: any) {
      console.error('[IntegrationsHub] Save error:', error);
      alert(`Erro ao salvar: ${error?.message || 'Erro desconhecido'}. Verifique se a migration SQL foi executada no Supabase.`);
    } finally {
      setIsSaving(false);
    }
  };


  const handleDisconnect = async (appId: string) => {
    if (!company) return;
    if (!confirm('Tem certeza que deseja desconectar essa integração?')) return;
    
    const updates: any = {};
    const fields = integrationFields[appId] || [];
    fields.forEach(field => {
      updates[field.key] = null;
    });

    try {
      await updateCompany.mutateAsync({ id: company.id, updates });
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center">
          <Blocks className="w-8 h-8 mr-3 text-indigo-500" />
          Hub de Integrações
        </h1>
        <p className="text-slate-400 mt-2">Conecte o Cérebro (LeadTrack) aos seus Músculos (Plataformas Externas) via API.</p>
        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className={`w-2 h-2 rounded-full ${connectedCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {connectedCount}/{integrations.length} Conectados
          </div>
        </div>
      </div>

      {/* Grid de Apps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {integrations.map((app) => (
          <div key={app.id} className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 relative group hover:border-slate-500/50 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-slate-700/50 shadow-inner ${app.bg}`}>
                <app.icon className={`w-6 h-6 ${app.color}`} />
              </div>
              <div>
                {app.status === 'connected' ? (
                  <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    Conectado
                  </span>
                ) : (
                  <span className="flex items-center text-xs font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inativo
                  </span>
                )}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-100 mb-1">{app.name}</h3>
            <p className="text-sm text-slate-400 mb-1">{app.type}</p>
            <p className="text-[10px] text-slate-500 mb-6">
              {integrationFields[app.id]?.length || 0} campo(s) de configuração
            </p>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleConnect(app)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors flex items-center justify-center
                ${app.status === 'connected' 
                  ? 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700' 
                  : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]'}`}>
                <Key className="w-4 h-4 mr-2" />
                {app.status === 'connected' ? 'Gerenciar' : 'Conectar Agora'}
              </button>
              {app.status === 'connected' && (
                <button 
                  onClick={() => handleDisconnect(app.id)}
                  className="px-3 py-2.5 rounded-lg text-sm border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                  title="Desconectar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Geral */}
      <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 overflow-hidden">
        <h3 className="text-lg font-bold text-slate-100 mb-6">Resumo das Integrações</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-y border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Plataforma</th>
                <th className="px-6 py-4 font-semibold">Campos</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {integrations.map((app) => (
                <tr key={app.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${app.bg}`}>
                        <app.icon className={`w-4 h-4 ${app.color}`} />
                      </div>
                      <span className="font-medium text-slate-200">{app.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {integrationFields[app.id]?.map(f => f.label).join(', ')}
                  </td>
                  <td className="px-6 py-4">
                    {app.status === 'connected' ? (
                      <span className="flex items-center text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Conectado
                      </span>
                    ) : (
                      <span className="flex items-center text-slate-500 text-xs font-bold">
                        <XCircle className="w-4 h-4 mr-1.5" /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleConnect(app)}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-colors"
                    >
                      Configurar →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Configuração Multi-Campo */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#16161a] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header do Modal */}
            <div className="p-6 border-b border-slate-700/50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedApp.bg}`}>
                    <selectedApp.icon className={`w-5 h-5 ${selectedApp.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedApp.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedApp.type}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Corpo do Modal — Scrollável */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Link para a documentação */}
              {integrationDocs[selectedApp.id] && (
                <a 
                  href={integrationDocs[selectedApp.id].url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/5 border border-indigo-500/20 rounded-lg px-3 py-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {integrationDocs[selectedApp.id].label}
                </a>
              )}

              {/* Campos dinâmicos */}
              {selectedApp.id === 'guru' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Sua URL de Webhook (Copie e cole no Guru)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      readOnly
                      value="https://api.leadtrack.app/webhooks/guru"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-emerald-400 font-mono text-sm focus:outline-none cursor-copy"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).select();
                        navigator.clipboard.writeText("https://api.leadtrack.app/webhooks/guru");
                        alert("URL copiada!");
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                    📍 Use esta URL na configuração do Webhook dentro do painel do Digital Manager Guru.
                  </p>
                </div>
              )}

              {(integrationFields[selectedApp.id] || []).map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {field.label}
                  </label>
                  <input 
                    type={field.type}
                    value={formValues[field.key] || ''}
                    onChange={(e) => setFormValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                    📍 {field.help}
                  </p>
                </div>
              ))}

              <p className="text-[10px] text-slate-600 mt-4 pt-4 border-t border-slate-800">
                🔒 Todas as chaves são armazenadas de forma segura no seu banco Supabase. Apenas o administrador logado tem acesso.
              </p>
            </div>

            {/* Footer do Modal */}
            <div className="p-6 border-t border-slate-700/50 flex-shrink-0">
              {saveSuccess ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold py-3">
                  <CheckCircle2 className="w-5 h-5" />
                  Salvo com sucesso!
                </div>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedApp(null)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar Integração
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
