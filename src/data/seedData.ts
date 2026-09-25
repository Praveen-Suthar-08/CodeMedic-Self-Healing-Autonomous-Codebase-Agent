import { Incident, Repository, AuditLogEntry } from '../types';

export const SEED_REPOSITORIES: Repository[] = [
  {
    id: 'repo-payments',
    name: 'payment-service',
    owner: 'acme-corp',
    githubUrl: 'https://github.com/acme-corp/payment-service',
    branch: 'main',
    autoMergeThreshold: 0.90,
    testCommand: 'npm test -- --coverage',
    language: 'TypeScript',
    stats: {
      totalIncidents: 18,
      autoFixed: 15,
      escalated: 2,
      rejected: 1,
      accuracyRate: 0.94,
    },
    riskAreas: {
      'src/services/stripeProcessor.ts': 0.02,
      'src/webhooks/reconciliation.ts': 0.08,
    },
    webhookTokens: [
      {
        id: 'tok-sent-01',
        name: 'Production Sentry Ingest',
        provider: 'sentry',
        token: 'cm_sec_9f83a2b109e74d6c',
        secretSignatureKey: 'whsec_9941a87bf01e',
        createdAt: '2026-09-10T14:32:00Z',
        lastUsedAt: '2026-09-25T04:12:00Z',
        status: 'active',
        ingestCount: 47,
        environment: 'production',
      },
      {
        id: 'tok-dd-02',
        name: 'Datadog APM Crash Webhook',
        provider: 'datadog',
        token: 'cm_sec_34c891ab7720def3',
        secretSignatureKey: 'whsec_dd_8829aa71',
        createdAt: '2026-09-12T09:15:00Z',
        lastUsedAt: '2026-09-24T18:44:00Z',
        status: 'active',
        ingestCount: 19,
        environment: 'production',
      },
      {
        id: 'tok-gen-03',
        name: 'Staging Kubernetes Log Forwarder',
        provider: 'generic',
        token: 'cm_sec_782ef01a6b334812',
        secretSignatureKey: 'whsec_k8s_9918bc2a',
        createdAt: '2026-09-18T11:00:00Z',
        lastUsedAt: '2026-09-22T08:30:00Z',
        status: 'paused',
        ingestCount: 5,
        environment: 'staging',
      }
    ],
    files: {
      'src/services/stripeProcessor.ts': `import { Stripe } from 'stripe';
import { db } from '../db/client';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

interface ProcessPaymentParams {
  customerId: string;
  amountInCents: number;
  currency: string;
  paymentMethodId: string;
  idempotencyKey?: string;
}

export async function processCustomerCharge(params: ProcessPaymentParams) {
  const { customerId, amountInCents, currency, paymentMethodId, idempotencyKey } = params;

  logger.info('Initiating customer charge', { customerId, amountInCents });

  if (amountInCents <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    customer: customerId,
    payment_method: paymentMethodId,
    confirm: false,
  });

  // BUG: Missing await causes unhandled promise rejection and race condition with DB write
  const confirmedIntent = stripe.paymentIntents.confirm(paymentIntent.id, {
    payment_method: paymentMethodId,
  });

  // Save transaction to database
  const record = await db.transactions.create({
    intentId: confirmedIntent.id,
    customerId,
    amount: amountInCents,
    status: confirmedIntent.status,
    createdAt: new Date(),
  });

  return { success: true, transactionId: record.id, status: confirmedIntent.status };
}`,
      'src/services/__tests__/stripeProcessor.test.ts': `import { processCustomerCharge } from '../stripeProcessor';

describe('stripeProcessor', () => {
  it('should successfully confirm payment intent and record transaction with valid status', async () => {
    const result = await processCustomerCharge({
      customerId: 'cus_994182',
      amountInCents: 4900,
      currency: 'usd',
      paymentMethodId: 'pm_card_visa',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('succeeded');
  });

  it('should reject non-positive amounts', async () => {
    await expect(
      processCustomerCharge({
        customerId: 'cus_994182',
        amountInCents: -50,
        currency: 'usd',
        paymentMethodId: 'pm_card_visa',
      })
    ).rejects.toThrow('Payment amount must be greater than zero.');
  });
});`
    }
  },
  {
    id: 'repo-auth',
    name: 'user-auth-api',
    owner: 'acme-corp',
    githubUrl: 'https://github.com/acme-corp/user-auth-api',
    branch: 'main',
    autoMergeThreshold: 0.85,
    testCommand: 'npm run test:unit',
    language: 'TypeScript',
    stats: {
      totalIncidents: 24,
      autoFixed: 22,
      escalated: 1,
      rejected: 1,
      accuracyRate: 0.95,
    },
    riskAreas: {
      'src/middleware/jwtValidator.ts': 0.01,
      'src/routes/session.ts': 0.04,
    },
    webhookTokens: [
      {
        id: 'tok-auth-sentry-01',
        name: 'Auth Cluster Sentry Webhook',
        provider: 'sentry',
        token: 'cm_sec_55a91b2c4e8890ff',
        secretSignatureKey: 'whsec_auth_7731a',
        createdAt: '2026-09-08T10:00:00Z',
        lastUsedAt: '2026-09-25T01:10:00Z',
        status: 'active',
        ingestCount: 31,
        environment: 'production',
      },
      {
        id: 'tok-auth-ci-02',
        name: 'GitHub Actions E2E Failures',
        provider: 'github_actions',
        token: 'cm_sec_884100cfa91723e4',
        secretSignatureKey: 'whsec_gha_4421cc',
        createdAt: '2026-09-15T16:20:00Z',
        lastUsedAt: '2026-09-23T12:00:00Z',
        status: 'active',
        ingestCount: 8,
        environment: 'development',
      }
    ],
    files: {
      'src/middleware/jwtValidator.ts': `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export function validateJwtToken(req: Request, res: Response, next: NextFunction) {
  // BUG: req.headers.authorization can be undefined when client calls without Bearer header
  const authHeader = req.headers.authorization || (req.headers['authorization'] as string);
  
  // Directly calling split on undefined throws TypeError
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({ error: 'Invalid authorization token format' });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or malformed' });
  }
}`,
      'src/middleware/__tests__/jwtValidator.test.ts': `import { validateJwtToken } from '../jwtValidator';

describe('validateJwtToken middleware', () => {
  it('should return 401 gracefully if authorization header is missing', () => {
    const req = { headers: {} } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();

    validateJwtToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });
});`
    }
  },
  {
    id: 'repo-cart',
    name: 'cart-orchestrator',
    owner: 'acme-corp',
    githubUrl: 'https://github.com/acme-corp/cart-orchestrator',
    branch: 'main',
    autoMergeThreshold: 0.88,
    testCommand: 'cargo test / jest',
    language: 'TypeScript',
    stats: {
      totalIncidents: 12,
      autoFixed: 10,
      escalated: 1,
      rejected: 1,
      accuracyRate: 0.91,
    },
    riskAreas: {
      'src/checkout/inventoryLock.ts': 0.05,
    },
    webhookTokens: [
      {
        id: 'tok-cart-sent-01',
        name: 'Cart Sentry Ingest Listener',
        provider: 'sentry',
        token: 'cm_sec_7718aa0029bcf814',
        secretSignatureKey: 'whsec_cart_9921ef',
        createdAt: '2026-09-14T09:40:00Z',
        lastUsedAt: '2026-09-24T22:15:00Z',
        status: 'active',
        ingestCount: 14,
        environment: 'production',
      }
    ],
    files: {
      'src/checkout/inventoryLock.ts': `export interface CartItem {
  sku: string;
  quantity: number;
  warehouseId: string;
}

export async function reserveInventorySlots(items: CartItem[], timeoutMs: number = 5000) {
  if (!items || items.length === 0) {
    return { reserved: true, allocated: [] };
  }

  const allocated: string[] = [];

  // BUG: Off-by-one error with <= items.length accesses out-of-bounds undefined item at last index
  for (let i = 0; i <= items.length; i++) {
    const item = items[i];
    if (item.quantity <= 0) {
      continue;
    }
    allocated.push(\`slot_\${item.warehouseId}_\${item.sku}_\${item.quantity}\`);
  }

  return { reserved: true, allocated };
}`
    }
  }
];

export const SEED_INCIDENTS: Incident[] = [
  {
    id: 'inc-9941',
    title: 'UnhandledPromiseRejection: Property id of undefined in stripeProcessor',
    source: 'sentry',
    errorMessage: "TypeError: Cannot read properties of Promise (reading 'id') at processCustomerCharge (stripeProcessor.ts:37:32)",
    stackTrace: `TypeError: Cannot read properties of Promise (reading 'id')
    at processCustomerCharge (/app/payment-service/src/services/stripeProcessor.ts:37:32)
    at async /app/payment-service/src/routes/checkout.ts:89:18
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:144:13)
    at Route.dispatch (/app/node_modules/express/lib/router/route.js:114:3)`,
    repoId: 'repo-payments',
    repoName: 'payment-service',
    filePath: 'src/services/stripeProcessor.ts',
    lineRange: { start: 29, end: 41 },
    severity: 'critical',
    status: 'awaiting_approval',
    currentPipelineStage: 5,
    environment: 'production',
    createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    confidenceScore: 0.96,
    diagnosis: {
      rootCause: "On line 31, 'stripe.paymentIntents.confirm(...)' returns a Promise that is not awaited. Consequently, 'confirmedIntent' holds a pending Promise object rather than the resolved PaymentIntent. Accessing 'confirmedIntent.id' on line 37 returns undefined or crashes, and causes a race condition before DB persistence.",
      affectedFiles: ['src/services/stripeProcessor.ts'],
      riskLevel: 'Low (localized asynchronous invocation fix)',
      reproductionSteps: [
        'Invoke processCustomerCharge with valid customerId and paymentMethodId',
        'Observe confirmedIntent is an unresolved Promise',
        'Observe runtime crash at db.transactions.create accessing confirmedIntent.id'
      ]
    },
    proposedFix: {
      diff: `@@ -30,4 +30,4 @@
   // Create payment intent
-  // BUG: Missing await causes unhandled promise rejection and race condition with DB write
-  const confirmedIntent = stripe.paymentIntents.confirm(paymentIntent.id, {
+  // Await the confirmation promise to obtain the resolved PaymentIntent object
+  const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
     payment_method: paymentMethodId,
   });`,
      filesChanged: ['src/services/stripeProcessor.ts'],
      originalCode: `  // BUG: Missing await causes unhandled promise rejection and race condition with DB write
  const confirmedIntent = stripe.paymentIntents.confirm(paymentIntent.id, {
    payment_method: paymentMethodId,
  });`,
      fixedCode: `  // Await the confirmation promise to obtain the resolved PaymentIntent object
  const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
    payment_method: paymentMethodId,
  });`,
      explanation: "Added the missing 'await' keyword to stripe.paymentIntents.confirm(...). This guarantees confirmedIntent is fully resolved before accessing .id and .status for the database transaction record.",
      confidenceSelfAssessment: 0.98,
      patchSummary: 'Add missing await to stripe.paymentIntents.confirm call'
    },
    confidenceBreakdown: {
      testPassWeight: 0.60,
      aiCertaintyWeight: 0.38,
      repoHistoryPenalty: -0.02,
      calculatedScore: 0.96,
      rationale: '100% test suite pass (2/2 tests) in isolated Docker sandbox + high Gemini syntactic certainty (98%) - low repo path risk factor (2%).'
    },
    testResults: {
      passed: 2,
      failed: 0,
      total: 2,
      durationMs: 840,
      environment: 'Docker Sandbox node:20-alpine (Network: None, Memory: 512MB)',
      exitCode: 0,
      log: `[sandbox-runner] Initializing container sandbox #c8419f2...
[sandbox-runner] Mounting src/services/stripeProcessor.ts with patch #p9941
[sandbox-runner] Executing test runner: npm test -- --coverage
PASS src/services/__tests__/stripeProcessor.test.ts
  stripeProcessor
    ✓ should successfully confirm payment intent and record transaction with valid status (412 ms)
    ✓ should reject non-positive amounts (18 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        0.84 s
Ran all test suites.`,
      testCases: [
        { name: 'stripeProcessor › confirm payment intent and record transaction', status: 'passed', durationMs: 412 },
        { name: 'stripeProcessor › reject non-positive amounts', status: 'passed', durationMs: 18 }
      ]
    },
    reasoningTrail: [
      {
        id: 'step-1',
        step: '1. Ingestion & Signature Parse',
        thought: "Parsed Sentry event #9941. Identified uncaught TypeError: Cannot read properties of Promise (reading 'id') originating from stripeProcessor.ts:37:32 under production load.",
        durationMs: 120,
        timestamp: new Date(Date.now() - 1000 * 60 * 13).toLocaleTimeString(),
        status: 'completed',
        evidence: 'Event ID: sentry_evt_88921a | Level: Critical'
      },
      {
        id: 'step-2',
        step: '2. AST & Context Extraction',
        thought: "Pulled src/services/stripeProcessor.ts lines 20-50 from GitHub main branch. Inspected function signature of processCustomerCharge(params: ProcessPaymentParams).",
        durationMs: 240,
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
        status: 'completed',
        evidence: 'Target file: src/services/stripeProcessor.ts (48 lines)'
      },
      {
        id: 'step-3',
        step: '3. Root Cause Diagnosis (Gemini Flash)',
        thought: "Analyzed control flow on line 31. Detected call to stripe.paymentIntents.confirm without await. In async functions, unawaited promises assign a Promise instance to confirmedIntent, so property accesses on lines 37-39 evaluate against Promise.prototype where .id is undefined.",
        durationMs: 480,
        timestamp: new Date(Date.now() - 1000 * 60 * 11).toLocaleTimeString(),
        status: 'completed',
        evidence: 'Identified missing await on Promise-returning SDK method'
      },
      {
        id: 'step-4',
        step: '4. Minimal Diff Generation',
        thought: "Constructed surgical 1-line diff adding 'await' before stripe.paymentIntents.confirm. Verified no unwanted side effects or unrelated refactorings are introduced.",
        durationMs: 310,
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toLocaleTimeString(),
        status: 'completed',
        evidence: 'Diff: + const confirmedIntent = await stripe.paymentIntents.confirm...'
      },
      {
        id: 'step-5',
        step: '5. Isolated Docker Sandbox Execution',
        thought: "Spawned ephemeral test container (network disabled, memory 512MB). Applied diff patch and ran test suite 'npm test -- --coverage'. All 2 assertions passed in 840ms with 0 errors.",
        durationMs: 840,
        timestamp: new Date(Date.now() - 1000 * 60 * 9).toLocaleTimeString(),
        status: 'completed',
        evidence: 'Pass: 2/2 tests (100% pass rate)'
      },
      {
        id: 'step-6',
        step: '6. Safety Gate & Confidence Calibration',
        thought: "Calculated aggregate confidence score: 0.96 (Pass Rate: 1.00 * 0.60 + AI Certainty: 0.98 * 0.38 - File Risk: 0.02). Threshold is 0.90. Fix verified and ready for 1-click human merge or auto-PR.",
        durationMs: 110,
        timestamp: new Date(Date.now() - 1000 * 60 * 8).toLocaleTimeString(),
        status: 'completed',
        evidence: 'Confidence: 96% >= Threshold: 90%'
      }
    ]
  },
  {
    id: 'inc-9942',
    title: 'TypeError: Cannot read properties of undefined (reading split) in jwtValidator',
    source: 'datadog',
    errorMessage: "TypeError: Cannot read properties of undefined (reading 'split') at validateJwtToken (jwtValidator.ts:16:27)",
    stackTrace: `TypeError: Cannot read properties of undefined (reading 'split')
    at validateJwtToken (/app/user-auth-api/src/middleware/jwtValidator.ts:16:27)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/app/node_modules/express/lib/router/index.js:317:13)
    at /app/node_modules/express/lib/router/index.js:284:7`,
    repoId: 'repo-auth',
    repoName: 'user-auth-api',
    filePath: 'src/middleware/jwtValidator.ts',
    lineRange: { start: 10, end: 25 },
    severity: 'high',
    status: 'auto_pr_created',
    currentPipelineStage: 6,
    environment: 'production',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    confidenceScore: 0.95,
    prUrl: 'https://github.com/acme-corp/user-auth-api/pull/142',
    prNumber: 142,
    branchName: 'codemedic/fix-jwt-null-split-9942',
    diagnosis: {
      rootCause: "In validateJwtToken, 'authHeader' is retrieved from req.headers.authorization without an initial presence check. When incoming HTTP requests omit the Authorization header, authHeader is undefined, and calling .split(' ') throws an unhandled TypeError.",
      affectedFiles: ['src/middleware/jwtValidator.ts'],
      riskLevel: 'Low (defensive guard clause)',
      reproductionSteps: [
        'Send GET request to protected endpoint without Authorization header',
        'Observe server throws TypeError instead of returning 401 Unauthorized'
      ]
    },
    proposedFix: {
      diff: `@@ -13,4 +13,8 @@
   const authHeader = req.headers.authorization || (req.headers['authorization'] as string);
   
+  if (!authHeader) {
+    return res.status(401).json({ error: 'Authorization header is required' });
+  }
+  
   // Directly calling split on undefined throws TypeError
   const parts = authHeader.split(' ');`,
      filesChanged: ['src/middleware/jwtValidator.ts'],
      originalCode: `  const authHeader = req.headers.authorization || (req.headers['authorization'] as string);
  
  // Directly calling split on undefined throws TypeError
  const parts = authHeader.split(' ');`,
      fixedCode: `  const authHeader = req.headers.authorization || (req.headers['authorization'] as string);
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is required' });
  }
  
  const parts = authHeader.split(' ');`,
      explanation: 'Added guard clause ensuring authHeader exists before calling .split(). Returns 401 Unauthorized with descriptive error if missing.',
      confidenceSelfAssessment: 0.99,
      patchSummary: 'Add guard check for missing authorization header'
    },
    confidenceBreakdown: {
      testPassWeight: 0.60,
      aiCertaintyWeight: 0.36,
      repoHistoryPenalty: -0.01,
      calculatedScore: 0.95,
      rationale: '100% test pass + 99% certainty on classic defensive guard clause.'
    },
    testResults: {
      passed: 1,
      failed: 0,
      total: 1,
      durationMs: 310,
      environment: 'Docker Sandbox node:20-alpine',
      exitCode: 0,
      log: `PASS src/middleware/__tests__/jwtValidator.test.ts
  validateJwtToken middleware
    ✓ should return 401 gracefully if authorization header is missing (21 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total`,
      testCases: [
        { name: 'validateJwtToken › return 401 gracefully if header missing', status: 'passed', durationMs: 21 }
      ]
    },
    reasoningTrail: [
      {
        id: 'step-1',
        step: '1. Ingestion & Signature Parse',
        thought: "Received Datadog alert #9942. Extracted TypeError: Cannot read properties of undefined (reading 'split') in jwtValidator.ts:16.",
        durationMs: 90,
        timestamp: new Date(Date.now() - 1000 * 60 * 44).toLocaleTimeString(),
        status: 'completed'
      },
      {
        id: 'step-2',
        step: '2. AST & Context Extraction',
        thought: "Loaded src/middleware/jwtValidator.ts. Inspected lines 12-25.",
        durationMs: 180,
        timestamp: new Date(Date.now() - 1000 * 60 * 43).toLocaleTimeString(),
        status: 'completed'
      },
      {
        id: 'step-3',
        step: '3. Root Cause Diagnosis (Gemini Flash)',
        thought: "Identified missing defensive validation for undefined authHeader. Calling .split(' ') on undefined throws synchronous TypeError causing server 500 instead of HTTP 401.",
        durationMs: 320,
        timestamp: new Date(Date.now() - 1000 * 60 * 42).toLocaleTimeString(),
        status: 'completed'
      },
      {
        id: 'step-4',
        step: '4. Minimal Diff Generation',
        thought: "Generated guard clause returning 401 with standard JSON error message.",
        durationMs: 210,
        timestamp: new Date(Date.now() - 1000 * 60 * 41).toLocaleTimeString(),
        status: 'completed'
      },
      {
        id: 'step-5',
        step: '5. Isolated Docker Sandbox Execution',
        thought: "Ran test suite in isolated container. Test passed in 310ms.",
        durationMs: 310,
        timestamp: new Date(Date.now() - 1000 * 60 * 40).toLocaleTimeString(),
        status: 'completed'
      },
      {
        id: 'step-6',
        step: '6. Auto-PR Safety Gate',
        thought: "Confidence 0.95 >= repo threshold 0.85. Auto-created GitHub PR #142 with complete diagnostic breakdown.",
        durationMs: 140,
        timestamp: new Date(Date.now() - 1000 * 60 * 39).toLocaleTimeString(),
        status: 'completed'
      }
    ]
  },
  {
    id: 'inc-9943',
    title: 'TypeError: Cannot read properties of undefined (reading quantity) in inventoryLock',
    source: 'manual',
    errorMessage: "TypeError: Cannot read properties of undefined (reading 'quantity') at reserveInventorySlots (inventoryLock.ts:18:14)",
    stackTrace: `TypeError: Cannot read properties of undefined (reading 'quantity')
    at reserveInventorySlots (/app/cart-orchestrator/src/checkout/inventoryLock.ts:18:14)
    at /app/cart-orchestrator/src/controllers/checkout.ts:52:11`,
    repoId: 'repo-cart',
    repoName: 'cart-orchestrator',
    filePath: 'src/checkout/inventoryLock.ts',
    lineRange: { start: 12, end: 25 },
    severity: 'medium',
    status: 'diagnosing',
    currentPipelineStage: 2,
    environment: 'staging',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    confidenceScore: 0.72,
    reasoningTrail: [
      {
        id: 'step-1',
        step: '1. Ingestion & Signature Parse',
        thought: "Manual stack trace submitted by on-call engineer. Target file: src/checkout/inventoryLock.ts.",
        durationMs: 80,
        timestamp: new Date(Date.now() - 1000 * 60 * 1).toLocaleTimeString(),
        status: 'completed'
      },
      {
        id: 'step-2',
        step: '2. Context Extraction',
        thought: "Fetched surrounding lines from cart-orchestrator repo.",
        durationMs: 150,
        timestamp: new Date().toLocaleTimeString(),
        status: 'active'
      }
    ]
  }
];

export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-1001',
    incidentId: 'inc-9942',
    incidentTitle: 'TypeError: Cannot read properties of undefined in jwtValidator',
    action: 'AUTO_PR_OPENED',
    performedBy: 'CodeMedic Autonomous Agent (v2.4)',
    userRole: 'autonomous_agent',
    timestamp: new Date(Date.now() - 1000 * 60 * 39).toISOString(),
    details: 'Auto-opened GitHub Pull Request #142 (branch: codemedic/fix-jwt-null-split-9942). Confidence: 0.95 >= Threshold: 0.85.',
    complianceHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
  },
  {
    id: 'audit-1002',
    incidentId: 'inc-9942',
    incidentTitle: 'TypeError: Cannot read properties of undefined in jwtValidator',
    action: 'SANDBOX_TEST_PASSED',
    performedBy: 'CodeMedic Sandbox Engine',
    userRole: 'autonomous_agent',
    timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    details: 'Isolated test suite passed (1/1 tests) in 310ms with zero network access.',
    complianceHash: 'sha256:3a91c0b3952f4be388147fa0d2bf555462cfb37651a0b38799e0ff9d2b271d49'
  },
  {
    id: 'audit-1003',
    incidentId: 'inc-9941',
    incidentTitle: 'UnhandledPromiseRejection: Missing await in stripeProcessor',
    action: 'SANDBOX_TEST_PASSED',
    performedBy: 'CodeMedic Sandbox Engine',
    userRole: 'autonomous_agent',
    timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    details: 'Isolated test suite passed (2/2 tests) in 840ms. Confidence: 0.96.',
    complianceHash: 'sha256:d81a8b16c148cf496fe8466b0a23351d4592750e32230ef52b27a35368a5c370'
  }
];
