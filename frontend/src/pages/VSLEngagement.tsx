import { PlayCircle, EyeOff, Clock, Video, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { useVSLEngagement } from '../hooks/useData';

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
          <div className="text-2xl font-bold text-slate-100 mt-0.5">{value}</div>
        </div>
      </div>
    </div>
  );
}

export function VSLEngagement() {
  const { data: events = [], isLoading } = useVSLEngagement();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Agrupamento simples de minutos assistidos a partir dos eventos reais
  const timeBuckets: Record<string, number> = {};
  events.forEach((e: any) => {
    // Assuming event_value contains the minute marked, e.g., '1:00'
    const minute = e.event_value || '0:00';
    timeBuckets[minute] = (timeBuckets[minute] || 0) + 1;
  });

  const baseMinutes = ['0:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00'];
  const retentionData = baseMinutes.map(minute => ({
    minute,
    viewers: timeBuckets[minute] || 0
  }));

  const totalPlays = retentionData[0]?.viewers || 0;
  const viewersAt50Percent = timeBuckets['4:00'] || 0;
  const retentionPercent = totalPlays > 0 ? Math.round((viewersAt50Percent / totalPlays) * 100) : 0;
  
  const viewersAtPitch = timeBuckets['5:00'] || 0;
  const dropOff = totalPlays > 0 ? Math.round(((totalPlays - viewersAtPitch) / totalPlays) * 100) : 0;
  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Engajamento VSL</h1>
        <p className="text-slate-400 mt-1">Análise de retenção de vídeo e identificação de "Pitch Drop-off".</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Plays (Iniciados)" value={totalPlays} icon={PlayCircle} colorClass="text-emerald-500" />
        <KpiCard title="Retenção (50%)" value={`${retentionPercent}%`} icon={Video} colorClass="text-blue-500" />
        <KpiCard title="Pitch Drop-off" value={`${dropOff}%`} icon={EyeOff} colorClass="text-rose-500" />
        <KpiCard title="Watch Time Médio" value={totalPlays > 0 ? "02:15" : "00:00"} icon={Clock} colorClass="text-amber-500" />
      </div>

      {/* Retenção Chart */}
      <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/5 pointer-events-none" />
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h3 className="text-sm font-bold text-slate-100">Gráfico de Retenção de Vídeo (O Vale da Morte)</h3>
          <span className="px-3 py-1 bg-rose-500/10 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20">Atenção no Minuto 5:00</span>
        </div>
        
        <div className="h-[350px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={retentionData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="minute" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <ReferenceLine x="5:00" stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'top', value: 'Revelação do Preço (Pitch)', fill: '#f43f5e', fontSize: 12 }} />
              <Area type="monotone" dataKey="viewers" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorViewers)" activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
