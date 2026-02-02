/* ============================================================
 * Item8 — Time & Revisit Scheduler (Contract v0.1)
 * PURPOSE:
 * - decides revisit timing label based on signals only
 * - breaks infinite HOLD loops by proposing revisitAt
 *
 * BOUNDARY:
 * - MUST NOT generate HOLD (Item4 responsibility)
 * - NO decision/execute/approval/policy/audit
 * - NO numeric score/probability output
 * ============================================================ */

export type Item8Timing = "NOW" | "LATER" | "NEVER";

export type Item8Request = {
  requestId: string;

  // input is signals/tags only (from upstream items)
  signals?: Array<{
    code: string; // e.g. "u_high", "missing_evidence", "conflict_detected"
    severity?: "LOW" | "MED" | "HIGH";
  }>;

  // optional hints
  meta?: {
    stakes?: "low" | "high";
    audience?: "general" | "expert" | "enterprise";
    exposure?: "minimal" | "analytical";
  };
};

export type Item8Result = {
  timing: Item8Timing;         // NOW/LATER/NEVER
  revisitAt?: string;          // ISO timestamp when timing=LATER (optional)
  signals: Array<{
    code: string;              // e.g. "revisit_suggested", "stable_now"
    severity: "LOW" | "MED" | "HIGH";
    note?: string;             // short, signal-only
  }>;
};
