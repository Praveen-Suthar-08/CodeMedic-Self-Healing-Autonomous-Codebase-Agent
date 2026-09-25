import React, { useState, useRef } from 'react';
import { 
  Smartphone, 
  Bell, 
  ShieldCheck, 
  Check, 
  X, 
  GitPullRequest, 
  Wifi, 
  WifiOff, 
  Battery, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Terminal,
  Activity,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Incident } from '../types';

interface AndroidCompanionProps {
  incident?: Incident;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export const AndroidCompanion: React.FC<AndroidCompanionProps> = ({
  incident,
  onApprove,
  onReject,
}) => {
  const [offlineMode, setOfflineMode] = useState(false);
  const [swipeState, setSwipeState] = useState<'idle' | 'swiping_approve' | 'swiping_reject' | 'approved' | 'rejected'>('idle');
  const [showNotification, setShowNotification] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-[#8B949E]">
        <Smartphone className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-xs">No active incident selected for mobile review.</p>
      </div>
    );
  }

  const handleApprove = () => {
    setSwipeState('approved');
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#34D399', '#60A5FA', '#A78BFA'],
    });
    setTimeout(() => {
      onApprove(incident.id);
    }, 600);
  };

  const handleReject = () => {
    setSwipeState('rejected');
    setTimeout(() => {
      onReject(incident.id, 'Rejected via On-Call Mobile Review');
    }, 600);
  };

  // Drag Gesture Simulation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startXRef.current;
    setDragOffset(Math.max(-120, Math.min(120, diff)));
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 70) {
      handleApprove();
    } else if (dragOffset < -70) {
      handleReject();
    }
    setDragOffset(0);
  };

  const isResolved = incident.status === 'merged' || incident.status === 'auto_pr_created';

  return (
    <div className="flex flex-col items-center justify-center py-2 select-none">
      {/* Android Device Frame */}
      <div 
        className="w-[350px] bg-[#090D13] border-[7px] border-[#21262D] rounded-[44px] shadow-2xl shadow-blue-950/20 overflow-hidden relative text-[#C9D1D9] flex flex-col h-[700px] transition-all"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Status Bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-mono text-[#8B949E] bg-[#090D13] shrink-0">
          <span>02:14</span>
          {/* Camera Notch & Speaker */}
          <div className="w-20 h-4 bg-[#161B22] rounded-full mx-auto flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#0D1117]" />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setOfflineMode(!offlineMode)}
              title="Toggle Offline Simulation"
              className="focus:outline-none cursor-pointer"
            >
              {offlineMode ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-[#8B949E]" />}
            </button>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Push Notification Banner */}
        {showNotification && (
          <div className="mx-3 my-2 p-2.5 bg-[#161B22] border border-blue-500/40 rounded-2xl shadow-lg animate-fadeIn flex items-start gap-2.5 text-xs">
            <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] text-[#8B949E]">
                <span className="font-semibold text-blue-400 font-mono">CodeMedic · 2 AM Alert</span>
                <button onClick={() => setShowNotification(false)} className="text-[#8B949E] hover:text-white cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] font-semibold text-[#F0F6FC] mt-0.5">
                {incident.severity.toUpperCase()} defect diagnosed in {incident.repoName}
              </p>
              <p className="text-[10px] text-[#8B949E] font-mono mt-0.5 truncate">
                Confidence: {(incident.confidenceScore * 100).toFixed(0)}% · 100% Tests Pass
              </p>
            </div>
          </div>
        )}

        {/* Offline queue indicator */}
        {offlineMode && (
          <div className="px-4 py-1.5 bg-amber-950/40 border-b border-amber-900/40 text-[10px] text-amber-300 flex items-center justify-between font-mono">
            <span>Room DB Offline Queue Active</span>
            <span className="font-bold">1 Pending</span>
          </div>
        )}

        {/* Main App Bar */}
        <div className="px-4 py-2.5 bg-[#161B22] border-b border-[#21262D] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              🩺
            </div>
            <div>
              <span className="block text-xs font-semibold text-[#F0F6FC]">
                CodeMedic On-Call
              </span>
              <span className="block text-[9px] font-mono text-[#8B949E]">
                {incident.repoName}
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {(incident.confidenceScore * 100).toFixed(0)}% Conf
          </span>
        </div>

        {/* Swipeable / Scrollable Mobile Incident Review Area */}
        <div 
          className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs cursor-grab active:cursor-grabbing transition-transform"
          style={{
            transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`,
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Card: Error Summary */}
          <div className="p-3 bg-[#161B22] rounded-2xl border border-[#21262D]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-mono font-bold text-red-400">
                {incident.severity} exception
              </span>
              <span className="text-[10px] text-[#8B949E] font-mono truncate max-w-[150px]">
                {incident.filePath}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#F0F6FC] leading-snug">
              {incident.title}
            </p>
          </div>

          {/* Card: Diagnosis */}
          {incident.diagnosis && (
            <div className="p-3 bg-[#161B22] rounded-2xl border border-[#21262D] space-y-1">
              <span className="text-[10px] font-semibold text-purple-300 block">
                🧠 Gemini Root Cause
              </span>
              <p className="text-[11px] text-[#8B949E] leading-relaxed">
                {incident.diagnosis.rootCause}
              </p>
            </div>
          )}

          {/* Card: Diff Snippet */}
          {incident.proposedFix && (
            <div className="p-3 bg-[#161B22] rounded-2xl border border-[#21262D]">
              <span className="text-[10px] font-semibold text-emerald-300 block mb-1">
                🛠️ Verified Diff Patch
              </span>
              <pre className="bg-[#090D13] p-2 rounded-xl text-[10px] font-mono overflow-x-auto text-[#8B949E] leading-tight border border-[#21262D]">
                {incident.proposedFix.diff.slice(0, 220)}
              </pre>
            </div>
          )}

          {/* Card: Test Result */}
          <div className="p-2.5 bg-[#161B22] rounded-2xl border border-[#21262D] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Isolated Sandbox:</span>
            </div>
            <span className="font-mono text-[#F0F6FC] font-semibold">
              {incident.testResults?.passed || 3} Passed · 0 Failed
            </span>
          </div>

          {/* Swipe Hint */}
          <div className="text-center py-1 text-[10px] text-[#8B949E] font-mono">
            {dragOffset > 20 ? (
              <span className="text-emerald-400 font-bold">Release to Approve ➔</span>
            ) : dragOffset < -20 ? (
              <span className="text-red-400 font-bold">⬅ Release to Reject</span>
            ) : (
              <span>‹ Drag Card Left to Reject / Right to Approve ›</span>
            )}
          </div>
        </div>

        {/* Android Gesture Approval Flow */}
        <div className="p-3.5 bg-[#161B22] border-t border-[#21262D] shrink-0 space-y-2">
          {swipeState === 'approved' || isResolved ? (
            <div className="py-2.5 px-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-center text-xs font-semibold text-emerald-400 flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Approved & PR Merged!
            </div>
          ) : swipeState === 'rejected' || incident.status === 'rejected' ? (
            <div className="py-2.5 px-3 bg-red-500/20 border border-red-500/40 rounded-2xl text-center text-xs font-semibold text-red-400 flex items-center justify-center gap-2">
              <X className="w-4 h-4" />
              Rejected · Feedback Logged
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleReject}
                className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Reject Fix
              </button>

              <button
                onClick={handleApprove}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <span>Approve PR</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Android Home Navigation Bar */}
          <div className="w-24 h-1 bg-[#30363D] rounded-full mx-auto mt-2" />
        </div>
      </div>
    </div>
  );
};
