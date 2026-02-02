import type { Item6Request } from "./schema.request";
import type { Item6Response } from "./schema.response";

type Tier = "LOW" | "MEDIUM" | "HIGH";
type Consensus = "AGREE" | "PARTIAL" | "DISAGREE";
type Overlap = "HIGH" | "MEDIUM" | "LOW";

function maxTier(a: Tier, b: Tier): Tier {
  const rank = { LOW: 0, MEDIUM: 1, HIGH: 2 } as const;
  return rank[a] >= rank[b] ? a : b;
}

function tierForCount(count: number): Tier {
  if (count >= 3) return "HIGH";
  if (count === 2) return "MEDIUM";
  return "LOW";
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  const n = normalizeText(s);
  if (!n) return [];
  // very coarse tokenizer: split by spaces, keep non-trivial tokens
  return n.split(" ").filter((w) => w.length >= 3);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const uni = a.size + b.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

function overlapFromJaccard(avg: number): Overlap {
  if (avg >= 0.55) return "HIGH";
  if (avg >= 0.30) return "MEDIUM";
  return "LOW";
}

function consensusFromOverlap(ov: Overlap): Consensus {
  if (ov === "HIGH") return "AGREE";
  if (ov === "MEDIUM") return "PARTIAL";
  return "DISAGREE";
}

function looksOverclaim(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("100%") ||
    t.includes("certain") ||
    t.includes("definitely") ||
    t.includes("must") ||
    t.includes("always") ||
    t.includes("guarantee") ||
    text.includes("반드시") ||
    text.includes("확실") ||
    text.includes("무조건") ||
    text.includes("절대")
  );
}

function hasCitedRef(text: string): boolean {
  // extremely coarse: presence of bracket-like citation markers or "section"/"§"
  const t = text.toLowerCase();
  return (
    t.includes("[") ||
    t.includes("]") ||
    t.includes("§") ||
    t.includes("section") ||
    text.includes("조항") ||
    text.includes("섹션") ||
    text.includes("근거")
  );
}

export function runItem6(req: Item6Request): Item6Response {
  const { requestId, candidates, item5ByCandidateId, uncertainty } = req;

  // 1) Pairwise overlap (token Jaccard)
  const tokenSets = candidates.map((c) => new Set(tokenize(c.text)));
  let pairs = 0;
  let sum = 0;
  for (let i = 0; i < tokenSets.length; i++) {
    for (let j = i + 1; j < tokenSets.length; j++) {
      pairs++;
      sum += jaccard(tokenSets[i], tokenSets[j]);
    }
  }
  const avgJac = pairs > 0 ? sum / pairs : 0;
  const overlap: Overlap = overlapFromJaccard(avgJac);
  const consensus: Consensus = consensusFromOverlap(overlap);

  // 2) Variance signals (signal-only)
  const varianceSignals: Item6Response["varianceSignals"] = [];

  // u_high signal
  if (uncertainty?.overallTier === "HIGH") {
    varianceSignals.push({ name: "u_high", severity: "HIGH" });
  }

  // contradiction heuristic: low overlap + at least one candidate has strong negation marker
  const hasNeg = candidates.some((c) => /(^|\s)(not|no|never)\b/i.test(c.text) || /없다|불가|아니다/.test(c.text));
  if (overlap === "LOW" && hasNeg) {
    varianceSignals.push({ name: "contradiction", severity: "HIGH" });
  } else if (overlap === "MEDIUM" && hasNeg) {
    varianceSignals.push({ name: "contradiction", severity: "MEDIUM" });
  }

  // overclaim divergence
  const overCount = candidates.reduce((acc, c) => acc + (looksOverclaim(c.text) ? 1 : 0), 0);
  if (overCount > 0 && overCount < candidates.length) {
    varianceSignals.push({ name: "overclaim_divergence", severity: tierForCount(overCount) });
  }

  // citation divergence (text-level only; no validation)
  const citeCount = candidates.reduce((acc, c) => acc + (hasCitedRef(c.text) ? 1 : 0), 0);
  if (citeCount > 0 && citeCount < candidates.length) {
    varianceSignals.push({ name: "citation_divergence", severity: tierForCount(candidates.length - citeCount) });
  }

  // missing_key_answer (if Item3 questions exist and some candidates are too short)
  const qCount = uncertainty?.questions?.length ?? 0;
  if (qCount >= 1) {
    const shortCount = candidates.reduce((acc, c) => acc + (c.text.trim().length < 160 ? 1 : 0), 0);
    if (shortCount > 0) {
      varianceSignals.push({ name: "missing_key_answer", severity: tierForCount(shortCount) });
    }
  }

  // Item5 aggregation signals (optional)
  const item5 = item5ByCandidateId ?? {};
  const verdicts = candidates
    .map((c) => item5[c.id]?.verdict)
    .filter((v): v is "USE" | "HOLD" | "REJECT" => v === "USE" || v === "HOLD" || v === "REJECT");

  const rejectCount = verdicts.filter((v) => v === "REJECT").length;
  const holdCount = verdicts.filter((v) => v === "HOLD").length;

  if (rejectCount > 0) {
    varianceSignals.push({ name: "item5_reject_present", severity: tierForCount(rejectCount) });
  }
  if (holdCount >= Math.ceil(candidates.length / 2)) {
    varianceSignals.push({ name: "item5_hold_heavy", severity: holdCount >= candidates.length ? "HIGH" : "MEDIUM" });
  }

  // 3) Clustering (2~5) — simple: by overlap with first candidate (anchor)
  //    This is *not* semantic truth, only divergence grouping.
  const anchor = tokenSets[0];
  const groupA: string[] = [];
  const groupB: string[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const sim = jaccard(anchor, tokenSets[i]);
    if (sim >= 0.40) groupA.push(candidates[i].id);
    else groupB.push(candidates[i].id);
  }

  const clusters: Item6Response["clusters"] = [];

  const mkCluster = (id: string, ids: string[], summary: string, sev: Tier): void => {
    if (ids.length === 0) return;
    clusters.push({
      id,
      summary,
      candidateIds: ids,
      signals: [{ name: "text_overlap_cluster", severity: sev }],
    });
  };

  if (groupB.length === 0) {
    mkCluster("C1", groupA, "대부분 응답이 유사(텍스트 겹침 높음)", "LOW");
  } else if (groupA.length === 0) {
    mkCluster("C1", groupB, "대부분 응답이 유사(텍스트 겹침 높음)", "LOW");
  } else {
    mkCluster("C1", groupA, "응답 군집 A(앵커와 유사)", overlap === "LOW" ? "MEDIUM" : "LOW");
    mkCluster("C2", groupB, "응답 군집 B(앵커와 상이)", overlap === "LOW" ? "HIGH" : "MEDIUM");
  }

  // ensure 1..5 clusters (contract)
  if (clusters.length === 0) {
    clusters.push({
      id: "C1",
      summary: "클러스터 생성 실패(입력 부족/토큰화 공백)",
      candidateIds: candidates.map((c) => c.id),
      signals: [{ name: "cluster_fallback", severity: "MEDIUM" }],
    });
  }

  return {
    itemId: "item6",
    requestId,
    consensus,
    overlap,
    varianceSignals,
    clusters: clusters.slice(0, 5),
    meta: {
      noMajorityVote: true,
      noTruthClaim: true,
      noGate: true,
      version: "v0.1",
    },
  };
}
