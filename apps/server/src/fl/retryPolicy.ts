// apps/server/src/fl/retryPolicy.ts
// Phase 14 Step 1: Retry policy SSOT for FL Gate (decision-free rules)

import type { GateErrorCode } from "./gateErrors";

export type RetryDecision =
  | { retry: false; reason: "NON_RETRYABLE" }
  | { retry: true; reason: "TRANSIENT"; backoffMs: number };

export function decideGateRetry(code: GateErrorCode, attempt: number): RetryDecision {
  // 절대 재시도 금지
  if (
    code === "ENV_NOT_PRODUCTION" ||
    code === "EXECUTE_DISABLED" ||
    code === "MISSING_IDEMPOTENCY_KEY" ||
    code === "ALREADY_PROCESSED" ||
    code === "PREFLIGHT_FAILED"
  ) {
    return { retry: false, reason: "NON_RETRYABLE" };
  }

  // 일시 장애만 제한 재시도
  if (code === "GATE_FAILURE") {
    if (attempt >= 3) return { retry: false, reason: "NON_RETRYABLE" };
    const backoffMs = 500 * Math.pow(2, attempt); // 500, 1000, 2000
    return { retry: true, reason: "TRANSIENT", backoffMs };
  }

  return { retry: false, reason: "NON_RETRYABLE" };
}
