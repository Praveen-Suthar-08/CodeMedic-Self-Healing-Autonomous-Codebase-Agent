import React from 'react';
import { Activity, ShieldCheck, Cpu } from 'lucide-react';

interface HeartbeatMonitorProps {
  statusText?: string;
  isHealing?: boolean;
  incidentCount?: number;
}

export const HeartbeatMonitor: React.FC<HeartbeatMonitorProps> = ({
  statusText = 'Codebase Autonomous Pulse Normal',
  isHealing = false,
  incidentCount = 0,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#090D13]/80 border border-[#21262D] rounded-xl text-xs text-[#8B949E]">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-6 h-6">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
              isHealing ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isHealing ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-[#C9D1D9]">
            {isHealing ? 'CodeMedic Active Operation' : 'CodeMedic Autonomous Sentry'}
          </span>
          <span className="text-[#30363D]" aria-hidden="true">·</span>
          <span className="text-[#8B949E]">{statusText}</span>
        </div>
      </div>

      {/* Animated ECG Waveform */}
      <div className="hidden md:flex items-center gap-4">
        <div className="w-32 h-6 overflow-hidden flex items-center opacity-85">
          <svg className="w-full h-full text-emerald-400" viewBox="0 0 160 24" fill="none">
            <path
              d="M0,12 L30,12 L36,12 L40,4 L44,20 L48,10 L52,14 L56,12 L90,12 L96,12 L100,2 L104,22 L108,8 L112,16 L116,12 L160,12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
            />
          </svg>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-[#8B949E]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Sandbox Isolated
          </span>
          <span className="text-[#30363D]" aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            Gemini 3.8 Flash
          </span>
          <span className="text-[#30363D]" aria-hidden="true">·</span>
          <span className="text-emerald-400 font-medium">
            {incidentCount} Tracked
          </span>
        </div>
      </div>
    </div>
  );
};
