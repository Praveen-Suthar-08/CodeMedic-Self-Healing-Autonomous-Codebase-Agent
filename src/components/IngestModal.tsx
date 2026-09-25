import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Radio, 
  Zap, 
  Sparkles, 
  AlertOctagon, 
  Code, 
  Send,
  Webhook
} from 'lucide-react';
import { Repository } from '../types';

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: Repository[];
  onIngestSuccess: (newIncident: any) => void;
}

const PRESET_SCENARIOS = [
  {
    id: 'stripe-missing-await',
    title: 'Stripe Unhandled Promise (Missing Await)',
    repoId: 'repo-payments',
    filePath: 'src/services/stripeProcessor.ts',
    severity: 'critical',
    errorMessage: "TypeError: Cannot read properties of Promise (reading 'id') at processCustomerCharge (stripeProcessor.ts:37:32)",
    stackTrace: `TypeError: Cannot read properties of Promise (reading 'id')
    at processCustomerCharge (/app/payment-service/src/services/stripeProcessor.ts:37:32)
    at async /app/payment-service/src/routes/checkout.ts:89:18
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)`,
  },
  {
    id: 'jwt-null-split',
    title: 'Missing Authorization Header Split Crash',
    repoId: 'repo-auth',
    filePath: 'src/middleware/jwtValidator.ts',
    severity: 'high',
    errorMessage: "TypeError: Cannot read properties of undefined (reading 'split') at validateJwtToken (jwtValidator.ts:16:27)",
    stackTrace: `TypeError: Cannot read properties of undefined (reading 'split')
    at validateJwtToken (/app/user-auth-api/src/middleware/jwtValidator.ts:16:27)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)`,
  },
  {
    id: 'cart-off-by-one',
    title: 'Cart Inventory Loop Off-by-One Boundary',
    repoId: 'repo-cart',
    filePath: 'src/checkout/inventoryLock.ts',
    severity: 'medium',
    errorMessage: "TypeError: Cannot read properties of undefined (reading 'quantity') at reserveInventorySlots (inventoryLock.ts:18:14)",
    stackTrace: `TypeError: Cannot read properties of undefined (reading 'quantity')
    at reserveInventorySlots (/app/cart-orchestrator/src/checkout/inventoryLock.ts:18:14)
    at /app/cart-orchestrator/src/controllers/checkout.ts:52:11`,
  },
];

export const IngestModal: React.FC<IngestModalProps> = ({
  isOpen,
  onClose,
  repositories,
  onIngestSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'webhook'>('manual');
  const [selectedRepoId, setSelectedRepoId] = useState(repositories[0]?.id || 'repo-payments');
  const [filePath, setFilePath] = useState('src/services/stripeProcessor.ts');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('critical');
  const [errorMessage, setErrorMessage] = useState('');
  const [stackTrace, setStackTrace] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const loadPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setSelectedRepoId(preset.repoId);
    setFilePath(preset.filePath);
    setSeverity(preset.severity as any);
    setErrorMessage(preset.errorMessage);
    setStackTrace(preset.stackTrace);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!errorMessage.trim() || !stackTrace.trim()) return;

    setIsSubmitting(true);
    try {
      const endpoint = activeTab === 'manual' ? '/api/incidents/manual' : '/api/webhooks/sentry';
      const body = activeTab === 'manual'
        ? { errorMessage, stackTrace, repoId: selectedRepoId, filePath, severity }
        : { error_message: errorMessage, stack_trace: stackTrace, repoId: selectedRepoId, filePath, severity };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success && data.incident) {
        onIngestSuccess(data.incident);
        onClose();
      }
    } catch (err) {
      console.error('Failed to ingest error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl overflow-hidden text-[#C9D1D9]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0D1117] border-b border-[#21262D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#F0F6FC]">
                Ingest New Defect or Exception
              </h2>
              <p className="text-xs text-[#8B949E]">
                Trigger CodeMedic's autonomous self-healing pipeline
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

        {/* Preset Quick Load */}
        <div className="px-6 py-3 bg-[#090D13] border-b border-[#21262D]">
          <div className="flex items-center gap-1.5 text-xs text-[#8B949E] mb-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Quick-Load Realistic Scenarios:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_SCENARIOS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => loadPreset(preset)}
                className="text-left p-2 rounded-lg bg-[#161B22] hover:bg-[#21262D] border border-[#21262D] hover:border-[#30363D] transition-all cursor-pointer group"
              >
                <span className="block text-[11px] font-semibold text-[#F0F6FC] group-hover:text-blue-400 truncate">
                  {preset.title}
                </span>
                <span className="block text-[9px] font-mono text-[#8B949E] truncate">
                  {preset.filePath}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-6 pt-3 border-b border-[#21262D] gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'border-blue-400 text-blue-400 font-semibold'
                : 'border-transparent text-[#8B949E] hover:text-[#C9D1D9]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Manual Stack Trace Paste
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'webhook'
                ? 'border-blue-400 text-blue-400 font-semibold'
                : 'border-transparent text-[#8B949E] hover:text-[#C9D1D9]'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            Simulate Sentry / Datadog Webhook
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[55vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8B949E] mb-1">
                Target Repository
              </label>
              <select
                value={selectedRepoId}
                onChange={(e) => setSelectedRepoId(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-mono text-[#F0F6FC] outline-none"
              >
                {repositories.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8B949E] mb-1">
                Target File Path
              </label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="src/services/..."
                className="w-full bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-mono text-[#F0F6FC] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8B949E] mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-medium text-[#F0F6FC] outline-none"
              >
                <option value="critical">Critical (2 AM On-Call Alert)</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8B949E] mb-1">
              Error Message
            </label>
            <input
              type="text"
              required
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="TypeError: Cannot read properties of undefined..."
              className="w-full bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-mono text-[#F0F6FC] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8B949E] mb-1">
              Stack Trace
            </label>
            <textarea
              required
              rows={4}
              value={stackTrace}
              onChange={(e) => setStackTrace(e.target.value)}
              placeholder="Paste raw stack trace..."
              className="w-full bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-lg p-3 text-xs font-mono text-[#C9D1D9] outline-none leading-relaxed"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#21262D]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8B949E] hover:text-[#F0F6FC] bg-[#21262D] hover:bg-[#30363D] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !errorMessage.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Ingesting...' : 'Ingest & Start Healing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
