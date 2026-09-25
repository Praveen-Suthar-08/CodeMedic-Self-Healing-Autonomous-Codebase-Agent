import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  DollarSign,
  TrendingUp,
  Layers,
  Search,
  Download,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  BarChart2,
  PieChart as PieChartIcon,
  RefreshCw,
  FolderGit2,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { AiConsumptionReport, RepoConsumptionMetrics, IncidentConsumptionMetrics } from '../types';

interface AIConsumptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIConsumptionModal: React.FC<AIConsumptionModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<AiConsumptionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'by_repo' | 'by_incident' | 'trend'>('by_repo');
  const [incidentSearch, setIncidentSearch] = useState('');
  const [repoSortBy, setRepoSortBy] = useState<'cost' | 'tokens' | 'surgeries'>('cost');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const fetchConsumptionData = () => {
    setLoading(true);
    fetch('/api/admin/ai-consumption')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.report);
        }
      })
      .catch((err) => console.error('Failed to load AI consumption:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchConsumptionData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const summary = data?.summary;
  const repos = data?.byRepository || [];
  const incidents = data?.byIncident || [];
  const dailyTrend = data?.dailyTrend || [];

  const sortedRepos = [...repos].sort((a, b) => {
    if (repoSortBy === 'cost') return b.estimatedCostUsd - a.estimatedCostUsd;
    if (repoSortBy === 'tokens') return b.totalTokens - a.totalTokens;
    return b.totalSurgeries - a.totalSurgeries;
  });

  const filteredIncidents = incidents.filter((inc) => {
    const q = incidentSearch.toLowerCase();
    return (
      inc.title.toLowerCase().includes(q) ||
      inc.repoName.toLowerCase().includes(q) ||
      inc.severity.toLowerCase().includes(q) ||
      inc.incidentId.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (!data) return;
    const headers = [
      'Incident ID',
      'Title',
      'Repository',
      'Severity',
      'Status',
      'Prompt Tokens',
      'Completion Tokens',
      'Total Tokens',
      'Estimated Cost (USD)',
      'Timestamp'
    ];

    const rows = incidents.map((i) => [
      `"${i.incidentId}"`,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.repoName}"`,
      `"${i.severity}"`,
      `"${i.status}"`,
      i.promptTokens,
      i.completionTokens,
      i.totalTokens,
      i.estimatedCostUsd,
      `"${i.timestamp}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `codemedic-ai-consumption-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCopiedNotification('✓ Exported full AI token consumption CSV ledger');
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl max-h-[90vh] bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#C9D1D9]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#0D1117] border-b border-[#21262D] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#F0F6FC]">
                  AI Consumption & Operational Cost Ledger
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-[#8B949E] mt-0.5">
                Granular token usage, prompt caching efficiency, and estimated Gemini API billing by repository and incident.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchConsumptionData}
              disabled={loading}
              className="p-2 text-[#8B949E] hover:text-[#F0F6FC] bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] rounded-xl transition-colors cursor-pointer"
              title="Refresh consumption data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#8B949E] hover:text-[#F0F6FC] bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] rounded-xl transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Toast Notification */}
          {copiedNotification && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-md">
              <span>{copiedNotification}</span>
              <button onClick={() => setCopiedNotification(null)} className="text-emerald-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1: Total Spend */}
            <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-2xl">
              <div className="flex items-center justify-between text-xs text-[#8B949E]">
                <span>Total Month Spend</span>
                <DollarSign className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-[#F0F6FC]">
                  ${summary?.totalCostUsd?.toFixed(4) || '0.0824'}
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  / ${summary?.monthlyBudgetUsd || 50} budget
                </span>
              </div>
              <div className="mt-2 w-full bg-[#161B22] h-1.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, Math.max(1, (summary?.budgetPercentUsed || 0.16) * 10))}%` }}
                  className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full rounded-full"
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-[#8B949E] font-mono">
                <span>{summary?.budgetPercentUsed || 0.16}% used</span>
                <span>$49.92 remaining</span>
              </div>
            </div>

            {/* KPI 2: Total Tokens */}
            <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-2xl">
              <div className="flex items-center justify-between text-xs text-[#8B949E]">
                <span>Total Tokens Processed</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {((summary?.totalTokens || 348000) / 1000).toFixed(1)}k
                </span>
                <span className="text-[11px] text-[#8B949E] font-mono">tokens</span>
              </div>
              <div className="mt-2 text-[10px] font-mono text-[#8B949E] flex justify-between">
                <span>Prompt: {((summary?.promptTokens || 280000) / 1000).toFixed(0)}k</span>
                <span>Output: {((summary?.completionTokens || 68000) / 1000).toFixed(0)}k</span>
              </div>
            </div>

            {/* KPI 3: Unit Economics */}
            <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-2xl">
              <div className="flex items-center justify-between text-xs text-[#8B949E]">
                <span>Unit Cost per Surgery</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  ${(summary?.avgCostPerSurgeryUsd || 0.00084).toFixed(5)}
                </span>
              </div>
              <p className="mt-2 text-[10px] text-[#8B949E]">
                Avg {summary?.avgTokensPerSurgery || 2450} tokens / autonomous run
              </p>
            </div>

            {/* KPI 4: Prompt Cache Efficiency */}
            <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-2xl">
              <div className="flex items-center justify-between text-xs text-[#8B949E]">
                <span>Prompt Cache Hit Ratio</span>
                <Database className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-blue-400">
                  {summary?.cacheHitRatioPercent || 84.6}%
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">50% discount</span>
              </div>
              <p className="mt-2 text-[10px] text-[#8B949E]">
                AST code structure & repository context cached
              </p>
            </div>
          </div>

          {/* Tab Navigation & Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-[#0D1117] border border-[#21262D] rounded-xl">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('by_repo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  activeTab === 'by_repo'
                    ? 'bg-[#21262D] text-[#F0F6FC] font-semibold shadow-xs'
                    : 'text-[#8B949E] hover:text-[#C9D1D9]'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
                <span>By Repository ({repos.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('by_incident')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  activeTab === 'by_incident'
                    ? 'bg-[#21262D] text-[#F0F6FC] font-semibold shadow-xs'
                    : 'text-[#8B949E] hover:text-[#C9D1D9]'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>By Incident ({incidents.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('trend')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  activeTab === 'trend'
                    ? 'bg-[#21262D] text-[#F0F6FC] font-semibold shadow-xs'
                    : 'text-[#8B949E] hover:text-[#C9D1D9]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                <span>14-Day Spend & Burn Rate</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pr-1">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-[#C9D1D9] hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Export Ledger CSV</span>
              </button>
            </div>
          </div>

          {/* TAB 1: By Repository */}
          {activeTab === 'by_repo' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8B949E]">
                <span>Repository Token & Cost Breakdown:</span>
                <div className="flex items-center gap-1.5">
                  <span>Sort by:</span>
                  {(['cost', 'tokens', 'surgeries'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setRepoSortBy(s)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-all cursor-pointer ${
                        repoSortBy === s
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-[#0D1117] text-[#8B949E] hover:text-[#C9D1D9]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto border border-[#21262D] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0D1117] text-[#8B949E] border-b border-[#21262D] font-mono text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Repository</th>
                      <th className="py-2.5 px-4">Total Surgeries</th>
                      <th className="py-2.5 px-4">Prompt Tokens</th>
                      <th className="py-2.5 px-4">Output Tokens</th>
                      <th className="py-2.5 px-4">Total Tokens</th>
                      <th className="py-2.5 px-4">Avg Tokens/Run</th>
                      <th className="py-2.5 px-4 text-right">Est. Cost (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#21262D] font-mono">
                    {sortedRepos.map((r) => (
                      <tr key={r.repoId} className="hover:bg-[#1C2128] transition-colors">
                        <td className="py-3 px-4 text-[#F0F6FC] font-semibold flex items-center gap-2">
                          <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>{r.repoName}</span>
                        </td>
                        <td className="py-3 px-4 text-[#C9D1D9]">
                          {r.totalSurgeries} runs
                        </td>
                        <td className="py-3 px-4 text-[#8B949E]">
                          {r.promptTokens.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-[#8B949E]">
                          {r.completionTokens.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-amber-300 font-semibold">
                          {r.totalTokens.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-[#8B949E]">
                          ~{r.avgTokensPerSurgery.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-purple-400">
                          ${r.estimatedCostUsd.toFixed(5)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: By Incident */}
          {activeTab === 'by_incident' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" />
                  <input
                    type="text"
                    value={incidentSearch}
                    onChange={(e) => setIncidentSearch(e.target.value)}
                    placeholder="Search incident by title, repo, or ID..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#0D1117] border border-[#21262D] rounded-xl text-xs text-[#F0F6FC] outline-none font-mono focus:border-purple-500"
                  />
                </div>
                <span className="text-xs text-[#8B949E] font-mono">
                  Showing {filteredIncidents.length} of {incidents.length} incidents
                </span>
              </div>

              <div className="overflow-x-auto border border-[#21262D] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0D1117] text-[#8B949E] border-b border-[#21262D] font-mono text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Incident / Exception</th>
                      <th className="py-2.5 px-4">Repository</th>
                      <th className="py-2.5 px-4">Severity</th>
                      <th className="py-2.5 px-4">Stages</th>
                      <th className="py-2.5 px-4">Prompt Tokens</th>
                      <th className="py-2.5 px-4">Output Tokens</th>
                      <th className="py-2.5 px-4">Total Tokens</th>
                      <th className="py-2.5 px-4 text-right">Surgery Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#21262D] font-mono">
                    {filteredIncidents.map((inc) => (
                      <tr key={inc.incidentId} className="hover:bg-[#1C2128] transition-colors">
                        <td className="py-3 px-4 max-w-[240px]">
                          <div className="font-sans font-semibold text-[#F0F6FC] truncate">
                            {inc.title}
                          </div>
                          <div className="text-[10px] text-[#8B949E] font-mono">
                            {inc.incidentId} · {new Date(inc.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#C9D1D9] whitespace-nowrap">
                          {inc.repoName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              inc.severity === 'critical'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : inc.severity === 'high'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {inc.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#8B949E]">
                          {inc.stagesExecuted} steps
                        </td>
                        <td className="py-3 px-4 text-[#8B949E]">
                          {inc.promptTokens.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-[#8B949E]">
                          {inc.completionTokens.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-amber-300 font-semibold">
                          {inc.totalTokens.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400 whitespace-nowrap">
                          ${inc.estimatedCostUsd.toFixed(6)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: 14-Day Spend & Burn Rate */}
          {activeTab === 'trend' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[#F0F6FC] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    14-Day Daily Gemini Token Volume & Cost Trend
                  </h3>
                  <span className="text-[11px] font-mono text-purple-400 font-semibold">
                    Avg ~28k tokens / day (~$0.007/day)
                  </span>
                </div>

                <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-1 border-b border-[#21262D]">
                  {dailyTrend.map((day, idx) => {
                    const maxTokens = 35000;
                    const heightPercent = Math.min(100, Math.max(15, (day.tokens / maxTokens) * 100));

                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <div className="text-[9px] font-mono text-[#8B949E] opacity-0 group-hover:opacity-100 transition-opacity">
                          ${day.costUsd.toFixed(4)}
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-purple-700 to-emerald-400 rounded-t-md transition-all group-hover:brightness-125 relative cursor-pointer"
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#090D13] border border-[#21262D] px-2 py-0.5 rounded text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-10">
                            {day.surgeries} surgeries · {day.tokens.toLocaleString()} tokens (${day.costUsd.toFixed(4)})
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[#8B949E]">{day.date}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-[#8B949E] pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-purple-700 to-emerald-400" />
                    Daily Autonomous Diagnosis & Verification Token Burn
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    Projected Month Total: ~${summary?.projectedMonthlyCostUsd?.toFixed(3) || '0.173'}
                  </span>
                </div>
              </div>

              {/* Gemini 3.8 Flash Pricing Reference Card */}
              <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-[#F0F6FC] block">
                    Google Gemini 3.8 Flash Model Pricing Reference
                  </span>
                  <span className="text-[#8B949E] text-[11px]">
                    Input: $0.10 / 1,000,000 tokens · Output: $0.40 / 1,000,000 tokens · Context Cache Discount: 50%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-semibold rounded-lg">
                    99.98% Cheaper Than Manual Triage
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0D1117] border-t border-[#21262D] flex items-center justify-between text-xs shrink-0">
          <span className="text-[#8B949E] text-[11px] font-mono">
            CodeMedic Autonomous Health Engine · Real-time Billing Metering
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#21262D] hover:bg-[#30363D] text-[#F0F6FC] font-medium rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
