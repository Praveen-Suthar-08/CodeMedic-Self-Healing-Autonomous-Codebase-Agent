import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  GitPullRequest, 
  Clock, 
  ChevronRight, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Radio, 
  FileCode2, 
  Terminal,
  Download,
  CheckSquare,
  Square,
  Archive,
  Check,
  X,
  Layers,
  Sparkle,
  Zap,
  Copy,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { Incident, Repository } from '../types';
import { PipelineStepper } from './PipelineStepper';
import { ConfidenceRing } from './ConfidenceRing';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';

interface DashboardViewProps {
  incidents: Incident[];
  repositories: Repository[];
  onSelectIncident: (incident: Incident) => void;
  onOpenIngest: () => void;
  onRunPipeline: (incidentId: string) => void;
  onBulkApprove?: (incidentIds: string[]) => void;
  onBulkArchive?: (incidentIds: string[]) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  incidents,
  repositories,
  onSelectIncident,
  onOpenIngest,
  onRunPipeline,
  onBulkApprove,
  onBulkArchive,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [repoFilter, setRepoFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkNotification, setBulkNotification] = useState<string | null>(null);
  const [copiedErrorId, setCopiedErrorId] = useState<string | null>(null);
  const [activeTabPreset, setActiveTabPreset] = useState<'all' | 'needs_action' | 'auto_healed' | 'critical'>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'repository' | 'severity'>('none');

  const filteredIncidents = incidents.filter((inc) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      inc.errorMessage.toLowerCase().includes(query) ||
      inc.severity.toLowerCase().includes(query) ||
      inc.title.toLowerCase().includes(query) ||
      inc.filePath.toLowerCase().includes(query) ||
      inc.repoName.toLowerCase().includes(query) ||
      inc.stackTrace.toLowerCase().includes(query) ||
      (inc.diagnosis?.rootCause && inc.diagnosis.rootCause.toLowerCase().includes(query));

    const matchesPreset =
      activeTabPreset === 'all'
        ? true
        : activeTabPreset === 'needs_action'
        ? inc.status === 'awaiting_approval' || inc.status === 'detected' || inc.status === 'diagnosing'
        : activeTabPreset === 'auto_healed'
        ? inc.status === 'merged' || inc.status === 'auto_pr_created'
        : inc.severity === 'critical';

    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || inc.severity === severityFilter;
    const matchesRepo = repoFilter === 'all' || inc.repoId === repoFilter;

    return matchesSearch && matchesPreset && matchesStatus && matchesSeverity && matchesRepo;
  });

  const toggleSelectIncident = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredIncidents.map((i) => i.id);
    if (selectedIds.length === allFilteredIds.length && allFilteredIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  const handleSelectLowAndMedium = () => {
    const lowMedIds = filteredIncidents
      .filter(
        (i) =>
          (i.severity === 'low' || i.severity === 'medium') &&
          i.status !== 'merged' &&
          i.status !== 'rejected'
      )
      .map((i) => i.id);
    setSelectedIds(lowMedIds);
  };

  const handleExecuteBulkApprove = async () => {
    if (selectedIds.length === 0 || !onBulkApprove) return;
    setIsBulkProcessing(true);
    try {
      await onBulkApprove(selectedIds);
      setBulkNotification(`✓ Bulk approved & opened PRs for ${selectedIds.length} incidents`);
      setSelectedIds([]);
      setTimeout(() => setBulkNotification(null), 3500);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleExecuteBulkArchive = async () => {
    if (selectedIds.length === 0 || !onBulkArchive) return;
    setIsBulkProcessing(true);
    try {
      await onBulkArchive(selectedIds);
      setBulkNotification(`✓ Bulk archived/dismissed ${selectedIds.length} incidents`);
      setSelectedIds([]);
      setTimeout(() => setBulkNotification(null), 3500);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleCopyError = (e: React.MouseEvent, id: string, msg: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(msg);
    setCopiedErrorId(id);
    setTimeout(() => setCopiedErrorId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Incident ID',
      'Title',
      'Severity',
      'Status',
      'Pipeline Stage',
      'Repository',
      'File Path',
      'Environment',
      'Source',
      'Confidence Score',
      'Sandbox Tests Passed',
      'Root Cause Diagnosis',
      'PR Number',
      'PR URL',
      'Created At',
      'Error Message'
    ];

    const escapeCSV = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredIncidents.map((inc) => [
      escapeCSV(inc.id),
      escapeCSV(inc.title),
      escapeCSV(inc.severity),
      escapeCSV(inc.status),
      escapeCSV(inc.currentPipelineStage || 'detected'),
      escapeCSV(inc.repoName),
      escapeCSV(inc.filePath),
      escapeCSV(inc.environment),
      escapeCSV(inc.source || 'sentry'),
      escapeCSV(`${Math.round(inc.confidenceScore * 100)}%`),
      escapeCSV(`${inc.testResults?.passed || 0}/${(inc.testResults?.passed || 0) + (inc.testResults?.failed || 0)}`),
      escapeCSV(inc.diagnosis?.rootCause || 'Pending Diagnosis'),
      escapeCSV(inc.prNumber ? `#${inc.prNumber}` : 'N/A'),
      escapeCSV(inc.prUrl || 'N/A'),
      escapeCSV(inc.createdAt),
      escapeCSV(inc.errorMessage)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `codemedic-incidents-report-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBulkNotification(`✓ Downloaded CSV report containing ${filteredIncidents.length} filtered incident records`);
    setTimeout(() => setBulkNotification(null), 3500);
  };

  const activeCount = incidents.filter(
    (i) => i.status !== 'merged' && i.status !== 'rejected' && i.status !== 'auto_pr_created'
  ).length;

  const totalResolved = incidents.filter(
    (i) => i.status === 'merged' || i.status === 'auto_pr_created'
  ).length;

  const totalTokens = repositories.reduce(
    (sum, r) => sum + (r.webhookTokens?.filter((t) => t.status === 'active').length || 0),
    0
  );

  const lowMedCount = filteredIncidents.filter(
    (i) =>
      (i.severity === 'low' || i.severity === 'medium') &&
      i.status !== 'merged' &&
      i.status !== 'rejected'
  ).length;

  const allFilteredSelected =
    filteredIncidents.length > 0 && selectedIds.length === filteredIncidents.length;

  const activeIncidentsList = incidents.filter(
    (i) => i.status !== 'merged' && i.status !== 'rejected' && i.status !== 'auto_pr_created'
  );

  const severityCounts = {
    critical: activeIncidentsList.filter((i) => i.severity === 'critical').length,
    high: activeIncidentsList.filter((i) => i.severity === 'high').length,
    medium: activeIncidentsList.filter((i) => i.severity === 'medium').length,
    low: activeIncidentsList.filter((i) => i.severity === 'low').length,
  };

  const severityChartData = [
    { name: 'Critical', value: severityCounts.critical, color: '#EF4444' },
    { name: 'High', value: severityCounts.high, color: '#F59E0B' },
    { name: 'Medium', value: severityCounts.medium, color: '#3B82F6' },
    { name: 'Low', value: severityCounts.low, color: '#10B981' },
  ].filter((d) => d.value > 0);

  const totalActiveChartCount = severityChartData.reduce((acc, curr) => acc + curr.value, 0);

  const renderIncidentCard = (incident: Incident) => {
    const isResolved = incident.status === 'merged' || incident.status === 'auto_pr_created';
    const isCritical = incident.severity === 'critical';
    const isSelected = selectedIds.includes(incident.id);
    const isCopied = copiedErrorId === incident.id;

    return (
      <div
        key={incident.id}
        className={`p-5 rounded-2xl transition-all shadow-md group relative overflow-hidden ${
          isSelected
            ? 'bg-[#151D2A] border-2 border-blue-500/80 ring-1 ring-blue-500/50 shadow-blue-950/20'
            : 'bg-[#161B22] hover:bg-[#1C2128] border border-[#21262D] hover:border-[#30363D]'
        }`}
      >
        {/* Top Row: Checkbox, Severity & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            {/* Individual Incident Checkbox */}
            <div
              onClick={(e) => toggleSelectIncident(incident.id, e)}
              title={isSelected ? 'Deselect incident' : 'Select incident for bulk action'}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/50'
                  : 'border-[#30363D] hover:border-blue-400 bg-[#0D1117]'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </div>

            {/* Severity Badge */}
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

          <div className="flex items-center gap-3 text-xs text-[#8B949E]">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5" />
              {new Date(incident.createdAt).toLocaleTimeString()}
            </span>
            <span className="text-[#30363D]" aria-hidden="true">·</span>
            <span className="capitalize">{incident.source} source</span>
          </div>
        </div>

        {/* Main Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center my-4">
          {/* Error Title & Stack snippet */}
          <div className="lg:col-span-6 space-y-1.5">
            <h3
              onClick={() => onSelectIncident(incident)}
              className="text-sm font-semibold text-[#F0F6FC] hover:text-blue-400 transition-colors cursor-pointer leading-snug"
            >
              {incident.title}
            </h3>
            
            <div className="relative group/msg">
              <p className="text-xs font-mono text-[#8B949E] bg-[#0D1117] p-2 pr-8 rounded-lg border border-[#21262D] truncate">
                {incident.errorMessage}
              </p>
              <button
                onClick={(e) => handleCopyError(e, incident.id, incident.errorMessage)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#8B949E] hover:text-white rounded bg-[#161B22] border border-[#21262D] opacity-0 group-hover/msg:opacity-100 transition-all cursor-pointer"
                title="Copy error message"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Horizontal Pipeline Stepper */}
          <div className="lg:col-span-4">
            <PipelineStepper
              currentStage={incident.currentPipelineStage}
              status={incident.status}
              size="sm"
            />
          </div>

          {/* Confidence Ring & Action Button */}
          <div className="lg:col-span-2 flex items-center justify-end gap-3">
            <ConfidenceRing
              score={incident.confidenceScore}
              threshold={0.88}
              size={54}
              strokeWidth={5}
              breakdown={incident.confidenceBreakdown}
            />

            <button
              onClick={() => onSelectIncident(incident)}
              className="p-2.5 rounded-xl bg-[#21262D] hover:bg-blue-600 text-[#C9D1D9] hover:text-white transition-all cursor-pointer group-hover:translate-x-0.5"
              title="Enter Operating Room Surgery View"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Status bar */}
        <div className="pt-3 border-t border-[#21262D] flex flex-wrap items-center justify-between text-xs text-[#8B949E] gap-2">
          <div className="flex items-center gap-3">
            {incident.diagnosis ? (
              <span className="flex items-center gap-1 text-purple-300 font-medium truncate max-w-3xl xl:max-w-5xl">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-[#8B949E]">Diagnosis:</span> {incident.diagnosis.rootCause}
              </span>
            ) : (
              <span className="text-[#8B949E] italic">
                Awaiting agentic pipeline start...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {incident.status === 'detected' && (
              <button
                onClick={() => onRunPipeline(incident.id)}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95"
              >
                <Play className="w-3 h-3" />
                Run Autonomous Fix
              </button>
            )}

            {incident.prUrl && (
              <a
                href={incident.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono text-[11px]"
              >
                <GitPullRequest className="w-3.5 h-3.5" />
                PR #{incident.prNumber || 142}
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mx-auto space-y-5 text-[#C9D1D9]">
      {/* Toast Notification */}
      {bulkNotification && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg shadow-emerald-950/30 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{bulkNotification}</span>
          </div>
          <button
            onClick={() => setBulkNotification(null)}
            className="text-emerald-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* High-Resolution Telemetry Overview Bar with Recharts Donut Chart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Active Triage */}
        <div className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl flex items-center justify-between hover:border-red-500/40 transition-all">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B949E] block mb-0.5">
              Active Triage
            </span>
            <span className="text-xl font-mono font-bold text-[#F0F6FC]">
              {activeCount}{' '}
              <span className="text-xs font-normal text-[#8B949E]">/ {incidents.length} total</span>
            </span>
          </div>
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Interactive Recharts Severity Distribution Donut Chart */}
        <div className="p-3.5 bg-[#161B22] border border-[#21262D] rounded-2xl flex items-center justify-between hover:border-amber-500/40 transition-all group">
          <div className="flex-1 pr-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B949E] block">
                Active Severity
              </span>
              {severityFilter !== 'all' && (
                <button
                  onClick={() => setSeverityFilter('all')}
                  className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-mono">
              {severityCounts.critical > 0 && (
                <button
                  onClick={() => setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical')}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    severityFilter === 'critical'
                      ? 'bg-red-500/20 text-red-300 font-bold ring-1 ring-red-500/50'
                      : 'text-red-400 hover:bg-red-500/10'
                  }`}
                  title="Click to filter critical incidents"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500/80 animate-pulse" />
                  <span>{severityCounts.critical} Crit</span>
                </button>
              )}
              {severityCounts.high > 0 && (
                <button
                  onClick={() => setSeverityFilter(severityFilter === 'high' ? 'all' : 'high')}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    severityFilter === 'high'
                      ? 'bg-amber-500/20 text-amber-300 font-bold ring-1 ring-amber-500/50'
                      : 'text-amber-400 hover:bg-amber-500/10'
                  }`}
                  title="Click to filter high incidents"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/80" />
                  <span>{severityCounts.high} High</span>
                </button>
              )}
              {severityCounts.medium > 0 && (
                <button
                  onClick={() => setSeverityFilter(severityFilter === 'medium' ? 'all' : 'medium')}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    severityFilter === 'medium'
                      ? 'bg-blue-500/20 text-blue-300 font-bold ring-1 ring-blue-500/50'
                      : 'text-blue-400 hover:bg-blue-500/10'
                  }`}
                  title="Click to filter medium incidents"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/80" />
                  <span>{severityCounts.medium} Med</span>
                </button>
              )}
              {severityCounts.low > 0 && (
                <button
                  onClick={() => setSeverityFilter(severityFilter === 'low' ? 'all' : 'low')}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    severityFilter === 'low'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold ring-1 ring-emerald-500/50'
                      : 'text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                  title="Click to filter low incidents"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/80" />
                  <span>{severityCounts.low} Low</span>
                </button>
              )}
            </div>
          </div>

          <div className="w-16 h-16 relative shrink-0">
            {totalActiveChartCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        const pct = Math.round(((data.value as number) / totalActiveChartCount) * 100);
                        return (
                          <div className="bg-[#090D13] border border-[#30363D] rounded-xl px-2.5 py-1.5 shadow-2xl text-[10px] font-mono z-50">
                            <div className="flex items-center gap-1.5 font-bold" style={{ color: data.payload.color }}>
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.color }} />
                              <span>{data.name} Priority</span>
                            </div>
                            <div className="text-[#8B949E] mt-0.5">
                              {data.value} {data.value === 1 ? 'incident' : 'incidents'} ({pct}%)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={severityChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={28}
                    stroke="#090D13"
                    strokeWidth={2}
                    paddingAngle={4}
                    onClick={(entry) => {
                      if (entry && entry.name) {
                        const targetSev = entry.name.toLowerCase();
                        setSeverityFilter(severityFilter === targetSev ? 'all' : targetSev);
                      }
                    }}
                    cursor="pointer"
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        className="transition-all hover:opacity-80 cursor-pointer outline-none"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full rounded-full border-2 border-dashed border-[#30363D] flex items-center justify-center text-[9px] text-[#8B949E]">
                0
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] font-mono font-bold text-[#F0F6FC] leading-none">
                {totalActiveChartCount}
              </span>
              <span className="text-[8px] font-mono text-[#8B949E] leading-none mt-0.5">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Autonomous Auto-Fix */}
        <div className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl flex items-center justify-between hover:border-emerald-500/40 transition-all">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B949E] block mb-0.5">
              Autonomous Auto-Fix
            </span>
            <span className="text-xl font-mono font-bold text-emerald-400">
              94.2%{' '}
              <span className="text-xs font-normal text-[#8B949E]">({totalResolved} verified)</span>
            </span>
          </div>
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Monitored Repos */}
        <div className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl flex items-center justify-between hover:border-blue-500/40 transition-all">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B949E] block mb-0.5">
              Monitored Repos
            </span>
            <span className="text-xl font-mono font-bold text-blue-400">
              {repositories.length}{' '}
              <span className="text-xs font-normal text-[#8B949E]">({totalTokens} sinks)</span>
            </span>
          </div>
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: Isolated Test Sandbox */}
        <div className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl flex items-center justify-between hover:border-purple-500/40 transition-all">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B949E] block mb-0.5">
              Isolated Sandbox
            </span>
            <span className="text-xs font-mono font-semibold text-purple-400 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4" />
              Docker node:20 (Net: 0)
            </span>
          </div>
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <Terminal className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Category Segmented Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-[#161B22] border border-[#21262D] rounded-2xl">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'all', label: 'All Incidents', count: incidents.length },
            { id: 'needs_action', label: 'Needs Review / Action', count: activeCount },
            { id: 'auto_healed', label: 'Auto-Healed & Merged', count: totalResolved },
            { id: 'critical', label: 'Critical Severity', count: incidents.filter((i) => i.severity === 'critical').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabPreset(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeTabPreset === tab.id
                  ? 'bg-[#21262D] text-[#F0F6FC] shadow-sm font-semibold'
                  : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTabPreset === tab.id ? 'bg-[#0D1117] text-white' : 'bg-[#0D1117]/60 text-[#8B949E]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pr-2">
          <button
            onClick={onOpenIngest}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Live Crash Event</span>
          </button>
        </div>
      </div>

      {/* Filter, Search & Bulk Select Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-[#161B22] border border-[#21262D] rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          {/* Select All Checkbox Trigger */}
          <button
            onClick={handleSelectAllFiltered}
            title={allFilteredSelected ? 'Deselect all' : 'Select all filtered'}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              allFilteredSelected
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-[#0D1117] border-[#21262D] hover:border-[#30363D] text-[#8B949E] hover:text-[#C9D1D9]'
            }`}
          >
            {allFilteredSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-400" />
            ) : (
              <Square className="w-4 h-4 text-[#8B949E]" />
            )}
            <span className="hidden sm:inline">Select All</span>
          </button>

          {/* Quick Select Low/Med Severity Helper */}
          {lowMedCount > 0 && (
            <button
              onClick={handleSelectLowAndMedium}
              title={`Select ${lowMedCount} active low/medium severity incidents`}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-2 bg-[#0D1117] hover:bg-[#21262D] border border-[#21262D] hover:border-amber-500/50 rounded-xl text-xs font-medium text-[#8B949E] hover:text-amber-300 transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Select Low/Med ({lowMedCount})</span>
            </button>
          )}

          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by error message, severity (critical/high), stack trace, or file..."
              className="w-full pl-9 pr-16 py-2 bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-xl text-xs text-[#F0F6FC] outline-none font-mono transition-colors"
            />
            {search.trim() !== '' && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#21262D] text-[#8B949E]">
                  {filteredIncidents.length}
                </span>
                <button
                  onClick={() => setSearch('')}
                  className="p-1 text-[#8B949E] hover:text-[#F0F6FC] rounded-lg hover:bg-[#21262D] transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-xl text-[#C9D1D9] outline-none font-medium cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="diagnosing">Diagnosing</option>
            <option value="fix_generated">Fix Generated</option>
            <option value="testing">Testing</option>
            <option value="auto_pr_created">Auto PR Created</option>
            <option value="merged">Merged</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-xl text-[#C9D1D9] outline-none font-medium cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Repo Filter */}
          <select
            value={repoFilter}
            onChange={(e) => setRepoFilter(e.target.value)}
            className="px-3 py-2 bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-xl text-[#C9D1D9] outline-none font-medium cursor-pointer"
          >
            <option value="all">All Repositories</option>
            {repositories.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Download CSV Button */}
          <button
            onClick={handleExportCSV}
            title="Download CSV report of current filtered incidents"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0D1117] hover:bg-[#21262D] border border-[#21262D] hover:border-[#30363D] text-[#C9D1D9] hover:text-[#F0F6FC] rounded-xl transition-all cursor-pointer font-medium text-xs shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Download CSV</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#21262D] text-[#8B949E]">
              {filteredIncidents.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tabbed View: All vs Repository vs Severity Organization */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-[#161B22] border border-[#21262D] rounded-2xl shadow-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setGroupBy('none')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              groupBy === 'none'
                ? 'bg-[#21262D] text-[#F0F6FC] shadow-sm font-semibold border border-[#30363D]'
                : 'text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#0D1117]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>All Incidents</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              groupBy === 'none' ? 'bg-[#0D1117] text-[#F0F6FC]' : 'bg-[#0D1117]/60 text-[#8B949E]'
            }`}>
              {filteredIncidents.length}
            </span>
          </button>

          <button
            onClick={() => setGroupBy('repository')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              groupBy === 'repository'
                ? 'bg-[#21262D] text-[#F0F6FC] shadow-sm font-semibold border border-[#30363D]'
                : 'text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#0D1117]'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Repository View</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              groupBy === 'repository' ? 'bg-[#0D1117] text-blue-400' : 'bg-[#0D1117]/60 text-[#8B949E]'
            }`}>
              {repositories.length} repos
            </span>
          </button>

          <button
            onClick={() => setGroupBy('severity')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              groupBy === 'severity'
                ? 'bg-[#21262D] text-[#F0F6FC] shadow-sm font-semibold border border-[#30363D]'
                : 'text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#0D1117]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Severity View</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              groupBy === 'severity' ? 'bg-[#0D1117] text-amber-400' : 'bg-[#0D1117]/60 text-[#8B949E]'
            }`}>
              4 tiers
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 pr-2 text-xs font-mono text-[#8B949E]">
          <span>View Mode: <strong className="text-[#C9D1D9] capitalize">{groupBy === 'none' ? 'All (Flat)' : groupBy}</strong></span>
          <span className="text-[#30363D]">·</span>
          <span>{filteredIncidents.length} matching</span>
        </div>
      </div>

      {/* Docked Sticky Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-30 p-3.5 bg-[#090D13] border-2 border-blue-500/80 rounded-2xl shadow-2xl shadow-blue-950/40 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-semibold text-[#F0F6FC]">
              {selectedIds.length} {selectedIds.length === 1 ? 'incident' : 'incidents'} selected
            </span>
            <span className="text-xs text-[#8B949E]">
              ({selectedIds.filter((id) => {
                const inc = incidents.find((i) => i.id === id);
                return inc?.severity === 'low' || inc?.severity === 'medium';
              }).length} low/med severity)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExecuteBulkApprove}
              disabled={isBulkProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Bulk Approve ({selectedIds.length})</span>
            </button>

            <button
              onClick={handleExecuteBulkArchive}
              disabled={isBulkProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 disabled:opacity-50 text-red-400 font-semibold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <Archive className="w-4 h-4" />
              <span>Bulk Archive ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-2 text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D] rounded-xl transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Incidents Container */}
      {filteredIncidents.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 flex flex-col items-center justify-center text-center bg-[#161B22]/50 border border-[#21262D] rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl">
            🩺
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#F0F6FC]">
              No matching incidents found
            </h3>
            <p className="text-xs text-[#8B949E] mt-1">
              Try resetting your search query or simulate an incoming production exception.
            </p>
          </div>
          <button
            onClick={onOpenIngest}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
          >
            Simulate New Bug Ingestion
          </button>
        </div>
      ) : groupBy === 'repository' ? (
        /* Grouped by Repository View */
        <div className="space-y-6">
          {repositories
            .map((repo) => {
              const repoIncidents = filteredIncidents.filter((i) => i.repoId === repo.id || i.repoName === repo.name);
              return { repo, incidents: repoIncidents };
            })
            .filter((g) => g.incidents.length > 0)
            .map(({ repo, incidents: repoIncidents }) => {
              const allRepoSelected = repoIncidents.every((i) => selectedIds.includes(i.id));

              return (
                <div key={repo.id} className="space-y-3 bg-[#161B22]/40 border border-[#21262D] rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#21262D]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#F0F6FC] font-mono">
                            {repo.name}
                          </h3>
                          <span className="text-[10px] font-mono text-[#8B949E] px-2 py-0.5 rounded bg-[#21262D]">
                            branch: {repo.branch}
                          </span>
                        </div>
                        <p className="text-xs text-[#8B949E]">
                          Owner: {repo.owner} · Auto-Merge Threshold: {(repo.autoMergeThreshold * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-lg">
                        {repoIncidents.length} {repoIncidents.length === 1 ? 'incident' : 'incidents'}
                      </span>
                      <button
                        onClick={() => {
                          const ids = repoIncidents.map((i) => i.id);
                          if (allRepoSelected) {
                            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
                          } else {
                            setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
                          }
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-[#0D1117] hover:bg-[#21262D] border border-[#21262D] rounded-lg text-[#8B949E] hover:text-[#C9D1D9] transition-colors cursor-pointer"
                      >
                        {allRepoSelected ? 'Deselect Repo' : 'Select Repo'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {repoIncidents.map((incident) => renderIncidentCard(incident))}
                  </div>
                </div>
              );
            })}
        </div>
      ) : groupBy === 'severity' ? (
        /* Grouped by Severity View */
        <div className="space-y-6">
          {(['critical', 'high', 'medium', 'low'] as const).map((sevTier) => {
            const tierIncidents = filteredIncidents.filter((i) => i.severity === sevTier);
            if (tierIncidents.length === 0) return null;

            const allTierSelected = tierIncidents.every((i) => selectedIds.includes(i.id));

            return (
              <div
                key={sevTier}
                className={`space-y-3 border rounded-2xl p-4 sm:p-5 ${
                  sevTier === 'critical'
                    ? 'bg-red-950/10 border-red-500/30'
                    : sevTier === 'high'
                    ? 'bg-amber-950/10 border-amber-500/30'
                    : sevTier === 'medium'
                    ? 'bg-blue-950/10 border-blue-500/30'
                    : 'bg-emerald-950/10 border-emerald-500/30'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#21262D]">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs uppercase font-mono font-bold px-2.5 py-1 rounded-lg ${
                        sevTier === 'critical'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : sevTier === 'high'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : sevTier === 'medium'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {sevTier} Priority Tiers
                    </span>
                    <span className="text-xs text-[#8B949E]">
                      {sevTier === 'critical'
                        ? 'Immediate production outages or data-path exceptions.'
                        : sevTier === 'high'
                        ? 'High-impact degradation in major subsystems.'
                        : sevTier === 'medium'
                        ? 'Non-fatal edge cases and handling anomalies.'
                        : 'Low-risk telemetry or deprecation warnings.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#F0F6FC] bg-[#0D1117] border border-[#21262D] px-2.5 py-1 rounded-lg">
                      {tierIncidents.length} {tierIncidents.length === 1 ? 'incident' : 'incidents'}
                    </span>
                    <button
                      onClick={() => {
                        const ids = tierIncidents.map((i) => i.id);
                        if (allTierSelected) {
                          setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
                        } else {
                          setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium bg-[#0D1117] hover:bg-[#21262D] border border-[#21262D] rounded-lg text-[#8B949E] hover:text-[#C9D1D9] transition-colors cursor-pointer"
                    >
                      {allTierSelected ? 'Deselect Tier' : 'Select Tier'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {tierIncidents.map((incident) => renderIncidentCard(incident))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat Standard List View */
        <div className="space-y-3.5">
          {filteredIncidents.map((incident) => renderIncidentCard(incident))}
        </div>
      )}
    </div>
  );
};
