export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 
  | 'detected' 
  | 'context_pulled'
  | 'diagnosing' 
  | 'fix_generated' 
  | 'testing' 
  | 'awaiting_approval' 
  | 'auto_pr_created'
  | 'merged' 
  | 'rejected' 
  | 'escalated';

export type IncidentSource = 'sentry' | 'datadog' | 'manual' | 'webhook' | 'ci_cd';

export interface ReasoningStep {
  id: string;
  step: string;
  thought: string;
  durationMs: number;
  timestamp: string;
  status: 'completed' | 'active' | 'pending' | 'failed';
  evidence?: string;
}

export interface ProposedFix {
  diff: string;
  filesChanged: string[];
  originalCode: string;
  fixedCode: string;
  explanation: string;
  confidenceSelfAssessment: number; // 0 to 1
  patchSummary: string;
}

export interface TestCaseResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  error?: string;
}

export interface TestResults {
  passed: number;
  failed: number;
  total: number;
  durationMs: number;
  log: string;
  testCases: TestCaseResult[];
  environment: string;
  exitCode: number;
}

export interface ConfidenceBreakdown {
  testPassWeight: number;      // e.g. 0.60
  aiCertaintyWeight: number;   // e.g. 0.35
  repoHistoryPenalty: number;  // e.g. -0.05 if frequent rejection in this file
  calculatedScore: number;     // 0 to 1
  rationale: string;
}

export interface Incident {
  id: string;
  title: string;
  source: IncidentSource;
  errorMessage: string;
  stackTrace: string;
  repoId: string;
  repoName: string;
  filePath: string;
  lineRange: { start: number; end: number };
  severity: IncidentSeverity;
  status: IncidentStatus;
  currentPipelineStage: number; // 0 to 6
  diagnosis?: {
    rootCause: string;
    affectedFiles: string[];
    riskLevel: string;
    reproductionSteps: string[];
  };
  proposedFix?: ProposedFix;
  confidenceScore: number;
  confidenceBreakdown?: ConfidenceBreakdown;
  testResults?: TestResults;
  reasoningTrail: ReasoningStep[];
  prUrl?: string | null;
  prNumber?: number | null;
  branchName?: string | null;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
  feedbackNotes?: string | null;
  isAutoMerged?: boolean;
  createdAt: string;
  resolvedAt?: string | null;
  environment: 'production' | 'staging' | 'preview' | 'development';
}

export interface WebhookToken {
  id: string;
  name: string;
  provider: 'sentry' | 'datadog' | 'generic' | 'github_actions';
  token: string;
  secretSignatureKey?: string;
  createdAt: string;
  lastUsedAt?: string | null;
  status: 'active' | 'paused' | 'revoked';
  ingestCount: number;
  environment: 'production' | 'staging' | 'development';
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
  githubUrl: string;
  branch: string;
  autoMergeThreshold: number; // e.g. 0.88
  testCommand: string;
  language: string;
  files: Record<string, string>;
  stats: {
    totalIncidents: number;
    autoFixed: number;
    escalated: number;
    rejected: number;
    accuracyRate: number; // 0 to 1
  };
  riskAreas: Record<string, number>; // filePath -> penalty/risk factor
  webhookTokens?: WebhookToken[];
}

export interface AuditLogEntry {
  id: string;
  incidentId: string;
  incidentTitle: string;
  action: 'INGESTED' | 'DIAGNOSED' | 'FIX_GENERATED' | 'SANDBOX_TEST_PASSED' | 'SANDBOX_TEST_FAILED' | 'SANDBOX_RETESTED' | 'AUTO_PR_OPENED' | 'HUMAN_APPROVED' | 'HUMAN_REJECTED' | 'DEVELOPER_NOTE_ADDED' | 'THRESHOLD_UPDATED' | 'CALIBRATION_ADJUSTED';
  performedBy: string;
  userRole: 'autonomous_agent' | 'developer' | 'manager' | 'admin';
  timestamp: string;
  details: string;
  complianceHash: string;
}

export interface AdminMetrics {
  totalIncidents: number;
  autoFixedCount: number;
  manualReviewedCount: number;
  escalatedCount: number;
  accuracyRate: number;
  avgTimeToFixSeconds: number;
  estimatedHoursSaved: number;
  geminiCallsCount: number;
  estimatedApiCostUsd: number;
  accuracyTrend: Array<{
    date: string;
    accuracy: number;
    volume: number;
    autoMerged: number;
  }>;
}

export interface OnCallNotification {
  id: string;
  incidentId: string;
  title: string;
  errorMessage: string;
  repoName: string;
  severity: IncidentSeverity;
  timestamp: string;
  confidenceScore: number;
  read: boolean;
  actionTaken?: 'approved' | 'rejected' | 'dismissed';
}

export interface RepoConsumptionMetrics {
  repoId: string;
  repoName: string;
  totalSurgeries: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  avgTokensPerSurgery: number;
  topModel: string;
}

export interface IncidentConsumptionMetrics {
  incidentId: string;
  title: string;
  repoName: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  stagesExecuted: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  timestamp: string;
}

export interface AiConsumptionReport {
  summary: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    totalCostUsd: number;
    monthlyBudgetUsd: number;
    budgetPercentUsed: number;
    totalSurgeries: number;
    avgCostPerSurgeryUsd: number;
    avgTokensPerSurgery: number;
    cacheHitRatioPercent: number;
    projectedMonthlyCostUsd: number;
    modelDistribution: Record<string, number>;
  };
  byRepository: RepoConsumptionMetrics[];
  byIncident: IncidentConsumptionMetrics[];
  dailyTrend: Array<{
    date: string;
    tokens: number;
    costUsd: number;
    surgeries: number;
  }>;
}
