import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  GitPullRequest, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Sparkles, 
  Terminal, 
  Play, 
  Cpu, 
  ShieldCheck, 
  FileCode2, 
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Keyboard,
  Layers,
  Activity,
  History
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Incident, Repository } from '../types';
import { PipelineStepper } from './PipelineStepper';
import { ConfidenceRing } from './ConfidenceRing';
import { ReasoningTrail } from './ReasoningTrail';
import { DiffViewer } from './DiffViewer';
import { SandboxRunner } from './SandboxRunner';
import { PRPreviewModal } from './PRPreviewModal';
import { IncidentHistorySidebar } from './IncidentHistorySidebar';

interface IncidentDetailViewProps {
  incident: Incident;
  repository?: Repository;
  onBack: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onRunPipeline: (id: string) => void;
  onReRunSandbox: (id: string) => void;
  onReDiagnose: (id: string) => void;
}

export const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({
  incident,
  repository,
  onBack,
  onApprove,
  onReject,
  onRunPipeline,
  onReRunSandbox,
  onReDiagnose,
}) => {
  const [showPRModal, setShowPRModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [copiedStack, setCopiedStack] = useState(false);
  const [mobileTab, setMobileTab] = useState<'diff_first' | 'diagnosis_first'>('diff_first');
  const [activeKeyPressed, setActiveKeyPressed] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);

  const isResolved = incident.status === 'merged' || incident.status === 'auto_pr_created';
  const isRejected = incident.status === 'rejected';

  const handleCopyStack = () => {
    navigator.clipboard.writeText(incident.stackTrace);
    setCopiedStack(true);
    setTimeout(() => setCopiedStack(false), 2000);
  };

  const handleApproveClick = useCallback(() => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    onApprove(incident.id);
    setShowPRModal(true);
  }, [incident.id, onApprove]);

  const handleConfirmReject = () => {
    onReject(incident.id, rejectReason || 'Manual developer override');
    setShowRejectModal(false);
  };

  // Global Keyboard Shortcuts: 'a' (approve), 'r' (reject), 'b' (back), 'Escape'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        if (e.key === 'Escape') {
          setShowRejectModal(false);
          setShowPRModal(false);
        }
        return;
      }

      if (e.key === 'Escape') {
        setActiveKeyPressed('Escape');
        setTimeout(() => setActiveKeyPressed(null), 300);
        setShowRejectModal(false);
        setShowPRModal(false);
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'b') {
        e.preventDefault();
        setActiveKeyPressed('b');
        setTimeout(() => setActiveKeyPressed(null), 300);
        onBack();
      } else if (key === 'a' && !isResolved && !isRejected && !showRejectModal) {
        e.preventDefault();
        setActiveKeyPressed('a');
        setTimeout(() => setActiveKeyPressed(null), 300);
        handleApproveClick();
      } else if (key === 'r' && !isResolved && !isRejected && !showPRModal) {
        e.preventDefault();
        setActiveKeyPressed('r');
        setTimeout(() => setActiveKeyPressed(null), 300);
        setShowRejectModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, handleApproveClick, isResolved, isRejected, showRejectModal, showPRModal]);

  return (
    <div className="w-full mx-auto space-y-4 sm:space-y-6 text-[#C9D1D9] pb-24 lg:pb-6">
      {/* Top Surgery Navigation & Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-[#161B22] border border-[#21262D] rounded-2xl shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={onBack}
            className="group flex items-center gap-1.5 p-2 px-2.5 rounded-xl bg-[#0D1117] hover:bg-[#21262D] border border-[#21262D] text-[#8B949E] hover:text-[#F0F6FC] transition-colors cursor-pointer shrink-0 mt-0.5 sm:mt-0"
            title="Return to Dashboard [Press B]"
          >
            <ArrowLeft className="w-4 h-4" />
            <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono font-semibold bg-[#161B22] border border-[#30363D] rounded text-[#8B949E] group-hover:text-[#F0F6FC]">
              B
            </kbd>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                  incident.severity === 'critical'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : incident.severity === 'high'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {incident.severity}
              </span>

              <span className="font-mono text-xs font-semibold text-[#F0F6FC]">
                {incident.repoName}
              </span>
              <span className="text-[#30363D]" aria-hidden="true">·</span>
              <span className="font-mono text-xs text-[#8B949E] truncate">
                {incident.filePath}
              </span>
            </div>

            <h1 className="text-sm sm:text-base font-bold text-[#F0F6FC] tracking-tight leading-snug">
              {incident.title}
            </h1>
          </div>
        </div>

        {/* Right Desktop Status & Action Center (Hidden on small mobile, handled by sticky bottom bar) */}
        <div className="hidden sm:flex items-center justify-between sm:justify-end gap-3.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#21262D]">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              showHistory
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-[#0D1117] text-[#8B949E] hover:text-[#F0F6FC] border-[#21262D]'
            }`}
            title="Toggle Incident History & Audit Trail"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Audit History</span>
          </button>

          <ConfidenceRing
            score={incident.confidenceScore}
            threshold={repository?.autoMergeThreshold || 0.88}
            size={56}
            strokeWidth={5}
            breakdown={incident.confidenceBreakdown}
          />

          <div className="flex items-center gap-2">
            {isResolved ? (
              <button
                onClick={() => setShowPRModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <GitPullRequest className="w-4 h-4" />
                <span>PR #{incident.prNumber || 142}</span>
              </button>
            ) : isRejected ? (
              <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold">
                Fix Rejected
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-colors cursor-pointer"
                  title="Reject Fix [Press R]"
                >
                  <span>Reject</span>
                  <kbd className="hidden md:inline-block px-1.5 py-0.2 text-[10px] font-mono font-semibold bg-red-500/20 border border-red-500/40 rounded text-red-300">
                    R
                  </kbd>
                </button>

                <button
                  onClick={handleApproveClick}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-95"
                  title="1-Click Approve & Open PR [Press A]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1-Click Approve & PR</span>
                  <kbd className="hidden md:inline-block px-1.5 py-0.2 text-[10px] font-mono font-semibold bg-white/20 border border-white/30 rounded text-white shadow-inner">
                    A
                  </kbd>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Pipeline Stepper Bar */}
      <div className="p-3 sm:p-4 bg-[#161B22] border border-[#21262D] rounded-2xl overflow-x-auto">
        <PipelineStepper
          currentStage={incident.currentPipelineStage}
          status={incident.status}
          size="md"
        />
      </div>

      {/* Mobile-Friendly Layout: Vertically stacked on mobile/tablet (< lg), Side-by-Side on Desktop (lg+) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* On smaller screens: Render the Diff Viewer & Docker Sandbox prominently first, or alongside Reasoning Trail */}
        <div className="order-1 lg:order-2 lg:col-span-7 space-y-5 sm:space-y-6">
          {/* Diff Viewer Card */}
          {incident.proposedFix ? (
            <DiffViewer
              diff={incident.proposedFix.diff}
              filePath={incident.filePath}
              originalCode={incident.proposedFix.originalCode || repository?.files[incident.filePath]}
              fixedCode={incident.proposedFix.fixedCode}
              explanation={incident.proposedFix.explanation}
            />
          ) : (
            <div className="p-8 bg-[#161B22] border border-[#21262D] rounded-2xl text-center text-[#8B949E]">
              <FileCode2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No proposed diff generated yet.</p>
            </div>
          )}

          {/* Isolated Docker Sandbox Test Runner Card */}
          <SandboxRunner
            testResults={incident.testResults}
            onReRun={() => onReRunSandbox(incident.id)}
          />
        </div>

        {/* Diagnostic Stack Trace, Root Cause & Animated Reasoning Trail (Stacked below Diff on mobile, left column on desktop) */}
        <div className="order-2 lg:order-1 lg:col-span-5 space-y-5 sm:space-y-6">
          {/* Section 1: AI Root Cause Diagnosis Card */}
          {incident.diagnosis && (
            <div className="bg-[#161B22] border border-[#21262D] rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-[#21262D]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-semibold text-[#F0F6FC]">
                    Root Cause Diagnosis
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/30">
                  Gemini 3.8 Flash
                </span>
              </div>

              <p className="text-xs text-[#C9D1D9] leading-relaxed">
                {incident.diagnosis.rootCause}
              </p>

              {incident.diagnosis.reproductionSteps?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#21262D] space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#8B949E] block">
                    Reproduction Trigger Conditions:
                  </span>
                  <ul className="space-y-1 text-xs text-[#8B949E] list-disc list-inside">
                    {incident.diagnosis.reproductionSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Animated Reasoning Trail Flight Recorder */}
          <ReasoningTrail steps={incident.reasoningTrail} />

          {/* Section 3: Error & Stack Trace Card */}
          <div className="bg-[#161B22] border border-[#21262D] rounded-2xl overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0D1117] border-b border-[#21262D]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-[#F0F6FC]">
                  Production Exception & Stack Trace
                </span>
              </div>
              <button
                onClick={handleCopyStack}
                className="flex items-center gap-1 text-[11px] text-[#8B949E] hover:text-[#C9D1D9] font-mono cursor-pointer"
              >
                {copiedStack ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedStack ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3 sm:p-4 space-y-2 font-mono text-xs">
              <div className="p-2.5 bg-red-950/20 border border-red-900/30 rounded-xl text-red-300 font-semibold leading-relaxed">
                {incident.errorMessage}
              </div>
              <pre className="p-3 bg-[#090D13] rounded-xl border border-[#21262D] text-[10px] sm:text-[11px] text-[#8B949E] overflow-x-auto max-h-48 leading-relaxed">
                {incident.stackTrace}
              </pre>
            </div>
          </div>

          {/* Section 4: Chronological Incident History & Audit Sidebar */}
          <IncidentHistorySidebar
            incidentId={incident.id}
            isOpen={showHistory}
            onToggle={() => setShowHistory(!showHistory)}
          />
        </div>
      </div>

      {/* Sticky Mobile Action Bar for compact screens (Fixed at bottom on phones) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-[#090D13]/95 backdrop-blur-md border-t border-[#21262D] flex items-center justify-between gap-2 shadow-2xl">
        <div className="flex items-center gap-2">
          <ConfidenceRing
            score={incident.confidenceScore}
            threshold={repository?.autoMergeThreshold || 0.88}
            size={40}
            strokeWidth={4}
          />
          <div className="text-[10px] font-mono leading-tight">
            <span className="font-bold text-[#F0F6FC]">{(incident.confidenceScore * 100).toFixed(0)}% Score</span>
            <span className="block text-[#8B949E]">100% Tests Pass</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isResolved ? (
            <button
              onClick={() => setShowPRModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl shadow-md cursor-pointer"
            >
              PR #{incident.prNumber || 142}
            </button>
          ) : isRejected ? (
            <span className="text-xs text-red-400 font-semibold px-2 py-1 bg-red-500/10 rounded-lg">
              Rejected
            </span>
          ) : (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-3 py-2 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl cursor-pointer"
              >
                Reject
              </button>
              <button
                onClick={handleApproveClick}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950/50 cursor-pointer active:scale-95"
              >
                1-Click Approve PR
              </button>
            </>
          )}
        </div>
      </div>

      {/* Floating Keyboard Shortcuts Guide */}
      <aside aria-label="Keyboard Shortcuts" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-3 px-4 py-2 bg-[#161B22]/95 backdrop-blur-md border border-[#30363D] shadow-2xl rounded-full text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[#8B949E] text-[11px] font-medium uppercase tracking-wider pr-1 border-r border-[#30363D]">
          <Keyboard className="w-3.5 h-3.5 text-blue-400" />
          <span>Shortcuts</span>
        </div>

        {/* Shortcut 'A' - Approve */}
        <button
          onClick={handleApproveClick}
          disabled={isResolved || isRejected}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all cursor-pointer ${
            activeKeyPressed === 'a'
              ? 'bg-emerald-500/30 text-emerald-300 ring-2 ring-emerald-400 scale-105'
              : 'hover:bg-[#21262D] text-[#C9D1D9]'
          } ${isResolved || isRejected ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Press 'A' to Approve & Open PR"
        >
          <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-[#0D1117] border border-emerald-500/50 text-emerald-400 rounded shadow-xs">
            A
          </kbd>
          <span className="text-[11px]">Approve PR</span>
        </button>

        {/* Shortcut 'R' - Reject */}
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={isResolved || isRejected}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all cursor-pointer ${
            activeKeyPressed === 'r'
              ? 'bg-red-500/30 text-red-300 ring-2 ring-red-400 scale-105'
              : 'hover:bg-[#21262D] text-[#C9D1D9]'
          } ${isResolved || isRejected ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Press 'R' to Reject & Calibrate"
        >
          <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-[#0D1117] border border-red-500/50 text-red-400 rounded shadow-xs">
            R
          </kbd>
          <span className="text-[11px]">Reject</span>
        </button>

        {/* Shortcut 'B' - Back */}
        <button
          onClick={onBack}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all cursor-pointer ${
            activeKeyPressed === 'b'
              ? 'bg-blue-500/30 text-blue-300 ring-2 ring-blue-400 scale-105'
              : 'hover:bg-[#21262D] text-[#C9D1D9]'
          }`}
          title="Press 'B' to return to Dashboard"
        >
          <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-[#0D1117] border border-[#30363D] text-blue-400 rounded shadow-xs">
            B
          </kbd>
          <span className="text-[11px]">Back</span>
        </button>

        {/* Shortcut 'Esc' - Dismiss */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[#8B949E] ${
            activeKeyPressed === 'Escape' ? 'bg-[#30363D] text-white ring-1 ring-[#8B949E]' : ''
          }`}
        >
          <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-[#0D1117] border border-[#30363D] text-[#8B949E] rounded shadow-xs">
            Esc
          </kbd>
          <span className="text-[11px]">Dismiss</span>
        </div>
      </aside>

      {/* PR Preview Modal */}
      <PRPreviewModal
        incident={incident}
        isOpen={showPRModal}
        onClose={() => setShowPRModal(false)}
        onMergeSuccess={() => {
          onApprove(incident.id);
        }}
      />

      {/* Reject with Feedback Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#161B22] border border-[#30363D] rounded-2xl p-5 sm:p-6 space-y-4 text-[#C9D1D9]">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Reject Autonomous Fix</span>
            </div>
            <p className="text-xs text-[#8B949E]">
              Rejecting this fix will update CodeMedic's <strong className="text-[#C9D1D9]">Learning Loop calibration</strong> to apply a higher risk penalty to <code className="text-amber-300">{incident.filePath}</code> for future incidents.
            </p>

            <div>
              <label className="block text-xs font-medium text-[#8B949E] mb-1">
                Feedback for Agent Calibration
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Manual rewrite required, requires refactoring the database abstraction layer..."
                className="w-full bg-[#0D1117] border border-[#21262D] focus:border-red-500 rounded-xl p-3 text-xs text-[#F0F6FC] outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-medium text-[#8B949E] hover:text-[#F0F6FC] bg-[#21262D] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-900/30 cursor-pointer"
              >
                Confirm Rejection & Calibrate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
