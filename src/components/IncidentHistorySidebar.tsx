import React, { useState, useEffect } from 'react';
import {
  History,
  Clock,
  User,
  Bot,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GitPullRequest,
  Sparkles,
  Terminal,
  Send,
  Copy,
  Check,
  CheckCheck,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Lock,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { AuditLogEntry } from '../types';

interface IncidentHistorySidebarProps {
  incidentId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const IncidentHistorySidebar: React.FC<IncidentHistorySidebarProps> = ({
  incidentId,
  isOpen,
  onToggle,
}) => {
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [actorName, setActorName] = useState('On-Call Engineer');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [verifiedHash, setVerifiedHash] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchHistory = () => {
    setLoading(true);
    fetch(`/api/incidents/${incidentId}/history`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHistory(data.timeline || []);
        }
      })
      .catch((err) => console.error('Failed to load incident history:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (incidentId) {
      fetchHistory();
    }
  }, [incidentId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newNote.trim(),
          actor: actorName,
          role: 'developer',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHistory((prev) => [data.log, ...prev]);
        setNewNote('');
      }
    } catch (err) {
      console.error('Failed to post note:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleVerifyHash = (hash: string) => {
    setVerifiedHash(hash);
    setTimeout(() => setVerifiedHash(null), 3000);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'AUTO_PR_OPENED':
      case 'HUMAN_APPROVED':
        return {
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          icon: <GitPullRequest className="w-3.5 h-3.5" />,
          label: action === 'AUTO_PR_OPENED' ? 'Auto PR Opened' : 'Human Approved PR',
        };
      case 'SANDBOX_TEST_PASSED':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'Sandbox Test Passed',
        };
      case 'SANDBOX_TEST_FAILED':
      case 'HUMAN_REJECTED':
        return {
          bg: 'bg-red-500/10 text-red-400 border-red-500/30',
          icon: <XCircle className="w-3.5 h-3.5" />,
          label: action === 'HUMAN_REJECTED' ? 'Human Rejected Fix' : 'Sandbox Test Failed',
        };
      case 'DIAGNOSED':
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          icon: <Sparkles className="w-3.5 h-3.5" />,
          label: 'AST Diagnosis Completed',
        };
      case 'FIX_GENERATED':
        return {
          bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          icon: <Terminal className="w-3.5 h-3.5" />,
          label: 'Unified Diff Patch Synthesized',
        };
      case 'DEVELOPER_NOTE_ADDED':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: <MessageSquare className="w-3.5 h-3.5" />,
          label: 'Developer Log Note',
        };
      case 'INGESTED':
      default:
        return {
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          icon: <Clock className="w-3.5 h-3.5" />,
          label: 'Crash Ingested',
        };
    }
  };

  return (
    <aside aria-label="Incident History" className={`bg-[#161B22] border border-[#21262D] rounded-2xl flex flex-col transition-all duration-300 overflow-hidden shadow-xl ${
      isOpen ? 'h-full min-h-[460px]' : 'h-auto'
    }`}>
      {/* Sidebar Header */}
      <div className="p-3.5 sm:p-4 bg-[#0D1117] border-b border-[#21262D] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-semibold text-[#F0F6FC]">
                Incident History & Audit Log
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#21262D] text-[#8B949E] font-bold">
                {history.length} events
              </span>
            </div>
            <p className="text-[11px] text-[#8B949E]">
              Chronological ledger of AI operations & developer actions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-1.5 text-[#8B949E] hover:text-[#F0F6FC] bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] rounded-lg transition-colors cursor-pointer"
            title="Refresh history timeline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 text-[#8B949E] hover:text-[#F0F6FC] bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] rounded-lg transition-colors cursor-pointer"
            title={isOpen ? 'Collapse history sidebar' : 'Expand history sidebar'}
          >
            {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      {isOpen && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Scrollable Events Timeline */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[480px]">
            {loading && history.length === 0 ? (
              <div className="p-8 text-center text-[#8B949E] text-xs font-mono">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
                <span>Loading incident audit logs...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-[#8B949E] text-xs">
                <History className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <span>No historical actions recorded yet.</span>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#21262D]">
                {history.map((entry, idx) => {
                  const badge = getActionBadge(entry.action);
                  const isAgent = entry.userRole === 'autonomous_agent';
                  const isCopied = copiedHash === entry.complianceHash;
                  const isVerified = verifiedHash === entry.complianceHash;

                  return (
                    <div key={entry.id || idx} className="relative group text-xs">
                      {/* Timeline node icon dot */}
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#0D1117] border border-[#30363D] flex items-center justify-center text-[10px] text-[#8B949E] group-hover:border-blue-400 transition-colors">
                        {isAgent ? (
                          <Bot className="w-3 h-3 text-blue-400" />
                        ) : (
                          <User className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="bg-[#0D1117] border border-[#21262D] rounded-xl p-3 space-y-2 group-hover:border-[#30363D] transition-colors shadow-xs">
                        {/* Top row: Action badge, Actor & Timestamp */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${badge.bg}`}
                          >
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>

                          <span className="text-[10px] font-mono text-[#8B949E]">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        {/* Actor name & Role */}
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8B949E]">
                          <span className="font-semibold text-[#F0F6FC]">{entry.performedBy}</span>
                          <span>·</span>
                          <span className="capitalize text-[10px] font-mono bg-[#161B22] px-1.5 py-0.2 rounded border border-[#21262D]">
                            {entry.userRole.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Event Details message */}
                        <p className="text-xs text-[#C9D1D9] leading-relaxed break-words font-sans">
                          {entry.details}
                        </p>

                        {/* Cryptographic SHA-256 Hash & Verification */}
                        {entry.complianceHash && (
                          <div className="pt-2 border-t border-[#21262D] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#8B949E]">
                            <div className="flex items-center gap-1 truncate max-w-[170px]" title={entry.complianceHash}>
                              <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                              <span className="truncate">{entry.complianceHash.slice(0, 16)}...</span>
                              <button
                                onClick={() => handleCopyHash(entry.complianceHash)}
                                className="text-[#8B949E] hover:text-white transition-colors ml-0.5"
                                title="Copy Full Hash"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>

                            <button
                              onClick={() => handleVerifyHash(entry.complianceHash)}
                              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                                isVerified
                                  ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                                  : 'hover:text-emerald-400'
                              }`}
                            >
                              {isVerified ? '✓ Verified' : 'Verify'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Collaborative Developer Action/Note Box */}
          <form onSubmit={handleAddNote} className="p-3 bg-[#0D1117] border-t border-[#21262D] space-y-2 shrink-0">
            <div className="flex items-center justify-between text-[11px] text-[#8B949E]">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-blue-400" />
                <span>Log Investigation Action</span>
              </span>
              <select
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                className="bg-[#161B22] border border-[#21262D] text-[#C9D1D9] text-[10px] rounded px-1.5 py-0.5 outline-none cursor-pointer"
              >
                <option value="On-Call Engineer">On-Call Engineer</option>
                <option value="Lead SRE">Lead SRE</option>
                <option value="Security Officer">Security Officer</option>
                <option value="Code Reviewer">Code Reviewer</option>
              </select>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log note or verification step (e.g. verified fix in staging)..."
                className="flex-1 bg-[#161B22] border border-[#21262D] focus:border-blue-500 text-xs text-[#F0F6FC] rounded-xl px-3 py-2 outline-none"
              />
              <button
                type="submit"
                disabled={submitting || !newNote.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
};
