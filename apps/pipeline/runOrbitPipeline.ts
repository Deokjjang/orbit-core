/* ============================================================
 * ORBIT Pipeline Entry (IMPLEMENTED)
 * Pipeline: Item3 ??Item5 ??Item6
 *
 * BOUNDARY GUARANTEES:
 * - No decision / gate / policy / approval
 * - No numeric / probability / score exposure
 * - Signal-only orchestration
 * ============================================================ */

import {
  PIPELINE_ID_3_5_6,
  PIPELINE_CONTRACT_VERSION_V0_1,
  OrbitPipelineRunRequest,
  OrbitPipelineRunResponse,
  OrbitPipelineResult,
  OrbitPipelineError,
} from "../contracts/pipeline_3_5_6";

/* ------------------------------------------------------------
 * Execution Context
 * ------------------------------------------------------------ */

export type OrbitExecutionContext =
  | { mode: "sync" }
  | { mode: "async"; jobId: string };

/* ------------------------------------------------------------
 * Item Executors (Injected)
 * ------------------------------------------------------------ */

export type ItemExecutor = {
  execItem3: (args: unknown) => Promise<unknown>;
  execItem5: (args: unknown) => Promise<unknown>;
  execItem6: (args: unknown) => Promise<unknown>;
};

/* ------------------------------------------------------------
 * Pipeline Entry
 * ------------------------------------------------------------ */

export async function runOrbitPipeline(
  req: OrbitPipelineRunRequest,
  exec: ItemExecutor,
  execCtx: OrbitExecutionContext
): Promise<OrbitPipelineRunResponse> {
  const startedAt = iso();

  // ---- Contract Guard ----
  if (req.pipelineId !== PIPELINE_ID_3_5_6) {
    return fail(req, startedAt, {
      code: "INVALID_INPUT",
      message: "Unsupported pipelineId",
    });
  }
  if (req.contractVersion !== PIPELINE_CONTRACT_VERSION_V0_1) {
    return fail(req, startedAt, {
      code: "INVALID_INPUT",
      message: "Unsupported contractVersion",
    });
  }

  const opts = normalizeOptions(req.options);

  const result: OrbitPipelineResult = {
    summary: {
      disposition: "CONTINUE",
      signals: [],
      questions: [],
    },
    execution: {
      ran: [],
      skipped: [],
      retries: [],
    },
  };

  const errors: OrbitPipelineError[] = [];

  /* =========================================================
   * ITEM 3 ??Uncertainty Mapper (ALWAYS FIRST)
   * ========================================================= */
  const item3 = await runWithRetry(
    "ITEM3",
    opts,
    // ?˜ì • (Item3ê°€ ?”êµ¬?˜ëŠ” requestIdë¥?ì£¼ìž…)
() => exec.execItem3({ requestId: req.requestId, ...(req.input as any) }),
    result,
    errors
  );

  if (!item3.ok) {
    // Item3 ?¤íŒ¨ ?? summary êµ¬ì„± ë¶ˆê? ??FAILED
    return fail(req, startedAt, item3.error);
  }

  result.item3 = item3.value;
  collectSignals(result, item3.value, "ITEM3");

  /* =========================================================
   * ITEM 5 ??Anti-Hallucination Filter
   * ========================================================= */
  const hasContentForItem5 =
    Boolean(req.input.candidates?.length) ||
    Boolean(req.input.modelOutputs?.length);

  if (!hasContentForItem5 && opts.branching.allowSkip) {
    result.execution.skipped.push("ITEM5");
  } else {
    const item5 = await runWithRetry(
      "ITEM5",
      opts,
      () =>
        exec.execItem5({
          input: req.input,
          context: { item3: item3.value },
        }),
      result,
      errors
    );

    if (item5.ok) {
      result.item5 = item5.value;
      collectSignals(result, item5.value, "ITEM5");
    } else {
      // Item5 ?¤íŒ¨??PARTIAL ?ˆìš©
      errors.push(item5.error);
    }
  }

  /* =========================================================
   * ITEM 6 ??Multi-Model Consensus Router
   * ========================================================= */
  const hasEnoughModels = (req.input.modelOutputs?.length ?? 0) >= 2;

  if (!hasEnoughModels && opts.branching.allowSkip) {
    result.execution.skipped.push("ITEM6");
  } else {
    const item6 = await runWithRetry(
      "ITEM6",
      opts,
      () =>
        exec.execItem6({
          input: req.input,
          context: {
            item3: result.item3,
            item5: result.item5,
          },
        }),
      result,
      errors
    );

    if (item6.ok) {
      result.item6 = item6.value;
      collectSignals(result, item6.value, "ITEM6");
    } else {
      // Item6 ?¤íŒ¨??PARTIAL ?ˆìš©
      errors.push(item6.error);
    }
  }

  /* =========================================================
   * PIPELINE SUMMARY (SIGNAL-ONLY)
   * ========================================================= */
  result.summary.disposition = deriveDisposition(result.summary.signals);
  result.summary.questions = pickQuestions(result.item3);

  const finishedAt = iso();

  return {
    requestId: req.requestId,
    pipelineId: req.pipelineId,
    contractVersion: req.contractVersion,
    status: errors.length === 0 ? "SUCCEEDED" : "PARTIAL",
    startedAt,
    finishedAt,
    result,
    errors: errors.length ? errors : undefined,
  };
}

/* ------------------------------------------------------------
 * Retry Wrapper (SYSTEM SIGNAL ONLY)
 * ------------------------------------------------------------ */

async function runWithRetry(
  item: "ITEM3" | "ITEM5" | "ITEM6",
  opts: NormalizedOptions,
  fn: () => Promise<unknown>,
  result: OrbitPipelineResult,
  errors: OrbitPipelineError[]
): Promise<
  | { ok: true; value: unknown }
  | { ok: false; error: OrbitPipelineError }
> {
  let attempt = 0;
  const max = opts.retry.maxRetriesPerItem;

  while (true) {
    try {
      const value = await fn();
      result.execution.ran.push(item);
      return { ok: true, value };
    } catch (e: any) {
      attempt++;
      const err = toPipelineError(e, item);

      result.execution.retries.push({
        item,
        count: attempt,
        reason: err.code,
      });

      if (
        attempt > max ||
        !opts.retry.retryOn.includes(err.code as any)
      ) {
        return { ok: false, error: err };
      }
    }
  }
}

/* ------------------------------------------------------------
 * Helpers (Signal-only)
 * ------------------------------------------------------------ */

function collectSignals(
  result: OrbitPipelineResult,
  itemResult: any,
  source: "ITEM3" | "ITEM5" | "ITEM6"
) {
  if (!itemResult?.signals) return;
  for (const s of itemResult.signals) {
    result.summary.signals.push({
      code: s.code,
      severity: s.severity,
      note: s.note,
      sources: [source],
    });
  }
}

function deriveDisposition(
  signals: OrbitPipelineResult["summary"]["signals"]
): "CONTINUE" | "CAUTION" | "STOP_SIGNAL" {
  if (signals.some(s => s.severity === "HIGH")) return "STOP_SIGNAL";
  if (signals.some(s => s.severity === "MED")) return "CAUTION";
  return "CONTINUE";
}

function pickQuestions(item3: any): string[] | undefined {
  if (!item3?.questions?.length) return undefined;
  return item3.questions.slice(0, 3);
}

/* ------------------------------------------------------------
 * Errors / Options
 * ------------------------------------------------------------ */

type NormalizedOptions = {
  branching: {
    allowSkip: boolean;
    allowRetry: boolean;
    allowEscalate: boolean;
  };
  retry: {
    maxRetriesPerItem: number;
    retryOn: string[];
  };
};

function normalizeOptions(
  opts: OrbitPipelineRunRequest["options"]
): NormalizedOptions {
  return {
    branching: {
      allowSkip: opts?.branching?.allowSkip ?? true,
      allowRetry: opts?.branching?.allowRetry ?? true,
      allowEscalate: opts?.branching?.allowEscalate ?? true,
    },
    retry: {
      maxRetriesPerItem: opts?.retry?.maxRetriesPerItem ?? 1,
      retryOn: opts?.retry?.retryOn ?? [
        "TRANSIENT",
        "WORKER_TIMEOUT",
      ],
    },
  };
}

function toPipelineError(e: any, item: "ITEM3" | "ITEM5" | "ITEM6"): OrbitPipelineError {
  return {
    code: e?.code ?? "INTERNAL",
    message: e?.message ?? "Unhandled error",
    item,
    retryable: true,
  };
}

function fail(
  req: OrbitPipelineRunRequest,
  startedAt: string,
  error: OrbitPipelineError
): OrbitPipelineRunResponse {
  return {
    requestId: req.requestId,
    pipelineId: req.pipelineId,
    contractVersion: req.contractVersion,
    status: "FAILED",
    startedAt,
    finishedAt: iso(),
    errors: [error],
  };
}

function iso() {
  return new Date().toISOString();
}
