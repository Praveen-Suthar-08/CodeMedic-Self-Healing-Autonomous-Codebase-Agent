import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Search, 
  Terminal, 
  AlertCircle, 
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { ReasoningStep } from '../types';

interface ReasoningTrailProps {
  steps: ReasoningStep[];
  isStreaming?: boolean;
}

export const ReasoningTrail: React.FC<ReasoningTrailProps> = ({
  steps,
  isStreaming = false,
}) => {
  const [revealedChars, setRevealedChars] = useState<Record<string, number>>({});
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Typewriter effect for steps
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    steps.forEach((step) => {
      const textLen = step.thought.length;
      if ((revealedChars[step.id] || 0) < textLen) {
        let count = 0;
        const interval = setInterval(() => {
          count += 6;
          setRevealedChars((prev) => ({
            ...prev,
            [step.id]: Math.min(count, textLen),
          }));
          if (count >= textLen) {
            clearInterval(interval);
          }
        }, 15);
        intervals.push(interval);
      }
    });

    return () => {
      intervals.forEach((i) => clearInterval(i));
    };
  }, [steps]);

  return (
    <div className="bg-[#0D1117] border border-[#21262D] rounded-xl p-5 shadow-inner">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#21262D]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-[#F0F6FC] tracking-tight">
            Autonomous Reasoning Trail
          </h3>
          <span className="text-xs text-[#8B949E] font-normal">
            (Gemini 3.8 Flash Execution Log)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8B949E]">
          <span className="flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 text-purple-400" />
            {steps.reduce((acc, s) => acc + (s.durationMs || 0), 0)}ms total
          </span>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#21262D]">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isFailed = step.status === 'failed';
          const displayedThought = step.thought.slice(0, revealedChars[step.id] || step.thought.length);
          const isTyping = (revealedChars[step.id] || 0) < step.thought.length;
          const isExpanded = expandedStep === step.id;

          let iconBg = 'bg-[#161B22] border-[#30363D] text-[#8B949E]';
          if (isCompleted) iconBg = 'bg-[#0D1117] border-emerald-500 text-emerald-400';
          else if (isActive) iconBg = 'bg-blue-500/20 border-blue-400 text-blue-400 glow-blue animate-pulse';
          else if (isFailed) iconBg = 'bg-red-500/20 border-red-500 text-red-400 glow-red';

          return (
            <div key={step.id} className="relative group">
              {/* Timeline Bullet Node */}
              <div
                className={`absolute -left-6 top-0.5 flex items-center justify-center w-5 h-5 rounded-full border transition-all duration-300 ${iconBg}`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : isFailed ? (
                  <AlertCircle className="w-3 h-3 text-red-400" />
                ) : (
                  <Circle className="w-2.5 h-2.5 fill-current" />
                )}
              </div>

              {/* Step Content */}
              <div className="bg-[#161B22]/70 hover:bg-[#161B22] transition-colors border border-[#21262D] rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#F0F6FC]">
                      {step.step}
                    </span>
                    {isActive && (
                      <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 rounded animate-pulse">
                        Thinking...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#8B949E] font-mono">
                    <span>{step.durationMs}ms</span>
                    <span aria-hidden="true">·</span>
                    <span>{step.timestamp}</span>
                  </div>
                </div>

                {/* Animated Thought Body */}
                <p className="text-xs text-[#C9D1D9] leading-relaxed font-sans font-normal">
                  {displayedThought}
                  {isTyping && (
                    <span className="inline-block w-1.5 h-3.5 bg-blue-400 ml-1 animate-pulse align-middle" />
                  )}
                </p>

                {/* Evidence / Code Attachment Tag */}
                {step.evidence && (
                  <div className="mt-2 pt-2 border-t border-[#21262D]/60 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1 text-[#8B949E] font-mono truncate">
                      <Search className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="text-[#8B949E]">Evidence:</span>
                      <span className="text-[#C9D1D9] truncate">{step.evidence}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
