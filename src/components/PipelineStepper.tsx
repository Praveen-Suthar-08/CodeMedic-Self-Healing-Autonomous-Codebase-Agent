import React from 'react';
import { 
  Radio, 
  FileCode2, 
  Cpu, 
  Sparkles, 
  FlaskConical, 
  ShieldCheck, 
  GitPullRequest,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { IncidentStatus } from '../types';

interface PipelineStepperProps {
  currentStage: number; // 0 to 6
  status: IncidentStatus;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onStepClick?: (stageIndex: number) => void;
}

export const PIPELINE_STAGES = [
  { id: 0, key: 'ingest', label: '1. Ingest', icon: Radio, desc: 'Error Ingestion' },
  { id: 1, key: 'context', label: '2. Context', icon: FileCode2, desc: 'Repo AST Fetch' },
  { id: 2, key: 'diagnose', label: '3. Diagnose', icon: Cpu, desc: 'Gemini Analysis' },
  { id: 3, key: 'generate_fix', label: '4. Fix', icon: Sparkles, desc: 'Unified Diff' },
  { id: 4, key: 'sandbox', label: '5. Test', icon: FlaskConical, desc: 'Docker Sandbox' },
  { id: 5, key: 'gate', label: '6. Gate', icon: ShieldCheck, desc: 'Confidence Safety' },
  { id: 6, key: 'pr', label: '7. PR', icon: GitPullRequest, desc: 'GitHub Merge' },
];

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  currentStage,
  status,
  size = 'md',
  interactive = false,
  onStepClick,
}) => {
  const isRejected = status === 'rejected';
  const isMerged = status === 'merged' || status === 'auto_pr_created';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 bg-[#21262D] -z-0" />
        
        {/* Active Progress Fill Line */}
        <div 
          className={`absolute left-3 top-1/2 -translate-y-1/2 h-0.5 -z-0 transition-all duration-500 ${
            isRejected ? 'bg-red-500/80' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400'
          }`}
          style={{
            width: `${Math.min(100, Math.max(0, (currentStage / (PIPELINE_STAGES.length - 1)) * 100))}%`,
          }}
        />

        {PIPELINE_STAGES.map((stage) => {
          const isCompleted = currentStage > stage.id || isMerged;
          const isActive = currentStage === stage.id && !isMerged && !isRejected;
          const isCurrentFailed = isRejected && currentStage === stage.id;
          const Icon = stage.icon;

          let nodeBg = 'bg-[#161B22] border-[#30363D] text-[#8B949E]';
          if (isCompleted) {
            nodeBg = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400';
          } else if (isActive) {
            if (stage.id === 2) nodeBg = 'bg-blue-500/20 border-blue-400 text-blue-400 glow-blue animate-pulse';
            else if (stage.id === 3) nodeBg = 'bg-purple-500/20 border-purple-400 text-purple-400 glow-purple animate-pulse';
            else if (stage.id === 4) nodeBg = 'bg-amber-500/20 border-amber-400 text-amber-400 glow-amber animate-pulse';
            else nodeBg = 'bg-blue-500/20 border-blue-400 text-blue-400 animate-pulse';
          } else if (isCurrentFailed) {
            nodeBg = 'bg-red-500/20 border-red-500 text-red-400 glow-red';
          }

          return (
            <button
              key={stage.id}
              disabled={!interactive}
              onClick={() => onStepClick?.(stage.id)}
              className={`relative z-10 flex flex-col items-center group focus:outline-none ${
                interactive ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className={`flex items-center justify-center rounded-lg border transition-all duration-300 ${nodeBg} ${
                  size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                ) : isCurrentFailed ? (
                  <AlertCircle className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                ) : (
                  <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                )}
              </div>

              {size !== 'sm' && (
                <div className="mt-1.5 text-center">
                  <span
                    className={`block text-[11px] font-medium leading-tight ${
                      isActive
                        ? 'text-[#F0F6FC]'
                        : isCompleted
                        ? 'text-[#C9D1D9]'
                        : 'text-[#8B949E]'
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span className="hidden sm:block text-[9px] text-[#8B949E] opacity-75">
                    {stage.desc}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
