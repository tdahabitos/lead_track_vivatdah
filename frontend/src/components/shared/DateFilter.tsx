import { Filter } from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';

export function DateFilter() {
  const { days, setDays } = useFilter();

  const options = [
    { label: 'Últimos 7 dias', value: 7 },
    { label: 'Últimos 30 dias', value: 30 },
    { label: 'Últimos 90 dias', value: 90 },
    { label: 'Todo o período', value: 3650 }
  ];

  return (
    <div className="relative inline-block text-left">
      <select
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
        className="appearance-none bg-[#16161a] border border-slate-700 hover:border-indigo-500/50 text-white text-sm font-medium pl-10 pr-8 py-2 rounded-xl transition-all cursor-pointer focus:ring-2 focus:ring-indigo-500/20 outline-none"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[#16161a]">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Filter className="w-4 h-4 text-slate-400" />
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
