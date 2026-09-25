import React, { useState } from 'react';
import { ShieldCheck, Info, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { ConfidenceBreakdown } from '../types';

interface ConfidenceRingProps {
  score: number; // 0 to 1
  threshold?: number; // e.g. 0.88
  size?: number; // e.g. 80
  strokeWidth?: number; // e.g. 6
  breakdown?: ConfidenceBreakdown;
  showTooltip?: boolean;
}

export const ConfidenceRing: React.FC<ConfidenceRingProps> = ({
  score,
  threshold = 0.88,
  size = 72,
  strokeWidth = 6,
  breakdown,
  showTooltip = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, Math.round(score * 100)));
  const offset = circumference - (score * circumference);

  const isPassing = score >= threshold;
  const isModerate = score >= 0.70 && score < threshold;

  // Color selection
  let strokeColor = '#34D399'; // Emerald / Success
  let textColor = 'text-emerald-400';
  let glowClass = 'glow-green';
  let badgeLabel = 'Auto-Gate Eligible';

  if (!isPassing && isModerate) {
    strokeColor = '#FBBF24'; // Amber
    textColor = 'text-amber-400';
    glowClass = 'glow-amber';
    badgeLabel = 'Manual Review Req.';
  } else if (!isPassing && !isModerate) {
    strokeColor = '#F87171'; // Red
    textColor = 'text-red-400';
    glowClass = 'glow-red';
    badgeLabel = 'Low Confidence';
  }

  return (
    <div className="relative inline-flex items-center justify-center group">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="relative flex items-center justify-center focus:outline-none cursor-pointer rounded-full"
      >
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#21262D"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono text-sm font-bold ${textColor}`}>
            {percentage}%
          </span>
          <span className="text-[9px] uppercase tracking-wider text-[#8B949E] font-medium">
            Conf
          </span>
        </div>
      </button>

      {/* Interactive Tooltip Breakdown Popover */}
      {showTooltip && isOpen && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-72 p-3.5 bg-[#161B22] border border-[#30363D] rounded-xl shadow-2xl text-left pointer-events-auto backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#21262D]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F0F6FC]">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Confidence Formula</span>
            </div>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              isPassing ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              {badgeLabel}
            </span>
          </div>

          <div className="space-y-2 text-xs text-[#C9D1D9]">
            <div className="flex items-center justify-between">
              <span className="text-[#8B949E] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Sandbox Test Pass (60% wt)
              </span>
              <span className="font-mono text-[#F0F6FC]">
                +{breakdown ? (breakdown.testPassWeight * 100).toFixed(0) : '60'}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8B949E] flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-purple-400" />
                Gemini Self-Assessment (40% wt)
              </span>
              <span className="font-mono text-[#F0F6FC]">
                +{breakdown ? (breakdown.aiCertaintyWeight * 100).toFixed(0) : '38'}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8B949E] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Repo Path Risk Calibration
              </span>
              <span className="font-mono text-amber-400">
                {breakdown ? `${(breakdown.repoHistoryPenalty * 100).toFixed(0)}%` : '-2%'}
              </span>
            </div>

            <div className="pt-2 mt-1 border-t border-[#21262D] flex items-center justify-between font-medium">
              <span className="text-[#8B949E]">Repo Auto-Merge Threshold:</span>
              <span className="font-mono text-[#F0F6FC]">{(threshold * 100).toFixed(0)}%</span>
            </div>

            {breakdown?.rationale && (
              <p className="mt-2 text-[11px] leading-relaxed text-[#8B949E] italic bg-[#0D1117] p-2 rounded border border-[#21262D]">
                "{breakdown.rationale}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
