import React, { useState } from 'react';
import { 
  FlaskConical, 
  Terminal, 
  Play, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Cpu, 
  HardDrive, 
  RefreshCw,
  Lock
} from 'lucide-react';
import { TestResults } from '../types';

interface SandboxRunnerProps {
  testResults?: TestResults;
  isRunning?: boolean;
  onReRun?: () => void;
}

export const SandboxRunner: React.FC<SandboxRunnerProps> = ({
  testResults,
  isRunning = false,
  onReRun,
}) => {
  const [activeTab, setActiveTab] = useState<'assertions' | 'terminal'>('assertions');

  const passed = testResults?.passed || 0;
  const failed = testResults?.failed || 0;
  const total = testResults?.total || (passed + failed);

  return (
    <div className="bg-[#0D1117] border border-[#21262D] rounded-xl overflow-hidden shadow-lg">
      {/* Sandbox Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#161B22] border-b border-[#21262D] gap-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-[#F0F6FC]">
            Isolated Docker Sandbox Test Harness
          </h3>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
            <Lock className="w-2.5 h-2.5" />
            NET_NONE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-[#090D13] border border-[#21262D] rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('assertions')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeTab === 'assertions'
                  ? 'bg-[#21262D] text-[#F0F6FC]'
                  : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              Test Assertions ({passed}/{total})
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                activeTab === 'terminal'
                  ? 'bg-[#21262D] text-[#F0F6FC]'
                  : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              <Terminal className="w-3 h-3" />
              Container Logs
            </button>
          </div>

          {onReRun && (
            <button
              onClick={onReRun}
              disabled={isRunning}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Re-Run Sandbox'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Container Security Badges Bar */}
      <div className="px-4 py-2 bg-[#090D13] border-b border-[#21262D] flex flex-wrap items-center justify-between text-[11px] text-[#8B949E] gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#C9D1D9]">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            Isolated cgroup (512MB RAM, 1 vCPU)
          </span>
          <span className="text-[#30363D]" aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            Zero Secret Access
          </span>
        </div>

        {testResults && (
          <div className="flex items-center gap-2 font-mono">
            <span className="text-emerald-400">{passed} passed</span>
            {failed > 0 && <span className="text-red-400">{failed} failed</span>}
            <span className="text-[#30363D]" aria-hidden="true">·</span>
            <span className="text-[#8B949E]">{testResults.durationMs}ms runtime</span>
          </div>
        )}
      </div>

      {/* Content View */}
      <div className="p-4">
        {isRunning ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
            <p className="text-xs text-[#C9D1D9] font-medium font-mono">
              [sandbox-daemon] Compiling patch into ephemeral container...
            </p>
            <p className="text-[11px] text-[#8B949E]">
              Executing unit and regression test assertions against patched diff
            </p>
          </div>
        ) : activeTab === 'assertions' && testResults?.testCases ? (
          <div className="space-y-2">
            {testResults.testCases.map((tc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-[#161B22] border border-[#21262D] rounded-lg text-xs"
              >
                <div className="flex items-center gap-2">
                  {tc.status === 'passed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span className="font-mono text-[#F0F6FC]">{tc.name}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-[#8B949E]">
                  <span>{tc.durationMs}ms</span>
                  <span className={`px-1.5 py-0.5 rounded uppercase font-semibold text-[10px] ${
                    tc.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {tc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Terminal Output */
          <div className="bg-[#090D13] p-3.5 rounded-lg border border-[#21262D] font-mono text-xs text-[#C9D1D9] overflow-x-auto max-h-64 overflow-y-auto">
            <pre className="whitespace-pre-wrap leading-relaxed text-[#8B949E]">
              {testResults?.log || '[sandbox-runner] No execution logs yet.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
