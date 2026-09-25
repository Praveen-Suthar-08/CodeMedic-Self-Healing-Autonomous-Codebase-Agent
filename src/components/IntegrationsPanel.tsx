import React, { useState } from 'react';
import { 
  Webhook, 
  Plus, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  RotateCw, 
  Trash2, 
  Pause, 
  Play, 
  Send, 
  Code, 
  ShieldCheck, 
  ExternalLink, 
  Activity, 
  AlertTriangle,
  Server,
  Zap,
  Terminal,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Repository, WebhookToken, Incident } from '../types';

interface IntegrationsPanelProps {
  repository: Repository;
  onUpdateRepo: (repoId: string, updates: Partial<Repository>) => void;
  onIngestSuccess?: (newIncident: Incident) => void;
}

export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({
  repository,
  onUpdateRepo,
  onIngestSuccess,
}) => {
  const [tokens, setTokens] = useState<WebhookToken[]>(repository.webhookTokens || []);
  const [revealedTokens, setRevealedTokens] = useState<Record<string, boolean>>({});
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [copiedUrlTokenId, setCopiedUrlTokenId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenProvider, setNewTokenProvider] = useState<'sentry' | 'datadog' | 'generic' | 'github_actions'>('sentry');
  const [newTokenEnv, setNewTokenEnv] = useState<'production' | 'staging' | 'development'>('production');

  // Active Setup Snippet Provider Tab
  const [activeSnippetTab, setActiveSnippetTab] = useState<'sentry' | 'datadog' | 'curl' | 'nodejs'>('sentry');

  // Test Dispatcher State
  const [testTokenId, setTestTokenId] = useState<string>(tokens[0]?.id || '');
  const [testScenario, setTestScenario] = useState<'stripe_async' | 'jwt_null' | 'inventory_bound'>('stripe_async');
  const [isDispatching, setIsDispatching] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    incidentId?: string;
    responsePayload?: any;
  }>({ status: 'idle', message: '' });

  const selectedTestToken = tokens.find((t) => t.id === testTokenId) || tokens[0];
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://api.codemedic.dev';

  const toggleReveal = (id: string) => {
    setRevealedTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, id: string, type: 'token' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedTokenId(id);
      setTimeout(() => setCopiedTokenId(null), 2000);
    } else {
      setCopiedUrlTokenId(id);
      setTimeout(() => setCopiedUrlTokenId(null), 2000);
    }
  };

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/repos/${repository.id}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTokenName || `${newTokenProvider.toUpperCase()} Listener (${newTokenEnv})`,
          provider: newTokenProvider,
          environment: newTokenEnv,
        }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        const updated = [data.token, ...tokens];
        setTokens(updated);
        onUpdateRepo(repository.id, { webhookTokens: updated });
        setShowGenerateModal(false);
        setNewTokenName('');
        setTestTokenId(data.token.id);
      }
    } catch (err) {
      console.error('Failed to generate token:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleStatus = async (token: WebhookToken) => {
    const nextStatus: 'active' | 'paused' = token.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/repos/${repository.id}/tokens/${token.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        const updated: WebhookToken[] = tokens.map((t) => (t.id === token.id ? { ...t, status: nextStatus } : t));
        setTokens(updated);
        onUpdateRepo(repository.id, { webhookTokens: updated });
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleRotateToken = async (token: WebhookToken) => {
    if (!confirm(`Are you sure you want to rotate "${token.name}"? The previous token secret will stop accepting payloads immediately.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/repos/${repository.id}/tokens/${token.id}/rotate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.token) {
        const updated = tokens.map((t) => (t.id === token.id ? data.token : t));
        setTokens(updated);
        onUpdateRepo(repository.id, { webhookTokens: updated });
      }
    } catch (err) {
      console.error('Failed to rotate token:', err);
    }
  };

  const handleDeleteToken = async (token: WebhookToken) => {
    if (!confirm(`Revoke and delete "${token.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/repos/${repository.id}/tokens/${token.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        const updated = tokens.filter((t) => t.id !== token.id);
        setTokens(updated);
        onUpdateRepo(repository.id, { webhookTokens: updated });
        if (testTokenId === token.id && updated.length > 0) {
          setTestTokenId(updated[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to delete token:', err);
    }
  };

  const handleDispatchTestPayload = async () => {
    if (!selectedTestToken) return;
    setIsDispatching(true);
    setTestResult({ status: 'idle', message: '' });

    let testPayload = {};
    if (testScenario === 'stripe_async') {
      testPayload = {
        title: "UnhandledPromiseRejection: Property id of undefined in stripeProcessor",
        error_message: "TypeError: Cannot read properties of Promise (reading 'id') at processCustomerCharge (stripeProcessor.ts:37:32)",
        stack_trace: `TypeError: Cannot read properties of Promise (reading 'id')\n    at processCustomerCharge (/app/payment-service/src/services/stripeProcessor.ts:37:32)\n    at async /app/payment-service/src/routes/checkout.ts:89:18`,
        filePath: "src/services/stripeProcessor.ts",
        severity: "critical",
        environment: selectedTestToken.environment,
        event_id: `evt_sim_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else if (testScenario === 'jwt_null') {
      testPayload = {
        title: "TypeError: Cannot read properties of undefined (reading 'split') in jwtValidator",
        error_message: "TypeError: Cannot read properties of undefined (reading 'split') at validateJwtToken (jwtValidator.ts:139:27)",
        stack_trace: `TypeError: Cannot read properties of undefined (reading 'split')\n    at validateJwtToken (/app/user-auth-api/src/middleware/jwtValidator.ts:139:27)\n    at Layer.handle (/app/node_modules/express/lib/router/layer.js:95:5)`,
        filePath: "src/middleware/jwtValidator.ts",
        severity: "high",
        environment: selectedTestToken.environment,
        event_id: `evt_sim_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      testPayload = {
        title: "TypeError: Cannot read properties of undefined (reading 'quantity') in inventoryLock",
        error_message: "TypeError: Cannot read properties of undefined (reading 'quantity') at reserveInventorySlots (inventoryLock.ts:204:16)",
        stack_trace: `TypeError: Cannot read properties of undefined (reading 'quantity')\n    at reserveInventorySlots (/app/cart-orchestrator/src/checkout/inventoryLock.ts:204:16)\n    at processCheckout (/app/cart-orchestrator/src/routes/cart.ts:55:12)`,
        filePath: "src/checkout/inventoryLock.ts",
        severity: "medium",
        environment: selectedTestToken.environment,
        event_id: `evt_sim_${Math.random().toString(36).substr(2, 9)}`,
      };
    }

    try {
      const res = await fetch(`/api/webhooks/listener/${selectedTestToken.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CodeMedic-Signature': selectedTestToken.secretSignatureKey || 'whsec_demo',
        },
        body: JSON.stringify(testPayload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          status: 'success',
          message: `HTTP 201 Created — Real-time crash ingested as incident ${data.incidentId}`,
          incidentId: data.incidentId,
          responsePayload: data,
        });
        // Update local token usage count
        const updated = tokens.map((t) =>
          t.id === selectedTestToken.id
            ? { ...t, ingestCount: t.ingestCount + 1, lastUsedAt: new Date().toISOString() }
            : t
        );
        setTokens(updated);
        onUpdateRepo(repository.id, { webhookTokens: updated });

        if (onIngestSuccess && data.incident) {
          onIngestSuccess(data.incident);
        }
      } else {
        setTestResult({
          status: 'error',
          message: `HTTP ${res.status} Error: ${data.error || 'Failed to ingest payload'}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: `Network Error: ${err.message}`,
      });
    } finally {
      setIsDispatching(false);
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'sentry':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-pink-500/10 text-pink-400 border border-pink-500/30 flex items-center gap-1">
            <Zap className="w-3 h-3 text-pink-400" />
            Sentry
          </span>
        );
      case 'datadog':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <Activity className="w-3 h-3 text-purple-400" />
            Datadog
          </span>
        );
      case 'github_actions':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Code className="w-3 h-3 text-amber-400" />
            CI / GitHub Actions
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Webhook className="w-3 h-3 text-blue-400" />
            Custom Webhook
          </span>
        );
    }
  };

  const totalIngested = tokens.reduce((sum, t) => sum + (t.ingestCount || 0), 0);
  const activeCount = tokens.filter((t) => t.status === 'active').length;

  return (
    <div className="space-y-6 text-[#C9D1D9]">
      {/* Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#21262D]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#F0F6FC] flex items-center gap-2">
                Real-Time Ingestion Listeners & Tokens
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                  {activeCount} Active Listeners
                </span>
              </h3>
              <p className="text-xs text-[#8B949E]">
                Stream live stack traces from Sentry, Datadog APM, and custom log sinks directly into CodeMedic for instant autonomous diagnosis.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-900/30 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Generate Listener Token
        </button>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-xl">
          <span className="text-[11px] text-[#8B949E] block mb-1">Active Listeners</span>
          <span className="text-lg font-mono font-bold text-[#F0F6FC]">
            {activeCount} <span className="text-xs font-normal text-[#8B949E]">/ {tokens.length}</span>
          </span>
        </div>

        <div className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-xl">
          <span className="text-[11px] text-[#8B949E] block mb-1">Total Ingested Crashes</span>
          <span className="text-lg font-mono font-bold text-blue-400">{totalIngested}</span>
        </div>

        <div className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-xl">
          <span className="text-[11px] text-[#8B949E] block mb-1">Ingestion Protocol</span>
          <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
            <Lock className="w-3.5 h-3.5" />
            HMAC-SHA256 Signed
          </span>
        </div>

        <div className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-xl">
          <span className="text-[11px] text-[#8B949E] block mb-1">Sandbox Isolation</span>
          <span className="text-xs font-mono font-semibold text-purple-400 flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero Secret Access
          </span>
        </div>
      </div>

      {/* Webhook Listener Tokens List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">
            Configured Listener Tokens ({tokens.length})
          </label>
          <span className="text-[11px] text-[#8B949E]">
            Target Repo: <strong className="text-[#C9D1D9]">{repository.name}</strong>
          </span>
        </div>

        {tokens.length === 0 ? (
          <div className="p-8 text-center bg-[#0D1117] border border-dashed border-[#21262D] rounded-xl space-y-3">
            <Server className="w-8 h-8 text-[#8B949E] mx-auto opacity-50" />
            <p className="text-xs text-[#8B949E]">
              No active webhook listener tokens found for this repository.
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-3.5 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg cursor-pointer"
            >
              Generate your first token
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => {
              const isRevealed = !!revealedTokens[token.id];
              const webhookUrl = `${baseUrl}/api/webhooks/listener/${token.token}`;

              return (
                <div
                  key={token.id}
                  className={`p-4 bg-[#0D1117] border rounded-xl transition-all ${
                    token.status === 'active'
                      ? 'border-[#21262D] hover:border-[#30363D]'
                      : 'border-amber-500/30 opacity-75'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#21262D]">
                    <div className="flex items-center gap-3">
                      {getProviderBadge(token.provider)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-[#F0F6FC] font-mono">
                            {token.name}
                          </h4>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#21262D] text-[#8B949E]">
                            {token.environment}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8B949E] mt-0.5">
                          Created {new Date(token.createdAt).toLocaleDateString()} · Ingested {token.ingestCount} payloads
                          {token.lastUsedAt && ` · Last seen ${new Date(token.lastUsedAt).toLocaleTimeString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-auto">
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          token.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            token.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                          }`}
                        />
                        {token.status.toUpperCase()}
                      </span>

                      <button
                        onClick={() => handleToggleStatus(token)}
                        title={token.status === 'active' ? 'Pause Listener' : 'Activate Listener'}
                        className="p-1.5 rounded-lg bg-[#161B22] border border-[#21262D] text-[#8B949E] hover:text-[#C9D1D9] cursor-pointer"
                      >
                        {token.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>

                      <button
                        onClick={() => handleRotateToken(token)}
                        title="Rotate Secret Token"
                        className="p-1.5 rounded-lg bg-[#161B22] border border-[#21262D] text-[#8B949E] hover:text-[#C9D1D9] cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteToken(token)}
                        title="Revoke Token"
                        className="p-1.5 rounded-lg bg-[#161B22] border border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Token Secret & Ingestion URL Fields */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Token Secret */}
                    <div className="p-2.5 bg-[#161B22] border border-[#21262D] rounded-lg">
                      <div className="flex items-center justify-between text-[11px] text-[#8B949E] mb-1">
                        <span className="font-semibold flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-blue-400" />
                          Listener Secret Token
                        </span>
                        <button
                          onClick={() => toggleReveal(token.id)}
                          className="flex items-center gap-1 text-[10px] text-blue-400 hover:underline cursor-pointer"
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {isRevealed ? 'Hide' : 'Reveal'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-[#F0F6FC] truncate">
                          {isRevealed ? token.token : `${token.token.slice(0, 7)}••••••••••••••••`}
                        </span>
                        <button
                          onClick={() => handleCopy(token.token, token.id, 'token')}
                          className="p-1 rounded bg-[#21262D] text-[#8B949E] hover:text-[#F0F6FC] cursor-pointer shrink-0"
                          title="Copy Token"
                        >
                          {copiedTokenId === token.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Ingestion Webhook URL */}
                    <div className="p-2.5 bg-[#161B22] border border-[#21262D] rounded-lg">
                      <div className="flex items-center justify-between text-[11px] text-[#8B949E] mb-1">
                        <span className="font-semibold flex items-center gap-1.5">
                          <Webhook className="w-3 h-3 text-emerald-400" />
                          Endpoint Ingest URL
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">POST Ready</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-emerald-400 truncate">
                          {webhookUrl}
                        </span>
                        <button
                          onClick={() => handleCopy(webhookUrl, token.id, 'url')}
                          className="p-1 rounded bg-[#21262D] text-[#8B949E] hover:text-[#F0F6FC] cursor-pointer shrink-0"
                          title="Copy Ingestion URL"
                        >
                          {copiedUrlTokenId === token.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Webhook Test Dispatcher Sandbox */}
      <div className="p-5 bg-[#161B22] border border-[#21262D] rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#21262D]">
          <div>
            <h4 className="text-xs font-semibold text-[#F0F6FC] flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Live Ingestion Test Dispatcher
            </h4>
            <p className="text-[11px] text-[#8B949E]">
              Dispatch simulated crash events to verify your listener tokens and self-healing pipeline response in real-time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#8B949E] block mb-1">
              Select Target Listener Token
            </label>
            <select
              value={testTokenId}
              onChange={(e) => setTestTokenId(e.target.value)}
              disabled={tokens.length === 0}
              className="w-full bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-mono text-[#F0F6FC] outline-none"
            >
              {tokens.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.provider.toUpperCase()}) - {t.environment}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#8B949E] block mb-1">
              Test Crash Scenario
            </label>
            <select
              value={testScenario}
              onChange={(e) => setTestScenario(e.target.value as any)}
              className="w-full bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-mono text-[#F0F6FC] outline-none"
            >
              <option value="stripe_async">Stripe Payment: Missing Await Unhandled Rejection</option>
              <option value="jwt_null">Auth JWT: Missing Bearer Header Null Split</option>
              <option value="inventory_bound">Cart Checkout: Off-by-One Array Boundary Error</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleDispatchTestPayload}
              disabled={isDispatching || tokens.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              {isDispatching ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Dispatching Payload...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Test Ingestion
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test Result Terminal Box */}
        {testResult.status !== 'idle' && (
          <div
            className={`p-3.5 rounded-lg border text-xs font-mono transition-all animate-fadeIn ${
              testResult.status === 'success'
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/20 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
                {testResult.message}
              </span>
              {testResult.incidentId && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
                  Incident ID: {testResult.incidentId}
                </span>
              )}
            </div>
            <p className="text-[11px] opacity-80 mt-1">
              {testResult.status === 'success'
                ? 'Payload verified & passed to Gemini AI diagnostic pipeline. Ingestion telemetry counter updated.'
                : 'Check token validity or header credentials.'}
            </p>
          </div>
        )}
      </div>

      {/* Integration Guides & Snippets */}
      <div className="p-5 bg-[#161B22] border border-[#21262D] rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#21262D]">
          <div>
            <h4 className="text-xs font-semibold text-[#F0F6FC] flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-400" />
              Quick Integration Guides & Webhook Snippets
            </h4>
            <p className="text-[11px] text-[#8B949E]">
              Copy-paste integration configuration into your monitoring stack or backend logging pipeline.
            </p>
          </div>

          <div className="flex bg-[#0D1117] p-1 rounded-lg border border-[#21262D] text-xs">
            <button
              onClick={() => setActiveSnippetTab('sentry')}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                activeSnippetTab === 'sentry'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              Sentry
            </button>
            <button
              onClick={() => setActiveSnippetTab('datadog')}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                activeSnippetTab === 'datadog'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              Datadog
            </button>
            <button
              onClick={() => setActiveSnippetTab('curl')}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                activeSnippetTab === 'curl'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveSnippetTab('nodejs')}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                activeSnippetTab === 'nodejs'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#8B949E] hover:text-[#C9D1D9]'
              }`}
            >
              Node.js
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="relative">
          {activeSnippetTab === 'sentry' && (
            <div className="space-y-2">
              <div className="text-[11px] text-[#8B949E] flex items-center justify-between">
                <span>Configure in Sentry &gt; Settings &gt; Integrations &gt; Webhooks &gt; Alert Rule</span>
                <span className="text-[10px] text-pink-400 font-mono">Payload format: Sentry Webhook JSON</span>
              </div>
              <pre className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto">
{`# Sentry Alert Rule Webhook Configuration
Webhook URL: ${baseUrl}/api/webhooks/listener/${selectedTestToken?.token || 'YOUR_TOKEN_HERE'}
HTTP Method: POST
Custom Header: X-CodeMedic-Signature: ${selectedTestToken?.secretSignatureKey || 'YOUR_SECRET_KEY'}

# Sample Payload Structure:
{
  "event_id": "$EVENT_ID",
  "project_name": "${repository.name}",
  "message": "$ERROR_MESSAGE",
  "level": "fatal",
  "culprit": "$CULPRIT_FUNCTION",
  "stack_trace": "$STACK_TRACE_FRAMES"
}`}
              </pre>
            </div>
          )}

          {activeSnippetTab === 'datadog' && (
            <div className="space-y-2">
              <div className="text-[11px] text-[#8B949E] flex items-center justify-between">
                <span>Configure in Datadog &gt; Integrations &gt; Webhooks &gt; Add Webhook</span>
                <span className="text-[10px] text-purple-400 font-mono">Payload format: Datadog APM Alert</span>
              </div>
              <pre className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-lg text-xs font-mono text-purple-300 overflow-x-auto">
{`# Datadog Webhook Notification Channel
URL: ${baseUrl}/api/webhooks/listener/${selectedTestToken?.token || 'YOUR_TOKEN_HERE'}
Payload:
{
  "title": "$EVENT_TITLE",
  "errorMessage": "$EVENT_MSG",
  "stackTrace": "$LOGS_STACK_TRACE",
  "severity": "critical",
  "service": "${repository.name}",
  "env": "${selectedTestToken?.environment || 'production'}"
}`}
              </pre>
            </div>
          )}

          {activeSnippetTab === 'curl' && (
            <div className="space-y-2">
              <div className="text-[11px] text-[#8B949E]">
                Test direct ingestion from your CLI or bash script:
              </div>
              <pre className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-lg text-xs font-mono text-blue-300 overflow-x-auto">
{`curl -X POST \\
  "${baseUrl}/api/webhooks/listener/${selectedTestToken?.token || 'YOUR_TOKEN_HERE'}" \\
  -H "Content-Type: application/json" \\
  -H "X-CodeMedic-Signature: ${selectedTestToken?.secretSignatureKey || 'YOUR_SECRET_KEY'}" \\
  -d '{
    "errorMessage": "Uncaught TypeError: Cannot read properties of undefined in processRequest",
    "stackTrace": "TypeError: Cannot read properties of undefined\\n    at processRequest (/app/src/index.ts:42:15)",
    "filePath": "${Object.keys(repository.files)[0] || 'src/index.ts'}",
    "severity": "critical"
  }'`}
              </pre>
            </div>
          )}

          {activeSnippetTab === 'nodejs' && (
            <div className="space-y-2">
              <div className="text-[11px] text-[#8B949E]">
                Catch unhandled exceptions and ship to CodeMedic automatically in Express / Node.js:
              </div>
              <pre className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-lg text-xs font-mono text-[#F0F6FC] overflow-x-auto">
{`// CodeMedic Automatic Process Crash Interceptor
process.on('unhandledRejection', (reason: any) => {
  fetch('${baseUrl}/api/webhooks/listener/${selectedTestToken?.token || 'YOUR_TOKEN_HERE'}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      errorMessage: reason?.message || String(reason),
      stackTrace: reason?.stack || 'No stack trace captured',
      severity: 'critical',
      environment: process.env.NODE_ENV || 'production',
    }),
  }).catch(console.error);
});`}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Generate New Token */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#21262D]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F0F6FC]">
                    Generate Webhook Listener Token
                  </h3>
                  <p className="text-[11px] text-[#8B949E]">
                    Assign a scoped ingestion token to {repository.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-[#8B949E] hover:text-[#F0F6FC] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateToken} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#C9D1D9]">
                  Token Description / Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. US-East Sentry Production Listener"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-mono text-[#F0F6FC] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#C9D1D9]">
                  Error Monitoring Source Provider
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sentry', label: 'Sentry', icon: Zap },
                    { id: 'datadog', label: 'Datadog APM', icon: Activity },
                    { id: 'generic', label: 'Custom / Log Sink', icon: Webhook },
                    { id: 'github_actions', label: 'CI / GitHub Actions', icon: Code },
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setNewTokenProvider(p.id as any)}
                        className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                          newTokenProvider === p.id
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                            : 'bg-[#0D1117] border-[#21262D] text-[#8B949E] hover:text-[#C9D1D9]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#C9D1D9]">
                  Target Deployment Environment
                </label>
                <select
                  value={newTokenEnv}
                  onChange={(e) => setNewTokenEnv(e.target.value as any)}
                  className="w-full bg-[#0D1117] border border-[#21262D] focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-mono text-[#F0F6FC] outline-none"
                >
                  <option value="production">Production (High Priority Alerts)</option>
                  <option value="staging">Staging / Preview</option>
                  <option value="development">Development / Local</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#21262D] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#8B949E] hover:text-[#F0F6FC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Generate Token
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
