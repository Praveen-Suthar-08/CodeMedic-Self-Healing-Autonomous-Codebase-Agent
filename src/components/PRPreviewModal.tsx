import React, { useState } from 'react';
import { 
  GitPullRequest, 
  GitBranch, 
  Check, 
  ExternalLink, 
  X, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Incident } from '../types';

interface PRPreviewModalProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onMergeSuccess?: () => void;
}

export const PRPreviewModal: React.FC<PRPreviewModalProps> = ({
  incident,
  isOpen,
  onClose,
  onMergeSuccess,
}) => {
  const [merged, setMerged] = useState(incident.status === 'merged');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const prNumber = incident.prNumber || 145;
  const branchName = incident.branchName || `codemedic/fix-${incident.id}`;
  const prUrl = incident.prUrl || `https://github.com/acme-corp/${incident.repoName}/pull/${prNumber}`;

  const handleMerge = () => {
    setMerged(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#34D399', '#60A5FA', '#A78BFA', '#FBBF24'],
    });
    onMergeSuccess?.();
  };

  const handleCopyBranch = () => {
    navigator.clipboard.writeText(`git checkout -b ${branchName} && git pull origin ${branchName}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl overflow-hidden text-[#C9D1D9]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0D1117] border-b border-[#21262D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#F0F6FC] flex items-center gap-2">
                GitHub Pull Request #{prNumber}
                {merged ? (
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">
                    Merged to main
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                    Open · Ready for Review
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#8B949E] font-mono">
                {incident.repoName} · {branchName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PR Body Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* PR Title */}
          <div>
            <label className="text-[11px] font-semibold text-[#8B949E] uppercase tracking-wider block mb-1">
              Pull Request Title
            </label>
            <div className="p-3 bg-[#0D1117] border border-[#21262D] rounded-lg font-mono text-xs text-[#F0F6FC] font-medium">
              [CodeMedic Fix] {incident.proposedFix?.patchSummary || incident.title}
            </div>
          </div>

          {/* Branch info */}
          <div className="flex items-center justify-between p-3 bg-[#090D13] border border-[#21262D] rounded-lg text-xs">
            <div className="flex items-center gap-2 font-mono text-[#8B949E]">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span>Branch: </span>
              <span className="text-[#F0F6FC] font-semibold">{branchName}</span>
            </div>

            <button
              onClick={handleCopyBranch}
              className="flex items-center gap-1 text-[11px] text-[#8B949E] hover:text-[#C9D1D9] font-mono"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy git command'}
            </button>
          </div>

          {/* PR Description Markdown preview */}
          <div>
            <label className="text-[11px] font-semibold text-[#8B949E] uppercase tracking-wider block mb-1">
              Autonomous Generated Description (Markdown)
            </label>
            <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-lg text-xs space-y-3 font-sans">
              <div>
                <h4 className="font-semibold text-[#F0F6FC] mb-1">🏥 CodeMedic Diagnostic Overview</h4>
                <p className="text-[#8B949E] leading-relaxed">
                  This pull request was automatically generated by <strong className="text-[#C9D1D9]">CodeMedic Autonomous Agent</strong> following an uncaught production exception.
                </p>
              </div>

              <div className="p-3 bg-[#161B22] rounded border border-[#21262D]">
                <span className="font-semibold text-purple-300 block mb-1">Root Cause Diagnosis:</span>
                <p className="text-[#8B949E] text-[11px] leading-relaxed">
                  {incident.diagnosis?.rootCause || 'Synchronous execution defect resolved via defensive patch.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-[#161B22] rounded border border-[#21262D]">
                  <span className="text-[#8B949E] block">Confidence Score:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {(incident.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="p-2.5 bg-[#161B22] rounded border border-[#21262D]">
                  <span className="text-[#8B949E] block">Sandbox Tests:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {incident.testResults?.passed || 2} Passed · 0 Failed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0D1117] border-t border-[#21262D]">
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#8B949E] hover:text-[#F0F6FC] transition-colors"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8B949E] hover:text-[#F0F6FC] bg-[#21262D] hover:bg-[#30363D] rounded-lg transition-colors"
            >
              Close
            </button>

            {!merged && (
              <button
                onClick={handleMerge}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Merge PR
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
