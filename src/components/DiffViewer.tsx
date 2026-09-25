import React, { useState } from 'react';
import { Columns, AlignJustify, Copy, Check, FileCode, Sparkles, Smartphone } from 'lucide-react';

interface DiffViewerProps {
  diff: string;
  filePath: string;
  originalCode?: string;
  fixedCode?: string;
  explanation?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diff,
  filePath,
  originalCode,
  fixedCode,
  explanation,
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(fixedCode || diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split lines for side-by-side
  const origLines = (originalCode || '').split('\n');
  const fixLines = (fixedCode || '').split('\n');

  return (
    <div className="bg-[#0D1117] border border-[#21262D] rounded-2xl overflow-hidden shadow-xl">
      {/* Diff Header */}
      <div className="flex flex-wrap items-center justify-between px-3.5 sm:px-4 py-3 bg-[#161B22] border-b border-[#21262D] gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="font-mono text-xs font-semibold text-[#F0F6FC] truncate">
            {filePath}
          </span>
          <span className="text-[10px] text-[#8B949E] px-2 py-0.5 rounded bg-[#21262D]/60 font-mono shrink-0 hidden sm:inline-block">
            {fixLines.length} lines
          </span>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View mode toggle - side-by-side disabled on small screens to ensure readability */}
          <div className="hidden sm:flex items-center p-0.5 bg-[#090D13] border border-[#21262D] rounded-xl">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                viewMode === 'side-by-side'
                  ? 'bg-[#21262D] text-[#F0F6FC] shadow-sm'
                  : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                viewMode === 'unified'
                  ? 'bg-[#21262D] text-[#F0F6FC] shadow-sm'
                  : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span>Unified</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#8B949E] hover:text-[#C9D1D9] bg-[#161B22] border border-[#30363D] hover:border-[#8B949E] rounded-xl transition-colors cursor-pointer"
            title="Copy Proposed Fix"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Explanation Banner */}
      {explanation && (
        <div className="px-3.5 sm:px-4 py-2.5 bg-purple-950/20 border-b border-purple-900/30 flex items-start gap-2 text-xs text-[#C9D1D9]">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-purple-300">Patch Rationale: </span>
            <span>{explanation}</span>
          </div>
        </div>
      )}

      {/* Diff Content Area */}
      <div className="overflow-x-auto text-[11px] sm:text-xs font-mono">
        {/* Desktop Side-by-Side (hidden on mobile) */}
        {viewMode === 'side-by-side' && originalCode && fixedCode ? (
          <div className="hidden sm:grid grid-cols-2 divide-x divide-[#21262D] min-w-[640px]">
            {/* Left: Original Code */}
            <div className="p-3 bg-[#0D1117]">
              <div className="pb-2 mb-2 border-b border-[#21262D] text-[11px] font-semibold text-red-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Original (Defective Line)
              </div>
              <div className="space-y-0.5">
                {origLines.map((line, idx) => {
                  const isModified = !fixLines.includes(line);
                  return (
                    <div
                      key={idx}
                      className={`flex items-start px-1.5 py-0.5 rounded ${
                        isModified ? 'diff-deletion text-red-300 bg-red-950/40' : 'text-[#8B949E]'
                      }`}
                    >
                      <span className="w-7 select-none text-right pr-2.5 text-[#484F58] font-mono text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="whitespace-pre flex-1 overflow-x-auto">{line || ' '}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Fixed Code */}
            <div className="p-3 bg-[#0D1117]">
              <div className="pb-2 mb-2 border-b border-[#21262D] text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Proposed Fix Patch
              </div>
              <div className="space-y-0.5">
                {fixLines.map((line, idx) => {
                  const isModified = !origLines.includes(line);
                  return (
                    <div
                      key={idx}
                      className={`flex items-start px-1.5 py-0.5 rounded ${
                        isModified ? 'diff-addition text-emerald-300 font-medium bg-emerald-950/40' : 'text-[#C9D1D9]'
                      }`}
                    >
                      <span className="w-7 select-none text-right pr-2.5 text-[#484F58] font-mono text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="whitespace-pre flex-1 overflow-x-auto">{line || ' '}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Unified View (Always rendered on mobile or when selected on desktop) */}
        <div className={`${viewMode === 'side-by-side' ? 'block sm:hidden' : 'block'} p-3 sm:p-4 bg-[#090D13]`}>
          <div className="sm:hidden pb-2 mb-2 border-b border-[#21262D] text-[10px] text-[#8B949E] flex items-center justify-between">
            <span className="font-semibold text-[#F0F6FC]">Compact Mobile Diff</span>
            <span className="text-emerald-400 font-mono">+ additions / - deletions</span>
          </div>

          <pre className="text-[11px] sm:text-xs text-[#C9D1D9] leading-relaxed whitespace-pre font-mono overflow-x-auto">
            {diff.split('\n').map((line, i) => {
              let lineClass = 'text-[#8B949E] px-1.5 py-0.5 block';
              if (line.startsWith('+')) {
                lineClass = 'diff-addition text-emerald-300 font-semibold px-2 py-0.5 block bg-emerald-950/30 rounded';
              } else if (line.startsWith('-')) {
                lineClass = 'diff-deletion text-red-300 px-2 py-0.5 block bg-red-950/30 rounded';
              } else if (line.startsWith('@@')) {
                lineClass = 'text-blue-400 bg-blue-950/40 px-2 py-0.5 block font-semibold rounded my-1';
              }
              return (
                <span key={i} className={lineClass}>
                  {line}
                </span>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
};
