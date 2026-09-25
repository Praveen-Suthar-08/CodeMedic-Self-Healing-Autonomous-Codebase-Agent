import React from 'react';
import { 
  Activity, 
  Layers, 
  Smartphone, 
  BarChart3, 
  Settings, 
  PlusCircle, 
  GitPullRequest,
  Cpu,
  Radio
} from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'detail' | 'analytics' | 'android' | 'settings';
  onSelectView: (view: 'dashboard' | 'detail' | 'analytics' | 'android' | 'settings') => void;
  onOpenIngest: () => void;
  activeIncidentCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  onOpenIngest,
  activeIncidentCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D13]/90 backdrop-blur-md border-b border-[#21262D]">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 h-16 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onSelectView('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/30 group-hover:scale-105 transition-transform">
              <span className="text-lg">🩺</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#090D13] rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-[#F0F6FC]">
                  CodeMedic
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Agentic AI
                </span>
              </div>
              <span className="text-[11px] text-[#8B949E] hidden sm:block">
                Self-Healing Codebase Agent
              </span>
            </div>
          </button>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-[#161B22] border border-[#21262D] rounded-xl text-xs font-medium">
            <button
              onClick={() => onSelectView('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-[#21262D] text-[#F0F6FC] shadow-sm font-semibold'
                  : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Incidents
              {activeIncidentCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-mono">
                  {activeIncidentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectView('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentView === 'analytics'
                  ? 'bg-[#21262D] text-[#F0F6FC] shadow-sm font-semibold'
                  : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Admin Analytics
            </button>

            <button
              onClick={() => onSelectView('android')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentView === 'android'
                  ? 'bg-[#21262D] text-[#F0F6FC] shadow-sm font-semibold'
                  : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              Android On-Call
            </button>

            <button
              onClick={() => onSelectView('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentView === 'settings'
                  ? 'bg-[#21262D] text-[#F0F6FC] shadow-sm font-semibold'
                  : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Repo Policy
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenIngest}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-900/30 transition-all cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ingest Error</span>
          </button>
        </div>
      </div>
    </header>
  );
};
