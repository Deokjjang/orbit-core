// apps/server/src/fl/gateErrors.ts
// Phase 11 Step 3: Normalize Gate errors to stable codes (no throw)

export type GateErrorCode =
  | "ENV_NOT_PRODUCTION"
  | "EXECUTE_DISABLED"
  | "MISSING_IDEMPOTENCY_KEY"
  | "ALREADY_PROCESSED"
  | "PREFLIGHT_FAILED"
  | "GATE_FAILURE";

export function normalizeGateError(e: unknown): GateErrorCode {
  const msg = String((e as any)?.message ?? e ?? "");

  if (msg.includes("execute_not_allowed_in_non_production")) return "ENV_NOT_PRODUCTION";
  if (msg.includes("execute_disabled_by_flag")) return "EXECUTE_DISABLED";
  if (msg.includes("execute_requires_idempotencyKey")) return "MISSING_IDEMPOTENCY_KEY";
  if (msg.includes("execute_already_processed")) return "ALREADY_PROCESSED";
  if (msg.includes("preflight_")) return "PREFLIGHT_FAILED";

  return "GATE_FAILURE";
}
