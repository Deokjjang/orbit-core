/* ============================================================
 * ORBIT Chain — Contract v0.1 (DESIGN FREEZE)
 * ============================================================
 * Chain Order (LOCK):
 * Generate(1)
 * → Compare/Map(2,3,6)
 * → Converge/Brake(4)
 * → Operate(7,8,9,10)
 * → Validate(5,6)
 *
 * BOUNDARY:
 * - NO decision/execute/approval
 * - NO numeric score/probability exposure
 * - signal/label/list only
 * ============================================================ */

export type ChainExposure = "minimal" | "analytical";
export type ChainAudience = "general" | "expert" | "enterprise";
export type ChainStakes = "low" | "high";

export type ChainOptions = {
  loop?: number; // quality scale (Item10 cap applies)
  exposure?: ChainExposure;
  audience?: ChainAudience;
  stakes?: ChainStakes;

  branching?: {
    allowSkip?: boolean;    // signal-based skip only
    allowRetry?: boolean;   // transient only
    allowEscalate?: boolean;// surface issues, no auto action
  };

  retry?: {
    maxRetriesPerItem?: number;
    retryOn?: Array<"TRANSIENT" | "TIMEOUT">;
  };
};

export type ChainInput = {
  requestId: string;

  // Primary ORBIT inputs (adapter/compiler may produce these)
  scenarioSet?: Array<{ id: string; label?: string }>;
  state?: {
    core?: { u?: number; r?: number; i?: number; v?: number };
    optional?: Record<string, number>;
  };

  // Optional raw context (not required by chain)
  subject?: { kind: "text" | "document"; text?: string; refId?: string };

  // Upstream artifacts (optional)
  signals?: Array<{ code: string; severity?: "LOW" | "MED" | "HIGH" }>;
  feedbacks?: Array<{ id: string; text: string; tags?: string[] }>;

  meta?: {
    workspaceId?: string;
    plan?: string;
  };
};

export type ChainStepId =
  | "item1"
  | "item2"
  | "item3"
  | "item6_pre"
  | "item4"
  | "item7"
  | "item8"
  | "item9"
  | "item10"
  | "item5"
  | "item6_post";

export type ChainStepStatus =
  | "SKIPPED"
  | "SUCCEEDED"
  | "FAILED"
  | "RETRIED";

export type SignalShape = "none" | "array" | "object" | "other";

export type ChainStepTrace = {
  step: ChainStepId;
  status: "SUCCEEDED" | "FAILED" | "SKIPPED";
  signals?: unknown;
  signalShape?: SignalShape;
  notes?: string[];
};

export type ChainSummary = {
  disposition: "CONTINUE" | "HOLD" | "STOP"; // expression only
  reasons?: string[]; // signal-only
};

export type ChainResult = {
  summary: ChainSummary;

  // Minimal output bar (MUST always exist)
  optionsMap: Array<{
    id: string;
    description?: string;
    risks?: string[];
    stability?: "LOW" | "MED" | "HIGH";
  }>;

  // Evidence for operators (signal-only)
  traces: ChainStepTrace[];

  // Optional revisit hint (from Item8)
  revisit?: { timing: "NOW" | "LATER" | "NEVER"; revisitAt?: string };
};

/* =========================
 * FAILURE / SKIP RULES (LOCK)
 * =========================
 * - Item failure does NOT imply chain failure unless marked non-recoverable.
 * - Skips allowed only when upstream signals justify (allowSkip=true).
 * - Retries only for TRANSIENT/TIMEOUT within caps.
 * - No auto-approval, no auto-execution.
 */
export type RunnerEnv = "worker" | "server";
