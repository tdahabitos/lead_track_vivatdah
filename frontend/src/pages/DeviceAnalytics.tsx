import { Smartphone, Monitor, Tablet, Globe, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useDeviceAnalytics } from '../hooks/useData';

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

export function DeviceAnalytics() {
  const { data: stats, isLoading } = useDeviceAnalytics();

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const COLORS = ['#fb923c', '#818cf8', '#34d399', '#c084fc', '#22d3ee', '#fb7185'];

  const deviceData = stats.deviceStats.map((s, i) => ({ ...s, fill: COLORS[i % COLORS.length] }));
  const osData = stats.osStats.map((s, i) => ({ ...s, fill: COLORS[i % COLORS.length] }));


  // Conversion rates (simulated for now until we have more purchase data)
  const browserConversionData = stats.browserStats.map((s, i) => {
    // Basic logic: Instagram usually has lower direct conversion than Chrome Desktop
    let rate = 0;
    if (s.name === 'Chrome') rate = 4.2;
    if (s.name === 'Safari') rate = 3.8;
    if (s.name === 'Instagram') rate = 1.5;
    return { name: s.name, conversao: rate, fill: COLORS[i % COLORS.length] };
  });

  const topDevice = stats.leaderDevice;
  const topOS = stats.leaderOS;

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Dispositivos & Tecnologia</h1>
        <p className="text-slate-400 mt-1">Descubra de onde vem o tráfego que realmente converte.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Líder de Acessos" value={topDevice} icon={Smartphone} colorClass="text-orange-500" />
        <KpiCard title="Líder de Sistema" value={topOS} icon={Globe} colorClass="text-purple-500" />
        <KpiCard title="Acesso Mobile" value={stats.mobileCount} icon={Tablet} colorClass="text-pink-500" />
        <KpiCard title="Acesso Desktop" value={stats.desktopCount} icon={Monitor} colorClass="text-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico 1: Tipo de Dispositivo */}
        <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 relative overflow-hidden">
          <h3 className="text-sm font-bold text-white mb-6 relative z-10">Sessões por Aparelho</h3>
          <div className="h-[250px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" outerRadius={100} dataKey="value" stroke="none" opacity={0.9}>
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#334155', borderRadius: '12px', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }} itemStyle={{ color: '#ffffff', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 relative z-10">
            {deviceData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-white font-medium">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 2: Sistema Operacional */}
        <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 relative overflow-hidden">
          <h3 className="text-sm font-bold text-white mb-6 relative z-10">Sessões por Sistema Operacional</h3>
          <div className="h-[250px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={osData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                  {osData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#334155', borderRadius: '12px', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }} itemStyle={{ color: '#ffffff', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 relative z-10">
            {osData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-white font-medium">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico 3: Navegadores e In-App Browsers */}
      <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 relative overflow-hidden">
        <h3 className="text-sm font-bold text-white mb-6 relative z-10">Taxa de Conversão por Navegador (%)</h3>
        <p className="text-xs text-slate-400 mb-6 relative z-10">Destaque para o bloqueio de cookies em navegadores nativos de redes sociais.</p>
        <div className="h-[300px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={browserConversionData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#334155', borderRadius: '12px', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}
                itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
              />
              <Bar dataKey="conversao" radius={[4, 4, 0, 0]}>
                {browserConversionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
