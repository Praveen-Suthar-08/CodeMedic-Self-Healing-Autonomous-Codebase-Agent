import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Settings, 
  ShieldCheck, 
  Terminal, 
  Sliders, 
  Save, 
  Check, 
  AlertCircle,
  ExternalLink,
  Webhook,
  Flame,
  Activity,
  Zap,
  TrendingDown,
  Info,
  Sparkles
} from 'lucide-react';
import { Repository, Incident } from '../types';
import { IntegrationsPanel } from './IntegrationsPanel';

interface RepoSettingsProps {
  repositories: Repository[];
  onUpdateRepo: (id: string, updates: Partial<Repository>) => void;
  onIngestSuccess?: (newIncident: Incident) => void;
}

export const RepoSettings: React.FC<RepoSettingsProps> = ({
  repositories,
  onUpdateRepo,
  onIngestSuccess,
}) => {
  const [selectedRepoId, setSelectedRepoId] = useState(repositories[0]?.id || 'repo-payments');
  const [activeTab, setActiveTab] = useState<'integrations' | 'policy' | 'calibration'>('integrations');
  const [savedMessage, setSavedMessage] = useState(false);

  const selectedRepo = repositories.find((r) => r.id === selectedRepoId) || repositories[0];
  const [threshold, setThreshold] = useState(selectedRepo?.autoMergeThreshold ?? 0.88);
  const [testCommand, setTestCommand] = useState(selectedRepo?.testCommand || 'npm test -- --coverage');
  const [branch, setBranch] = useState(selectedRepo?.branch || 'main');

  useEffect(() => {
    if (selectedRepo) {
      setThreshold(selectedRepo.autoMergeThreshold ?? 0.88);
      setTestCommand(selectedRepo.testCommand || 'npm test -- --coverage');
      setBranch(selectedRepo.branch || 'main');
    }
  }, [selectedRepoId, selectedRepo]);

  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepoId(repo.id);
    setThreshold(repo.autoMergeThreshold);
    setTestCommand(repo.testCommand);
    setBranch(repo.branch);
  };

  const handleSavePolicy = async () => {
    try {
      const res = await fetch(`/api/repos/${selectedRepo.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoMergeThreshold: threshold,
          testCommand,
          branch,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateRepo(selectedRepo.id, {
          autoMergeThreshold: threshold,
          testCommand,
          branch,
        });
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeTokensCount = (selectedRepo?.webhookTokens || []).filter((t) => t.status === 'active').length;

  return (
    <div className="w-full mx-auto space-y-5 text-[#C9D1D9]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#F0F6FC] flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Repository Settings & Webhook Ingestion
          </h2>
          <p className="text-xs text-[#8B949E]">
            Configure autonomous gate thresholds, real-time Sentry/Webhook listeners, and risk calibration matrices.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#161B22] p-1 rounded-xl border border-[#21262D] text-xs">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'integrations'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[#8B949E] hover:text-[#C9D1D9]'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            Integrations & Listeners
            {activeTokensCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-400/20 text-blue-200">
                {activeTokensCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('policy')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'policy'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[#8B949E] hover:text-[#C9D1D9]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Autonomous Policy & Gates
          </button>

          <button
            onClick={() => setActiveTab('calibration')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'calibration'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[#8B949E] hover:text-[#C9D1D9]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Risk Heatmap
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Active Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Repo List Sidebar */}
        <div className="lg:col-span-3 p-4 bg-[#161B22] border border-[#21262D] rounded-xl space-y-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider block">
              Repositories ({repositories.length})
            </label>
            <span className="text-[10px] font-mono text-blue-400">GitHub VCS</span>
          </div>

          {repositories.map((repo) => {
            const tokenCount = (repo.webhookTokens || []).filter((t) => t.status === 'active').length;
            const isSelected = selectedRepoId === repo.id;

            return (
              <button
                key={repo.id}
                onClick={() => handleSelectRepo(repo)}
                className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#21262D] border-blue-500 text-[#F0F6FC] shadow-sm'
                    : 'bg-[#0D1117] border-[#21262D] text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#161B22]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-semibold text-[#F0F6FC] truncate">
                    {repo.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                    {(repo.autoMergeThreshold * 100).toFixed(0)}% Gate
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#8B949E]">
                  <span className="flex items-center gap-1 text-[10px]">
                    <Webhook className="w-3 h-3 text-emerald-400" />
                    {tokenCount} {tokenCount === 1 ? 'listener' : 'listeners'}
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {(repo.stats.accuracyRate * 100).toFixed(0)}% Acc
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Repo Content Area */}
        <div className="lg:col-span-9">
          {activeTab === 'integrations' && (
            <div className="p-6 bg-[#161B22] border border-[#21262D] rounded-xl">
              <IntegrationsPanel
                repository={selectedRepo}
                onUpdateRepo={onUpdateRepo}
                onIngestSuccess={onIngestSuccess}
              />
            </div>
          )}

          {activeTab === 'policy' && (
            <div className="p-6 bg-[#161B22] border border-[#21262D] rounded-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#21262D]">
                <div>
                  <h3 className="text-sm font-semibold text-[#F0F6FC] flex items-center gap-2">
                    <span>{selectedRepo.name}</span>
                    <a
                      href={selectedRepo.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#8B949E] hover:text-[#C9D1D9] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </h3>
                  <p className="text-xs font-mono text-[#8B949E] mt-0.5">
                    Owner: {selectedRepo.owner} · Primary Branch: {branch}
                  </p>
                </div>

                {savedMessage && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg animate-fadeIn">
                    <Check className="w-3.5 h-3.5" />
                    Policy Saved
                  </span>
                )}
              </div>

              {/* Setting 1: Auto-Merge Confidence Threshold Slider (0-100%) */}
              <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-[#F0F6FC] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-purple-400" />
                      Auto-Merge Confidence Threshold
                    </label>
                    <p className="text-[11px] text-[#8B949E] mt-0.5 max-w-2xl">
                      Controls the gatekeeper strictness for autonomous PR creation and merging. Fixes that pass 100% of isolated Docker sandbox tests and score at or above this confidence percentage are automatically submitted as verified GitHub PRs without human intervention.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        threshold < 0.6
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : threshold < 0.85
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : threshold <= 0.94
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {threshold < 0.6
                        ? 'Permissive'
                        : threshold < 0.85
                        ? 'Balanced'
                        : threshold <= 0.94
                        ? 'Standard Strict (Recommended)'
                        : 'Ultra Strict'}
                    </span>
                    <span className="font-mono text-base font-bold text-purple-400 px-3 py-1 rounded bg-purple-500/10 border border-purple-500/30">
                      {(threshold * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Range Slider 0-100% */}
                <div className="space-y-1 pt-1">
                  <input
                    type="range"
                    min="0.00"
                    max="1.00"
                    step="0.01"
                    value={threshold}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setThreshold(val);
                    }}
                    className="w-full accent-purple-500 bg-[#161B22] h-2.5 rounded-lg cursor-pointer transition-all"
                  />
                  <div className="flex justify-between text-[10px] text-[#8B949E] font-mono pt-1">
                    <span className="text-amber-400">0% (Always Auto-PR)</span>
                    <span className="text-blue-400">50% (Moderate Gate)</span>
                    <span className="text-purple-400 font-bold">88% (Recommended Default)</span>
                    <span className="text-emerald-400">100% (Zero Tolerance)</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#21262D]/60 text-[11px]">
                  <span className="text-[#8B949E] font-medium text-[10px] uppercase tracking-wider">
                    Quick Presets:
                  </span>
                  {[
                    { label: '50% Permissive', val: 0.5 },
                    { label: '75% Balanced', val: 0.75 },
                    { label: '88% Recommended', val: 0.88 },
                    { label: '95% Ultra Strict', val: 0.95 },
                    { label: '100% Absolute Certainty', val: 1.0 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setThreshold(preset.val)}
                      className={`px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
                        Math.abs(threshold - preset.val) < 0.009
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-[#161B22] text-[#8B949E] hover:text-[#C9D1D9] border-[#21262D] hover:border-[#30363D]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Real-Time Gatekeeper Policy Simulator Banner */}
                <div className="p-3 bg-[#161B22] border border-purple-500/30 rounded-xl text-xs space-y-1.5 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Live Gatekeeper Impact Simulation
                    </span>
                    <span className="text-[10px] font-mono text-[#8B949E]">
                      Threshold: {(threshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8B949E]">
                    {threshold <= 0.70
                      ? '⚡ Permissive Gate: Autonomous PRs will be created & merged for almost all candidate fixes that pass isolated sandbox tests.'
                      : threshold <= 0.89
                      ? '⚖️ Balanced Recommended Gate: Pristine fixes (90%+) auto-merge directly, while borderline fixes trigger high-priority on-call alerts for 1-click review.'
                      : '🛡️ Ultra Conservative Gate: Only exceptionally high-confidence fixes will auto-merge; all others require human signoff in the Operating Room.'}
                  </p>
                </div>
              </div>

              {/* Setting 2: Sandbox Test Command */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#F0F6FC] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  Isolated Sandbox Test Execution Command
                </label>
                <p className="text-[11px] text-[#8B949E]">
                  Command invoked inside the isolated Docker test container to verify fixes before gating.
                </p>
                <input
                  type="text"
                  value={testCommand}
                  onChange={(e) => setTestCommand(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-mono text-[#F0F6FC] outline-none"
                />
              </div>

              {/* Setting 3: Target Branch */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#F0F6FC] flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                  Default Merge Base Branch
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-mono text-[#F0F6FC] outline-none"
                />
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-[#21262D] flex justify-end">
                <button
                  onClick={handleSavePolicy}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Repository Policy
                </button>
              </div>
            </div>
          )}

          {activeTab === 'calibration' && (
            <div className="p-6 bg-[#161B22] border border-[#21262D] rounded-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#21262D]">
                <div>
                  <h3 className="text-sm font-semibold text-[#F0F6FC] flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Learning Loop Risk Calibration Heatmap
                  </h3>
                  <p className="text-xs text-[#8B949E]">
                    Dynamic risk adjustments calculated per file path. When human engineers reject patches, penalties automatically rise to ensure conservative gating.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(selectedRepo.riskAreas).map(([filePath, penalty]) => {
                  const penaltyPct = (penalty * 100).toFixed(1);
                  return (
                    <div
                      key={filePath}
                      className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-xl flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-semibold text-[#F0F6FC] block">
                          {filePath}
                        </span>
                        <span className="text-[11px] text-[#8B949E]">
                          Historical calibration factor for {selectedRepo.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`font-mono text-xs font-bold ${
                            penalty > 0.05 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            +{penaltyPct}% Risk Penalty
                          </span>
                          <span className="block text-[10px] text-[#8B949E]">
                            {penalty > 0.05 ? 'Heightened Review' : 'Nominal Confidence'}
                          </span>
                        </div>
                        <div className="w-16 bg-[#21262D] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              penalty > 0.05 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min(100, penalty * 400)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
