/* ============================================================
 * Item10 — Meta-Agent Governor (Contract v0.1)
 * PURPOSE:
 * - Request metadata governance (budget/slots/loop)
 * - NO content judgment, NO decision, NO execution
 * ============================================================ */

export type Item10Request = {
  requestId: string;
  // execution metadata only
  meta: {
    loop?: number;                 // requested quality loop
    slots?: number;                // requested concurrency slots
    budget?: { credits?: number }; // requested credits
    exposure?: "minimal" | "analytical";
    audience?: "general" | "expert" | "enterprise";
    stakes?: "low" | "high";
  };
  // optional context
  workspace?: { id: string; plan?: string };
};

export type Item10Verdict = "ALLOW" | "HOLD" | "BLOCK";

export type Item10Result = {
  verdict: Item10Verdict; // expression only (no gate/execute)
  signals: Array<{
    code: string;                 // e.g. "budget_exceeded", "slots_limit"
    severity: "LOW" | "MED" | "HIGH";
    note?: string;                // single sentence, no recommendation
  }>;
  limits: {
    loopMax?: number;
    slotsMax?: number;
    creditsMax?: number;
  };
};

/* =========================
 * BOUNDARY (SSOT)
 * - No content analysis
 * - No approval/execute
 * - No numeric score exposure beyond caps
 * ========================= */
