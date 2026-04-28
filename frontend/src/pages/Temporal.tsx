import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2 } from 'lucide-react';
import { useTemporalAnalytics } from '../hooks/useData';
import { useFilter } from '../contexts/FilterContext';
import { DateFilter } from '../components/shared/DateFilter';

const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const hours = Array.from({length: 24}, (_, i) => i);

export function Temporal() {
  const { days: filterDays } = useFilter();
  const { data, isLoading } = useTemporalAnalytics(1, filterDays);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Calculate temporalData from data.visits and data.events
  const statsByDate: Record<string, { visits: number, events: number }> = {};
  
  data.visits.forEach((v: any) => {
    const date = new Date(v.visit_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    if (!statsByDate[date]) statsByDate[date] = { visits: 0, events: 0 };
    statsByDate[date].visits++;
  });
  
  data.events.forEach((e: any) => {
    const date = new Date(e.event_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    if (!statsByDate[date]) statsByDate[date] = { visits: 0, events: 0 };
    statsByDate[date].events++;
  });

  const temporalData = Object.entries(statsByDate)
    .map(([date, stats]) => ({ date, visits: stats.visits, events: stats.events }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Fallback se não tiver dados
  const finalData = temporalData.length > 0 ? temporalData : [
    { date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), visits: 0, events: 0 }
  ];
  return (
    <div className="pb-10">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Análise Temporal</h1>
          <p className="text-slate-400 mt-1">Padrões de atividade ao longo do tempo</p>
        </div>
        <DateFilter />
      </div>

      {/* Gráfico de Linha */}
      <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/5 pointer-events-none" />
        <h3 className="text-sm font-bold text-slate-100 mb-6 relative z-10">Visitas e Eventos — Últimos dias</h3>
        <div className="h-[300px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={finalData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" vertical={false} opacity={0.3} />
              <XAxis dataKey="date" stroke="#ffffff" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#ffffff' }} />
              <YAxis stroke="#ffffff" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#ffffff' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#334155', borderRadius: '12px', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}
                itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="visits" name="Visitas" stroke="#fb923c" strokeWidth={3} dot={{ r: 4, fill: '#fb923c', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="events" name="Eventos" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap de Atividade */}
      <div className="bg-[#16161a]/90 border border-slate-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/5 pointer-events-none" />
        <h3 className="text-sm font-bold text-slate-100 mb-6 relative z-10">Heatmap de Atividade</h3>
        
        <div className="w-full overflow-x-auto relative z-10 pb-2">
          <div className="min-w-[800px]">
            {/* Header com as horas */}
            <div className="grid grid-cols-[50px_repeat(24,_1fr)] gap-1 mb-2">
              <div></div>
              {hours.map(h => (
                <div key={`h-${h}`} className="text-[10px] text-white text-center font-bold opacity-80">
                  {h}
                </div>
              ))}
            </div>

            {/* Linhas do Heatmap */}
            <div className="flex flex-col gap-1">
              {days.map((day, dIdx) => (
                <div key={day} className="grid grid-cols-[50px_repeat(24,_1fr)] gap-1 items-center">
                  <div className="text-xs text-white font-bold">{day}</div>
                  {hours.map(h => {
                    // Calculando intensidade real
                    const visitsInHour = data.visits.filter((v: any) => {
                      const d = new Date(v.visit_at);
                      return d.getDay() === dIdx && d.getHours() === h;
                    }).length;
                    
                    const eventsInHour = data.events.filter((e: any) => {
                      const d = new Date(e.event_at);
                      return d.getDay() === dIdx && d.getHours() === h;
                    }).length;

                    const intensity = visitsInHour + eventsInHour;
                    const hasActivity = intensity > 0;
                    
                    return (
                      <div 
                        key={`${day}-${h}`} 
                        className={`aspect-square rounded-md transition-colors duration-300 ${
                          hasActivity 
                            ? 'bg-[#ea580c] shadow-[0_0_15px_rgba(234,88,12,0.6)]' 
                            : 'bg-[#1e1e24] hover:bg-slate-700'
                        }`}
                        title={`${day} às ${h}h: ${intensity} ações`}
                        style={{ opacity: hasActivity ? Math.min(0.3 + (intensity * 0.2), 1) : 1 }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
