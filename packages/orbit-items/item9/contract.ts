/* ============================================================
 * Item9 — Human-in-the-Loop Optimizer (Contract v0.1)
 * PURPOSE:
 * - clusters human feedback into actionable buckets
 * - surfaces accepted edits vs open issues
 *
 * BOUNDARY:
 * - NO approval / execute / policy / audit
 * - NO automatic apply
 * - NO decision on correctness
 * ============================================================ */

export type Item9Feedback = {
  id: string;
  text: string;
  tags?: string[];
};

export type Item9Request = {
  requestId: string;

  // human feedback inputs (comments, edits, flags)
  feedbacks: Item9Feedback[];

  // optional hints
  meta?: {
    audience?: "general" | "expert" | "enterprise";
    exposure?: "minimal" | "analytical";
  };
};

export type Item9Cluster = {
  clusterId: string;
  label: string; // short descriptive label
  members: string[]; // feedback ids
};

export type Item9Result = {
  acceptedEdits: Item9Cluster[]; // low-friction, consensus-like
  openIssues: Item9Cluster[];    // unresolved / conflicting
  signals: Array<{
    code: string;                // e.g. "needs_review", "conflict_in_feedback"
    severity: "LOW" | "MED" | "HIGH";
    note?: string;
  }>;
};
