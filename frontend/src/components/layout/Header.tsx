import { ChevronDown, Building2 } from 'lucide-react';
import { useCompany } from '../../hooks/useData';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { data: company, isLoading } = useCompany();
  const { user } = useAuth();
  const userName = user?.email?.split('@')[0] || 'Admin';

  return (
    <header className="h-16 fixed top-0 right-0 left-[220px] glass z-10 flex items-center justify-between px-6">
      {/* Company Selector */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 cursor-pointer transition-colors">
        <Building2 className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-medium text-slate-200">
          {isLoading ? 'Carregando...' : company?.name || 'VivaTDAH'}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500 ml-1" />
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-slate-200 capitalize">{userName}</p>
          <p className="text-xs text-slate-400">Admin</p>
        </div>
        
        {/* Dropdown de Usuário */}
        <div className="flex items-center gap-2 group relative">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm cursor-pointer uppercase">
            {userName[0]}
          </div>
          
          <div className="absolute top-full mt-2 right-0 bg-[#16161a] border border-slate-700/50 rounded-lg shadow-xl py-2 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <button 
              onClick={() => supabase.auth.signOut()}
              className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-slate-800 transition-colors"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
