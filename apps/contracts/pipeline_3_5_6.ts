/* ============================================================
 * ORBIT Pipeline Contract
 * Pipeline: Item3 → Item5 → Item6
 * ID: orbit.pipeline.3-5-6
 * Version: v0.1
 *
 * NOTE:
 * - Contract ONLY. No execution logic.
 * - No decision / gate / policy / approval semantics.
 * - No numeric/probability/score exposure.
 * ============================================================ */

export const PIPELINE_ID_3_5_6 = "orbit.pipeline.3-5-6" as const;
export const PIPELINE_CONTRACT_VERSION_V0_1 = "v0.1" as const;

/* ------------------------------------------------------------
 * Request
 * ------------------------------------------------------------ */

export type OrbitPipelineRunRequest = {
  requestId: string; // SSOT idempotency key
  pipelineId: typeof PIPELINE_ID_3_5_6;
  contractVersion: typeof PIPELINE_CONTRACT_VERSION_V0_1;

  input: OrbitPipelineInput;
  options?: OrbitPipelineOptions;
  context?: OrbitPipelineContext;
};

/* ----------------------- Input ----------------------------- */

export type OrbitPipelineInput = {
  subject: {
    kind: "text" | "docRef";
    text?: string; // when kind === "text"
    docRef?: {
      docId: string;
      hash?: string;
      span?: string;
    }; // when kind === "docRef"
  };

  candidates?: Array<{
    candidateId: string;
    content: string;
    source?: {
      model?: string;
      runId?: string;
      note?: string;
    };
  }>;

  modelOutputs?: Array<{
    modelId: string;
    outputId: string;
    content: string;
    citations?: Array<{
      ref: string;
      span?: string;
    }>;
    meta?: Record<string, string>;
  }>;

  evidenceHints?: {
    citationsAvailable?: boolean;
    constraintsProvided?: boolean;
    notes?: string;
  };
};

/* ----------------------- Context ---------------------------- */

export type OrbitPipelineContext = {
  workspaceId?: string;
  actorId?: string;
  locale?: string;
  tags?: string[];
};

/* ------------------------------------------------------------
 * Options
 * ------------------------------------------------------------ */

export type OrbitPipelineOptions = {
  branching?: {
    allowSkip?: boolean;       // default true
    allowRetry?: boolean;      // default true
    allowEscalate?: boolean;   // default true
  };

  retry?: {
    maxRetriesPerItem?: 0 | 1 | 2; // default 1
    retryOn?: Array<
      "TRANSIENT" | "STALE_LEASE" | "WORKER_TIMEOUT"
    >; // default ["TRANSIENT","WORKER_TIMEOUT"]
  };

  exposure?: "minimal" | "analytical"; // default "minimal"
  audience?: "general" | "expert" | "enterprise"; // default "general"
  stakes?: "low" | "high"; // default "low"

  execution?: {
    mode?: "sync" | "async"; // default "sync"
    timeoutMs?: number;      // sync only (best effort)
  };
};

/* ------------------------------------------------------------
 * Response
 * ------------------------------------------------------------ */

export type OrbitPipelineRunResponse = {
  requestId: string;
  pipelineId: typeof PIPELINE_ID_3_5_6;
  contractVersion: typeof PIPELINE_CONTRACT_VERSION_V0_1;

  status: "SUCCEEDED" | "PARTIAL" | "FAILED";
  startedAt: string;  // ISO
  finishedAt: string; // ISO

  result?: OrbitPipelineResult;
  errors?: OrbitPipelineError[];
  trace?: OrbitPipelineTrace; // exposure === "analytical" only
};

/* ----------------------- Result ----------------------------- */

export type OrbitPipelineResult = {
  // Item results are wrapped, not altered.
  item3?: unknown; // Item3Result (import at integration time)
  item5?: unknown; // Item5Result
  item6?: unknown; // Item6Result

  summary: {
    // Neutral state label ONLY (no gate semantics)
    disposition: "CONTINUE" | "CAUTION" | "STOP_SIGNAL";

    signals: Array<{
      code: string; // e.g. "u_high", "citation_missing", "model_disagree"
      severity: "LOW" | "MED" | "HIGH";
      note?: string; // single sentence, no recommendation
      sources?: Array<"ITEM3" | "ITEM5" | "ITEM6">;
    }>;

    questions?: string[]; // 1~3 preferred, from Item3 first
  };

  execution: {
    ran: Array<"ITEM3" | "ITEM5" | "ITEM6">;
    skipped: Array<"ITEM3" | "ITEM5" | "ITEM6">;
    retries: Array<{
      item: "ITEM3" | "ITEM5" | "ITEM6";
      count: number;
      reason: string; // label/code only
    }>;
  };
};

/* ----------------------- Errors ----------------------------- */

export type OrbitPipelineError = {
  code:
    | "INVALID_INPUT"
    | "CONFLICT"
    | "RATE_LIMIT"
    | "TRANSIENT"
    | "TIMEOUT"
    | "INTERNAL";
  message: string; // short
  item?: "ITEM3" | "ITEM5" | "ITEM6";
  retryable?: boolean;
};

/* ----------------------- Trace ------------------------------ */

export type OrbitPipelineTrace = {
  steps: Array<{
    item: "ITEM3" | "ITEM5" | "ITEM6";
    status: "RAN" | "SKIPPED" | "RETRIED" | "FAILED";
    reason?: string; // label/code only
    inputHash?: string;
    outputHash?: string;
    startedAt: string;
    finishedAt: string;
  }>;
};

/* ------------------------------------------------------------
 * Contract Guards (DOCUMENTATION-ONLY)
 * ------------------------------------------------------------
 * - No decision/gate/approval semantics anywhere.
 * - No numeric/probability/score exposure.
 * - Item6 output must NOT be framed as truth/answer.
 * - summary.disposition is a neutral state label.
 * ------------------------------------------------------------ */
