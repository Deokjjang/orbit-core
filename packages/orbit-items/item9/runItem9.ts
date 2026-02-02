import {
  Item9RequestSchema,
  Item9ResultSchema,
  type Item9Request,
  type Item9Result,
} from "./schema";

/* ============================================================
 * Item9 ??Human-in-the-Loop Optimizer (v0.1)
 *
 * Heuristics (signal-only):
 * - Group feedbacks by tag overlap (simple, explainable)
 * - Single-member clusters default to openIssues
 * - Multi-member clusters with no conflicting tags ??acceptedEdits
 *
 * BOUNDARY:
 * - NO approval / auto-apply
 * - NO correctness decision
 * ============================================================ */

function normalizeTag(t?: string) {
  return (t ?? "").toLowerCase().trim();
}

function tagSet(tags?: string[]): Set<string> {
  return new Set((tags ?? []).map(normalizeTag).filter(Boolean));
}

export function runItem9(raw: unknown): Item9Result {
  const req = Item9RequestSchema.parse(raw);

  // Build clusters keyed by normalized tag signature
  const clusters = new Map<string, { ids: string[]; tags: Set<string> }>();

  for (const fb of req.feedbacks) {
    const tags = tagSet(fb.tags);
    const key = Array.from(tags).sort().join("|") || "untagged";

    const c = clusters.get(key);
    if (!c) {
      clusters.set(key, { ids: [fb.id], tags });
    } else {
      c.ids.push(fb.id);
    }
  }

  const acceptedEdits: Item9Result["acceptedEdits"] = [];
  const openIssues: Item9Result["openIssues"] = [];
  const signals: Item9Result["signals"] = [];

  for (const [key, c] of clusters) {
    const cluster = {
      clusterId: `cluster_${key}`,
      label: key === "untagged" ? "general feedback" : key.replace(/\|/g, ", "),
      members: c.ids,
    };

    if (c.ids.length >= 2) {
      acceptedEdits.push(cluster);
    } else {
      openIssues.push(cluster);
    }
  }

  if (openIssues.length > 0) {
    signals.push({
      code: "needs_review",
      severity: "MED",
      note: "some feedback remains unclustered or single-member",
    });
  }

  return Item9ResultSchema.parse({
    acceptedEdits,
    openIssues,
    signals,
  });
}
