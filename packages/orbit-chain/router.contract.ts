/* ============================================================
 * ORBIT Chain Router — Contract v0.1 (Phase 4)
 * ============================================================
 * Purpose:
 * - Builds per-step payloads from ChainInput + prior step outputs
 * - Does NOT interpret meaning, does NOT decide, does NOT execute
 *
 * Key rule:
 * - Chain (Phase 3) = wiring + trace
 * - Router (Phase 4) = payload shaping only
 * ============================================================ */

import type { ChainInput, ChainOptions, ChainStepId } from "./contract";

export type RouterContext = {
  input: ChainInput;
  options: ChainOptions;

  // step outputs keyed by step id (unknown shapes)
  outputs: Partial<Record<ChainStepId, unknown>>;

  // aggregated signals passthrough (unknown shape)
  signals?: unknown;
};

export type StepPayload = unknown;

export type PayloadRouter = {
  build(step: ChainStepId, ctx: RouterContext): StepPayload;

  // Optional: minimal validation flags only (no schema parsing here)
  canBuild?(step: ChainStepId, ctx: RouterContext): {
    ok: boolean;
    reasons?: string[]; // signal-only
  };
};

/* =========================
 * Router SSOT rules
 * =========================
 * - item1/2/4 execution path can be "core/server" (not worker)
 * - worker steps receive minimal payloads that satisfy their schemas
 * - no numeric score exposure
 * - no approval / policy / gate meaning
 */
