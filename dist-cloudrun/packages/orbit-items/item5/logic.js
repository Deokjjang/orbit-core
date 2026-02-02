function maxTier(a, b) {
    const rank = { LOW: 0, MEDIUM: 1, HIGH: 2 };
    return rank[a] >= rank[b] ? a : b;
}
function severityForBool(isBad, sev) {
    return isBad ? sev : null;
}
function looksOverclaim(text) {
    // coarse heuristic: strong certainty language
    const t = text.toLowerCase();
    return (t.includes("100%") ||
        t.includes("certain") ||
        t.includes("definitely") ||
        t.includes("must") ||
        t.includes("always") ||
        t.includes("guarantee") ||
        text.includes("반드시") ||
        text.includes("확실") ||
        text.includes("무조건") ||
        text.includes("절대"));
}
function hasSelfContradiction(text) {
    // lightweight: detect both "is" and "is not" on same key phrases is hard without NLP.
    // Here we only flag WARN if common contradiction markers appear.
    const t = text.toLowerCase();
    const hasBut = t.includes("however") || text.includes("하지만") || text.includes("반면");
    const hasNeg = t.includes("not") || text.includes("아니다") || text.includes("불가") || text.includes("없다");
    const hasAff = t.includes("is") || text.includes("이다") || text.includes("가능") || text.includes("있다");
    if (hasBut && hasNeg && hasAff)
        return "WARN";
    return "OK";
}
function coverageFromQuestions(candidateText, questions) {
    if (!questions || questions.length === 0)
        return "GOOD";
    // heuristic: if candidate is very short relative to question count -> poor
    const len = candidateText.trim().length;
    if (len < 120 && questions.length >= 2)
        return "POOR";
    if (len < 200 && questions.length >= 3)
        return "PARTIAL";
    return "PARTIAL";
}
export function runItem5(req) {
    const { requestId, candidate, evidenceLinks, uncertainty } = req;
    const reasons = [];
    const needs = [];
    // Signals
    const hasCitations = (evidenceLinks?.length ?? 0) > 0 ? "YES" : "NO";
    const consistency = hasSelfContradiction(candidate.text);
    const uTier = uncertainty?.overallTier ?? "LOW";
    const coverage = coverageFromQuestions(candidate.text, uncertainty?.questions);
    // Conflict is not actually validated here; only signaled as POSSIBLE if u signals indicate conflict.
    // Conflict signal (Item5 does NOT assert CLEAR; only NONE|POSSIBLE)
    const hasConflictSignal = (uncertainty?.signals ?? []).some((s) => typeof s.name === "string" && s.name.includes("conflict")) ?? false;
    const conflict = hasConflictSignal ? "POSSIBLE" : "NONE";
    // Reasons
    if (hasCitations === "NO") {
        reasons.push({ signal: "citation_missing", severity: "MEDIUM" });
        needs.push({ type: "EVIDENCE", text: "근거 링크(evidenceLinks)를 제공해 주세요." });
    }
    const over = looksOverclaim(candidate.text);
    const overSev = severityForBool(over, hasCitations === "NO" ? "HIGH" : "MEDIUM");
    if (overSev) {
        reasons.push({ signal: "overclaim", severity: overSev });
        needs.push({ type: "REDUCTION", text: "단정 표현을 약화하고 조건/예외를 명시해 주세요." });
    }
    if (coverage === "POOR" || coverage === "PARTIAL") {
        reasons.push({ signal: "coverage_gap", severity: coverage === "POOR" ? "HIGH" : "MEDIUM" });
        needs.push({ type: "CLARIFICATION", text: "Item3 질문(questions)에 대해 누락된 답을 보완해 주세요." });
    }
    if (uTier === "HIGH") {
        reasons.push({ signal: "u_high", severity: "HIGH" });
        needs.push({ type: "CLARIFICATION", text: "불확실성(u)이 높습니다. 최소 관측 정보/근거를 추가해 주세요." });
    }
    if (consistency === "WARN") {
        reasons.push({ signal: "internal_inconsistency", severity: "MEDIUM" });
        needs.push({ type: "CLARIFICATION", text: "응답 내부에서 상충되는 진술이 없는지 정리해 주세요." });
    }
    if (conflict === "POSSIBLE") {
        reasons.push({ signal: "external_conflict", severity: "MEDIUM" });
        needs.push({ type: "EVIDENCE", text: "근거/제약과의 충돌 가능성이 있습니다. 해당 근거를 더 명확히 연결해 주세요." });
    }
    // Verdict Rule (non-numeric)
    let verdict = "USE";
    // REJECT conditions (strict)
    if (consistency === "FAIL")
        verdict = "REJECT";
    if (reasons.some((r) => r.signal === "citation_mismatch" && r.severity === "HIGH"))
        verdict = "REJECT";
    // HOLD conditions
    if (verdict !== "REJECT") {
        if (hasCitations === "NO")
            verdict = "HOLD";
        if (uTier === "HIGH")
            verdict = "HOLD";
        if (coverage !== "GOOD")
            verdict = "HOLD";
        if (reasons.some((r) => r.signal === "overclaim" && (r.severity === "MEDIUM" || r.severity === "HIGH")))
            verdict = "HOLD";
        if (consistency === "WARN")
            verdict = "HOLD";
    }
    // De-dup needs (by type+text)
    const uniqNeeds = [];
    const seen = new Set();
    for (const n of needs) {
        const k = `${n.type}:${n.text}`;
        if (seen.has(k))
            continue;
        seen.add(k);
        uniqNeeds.push(n);
    }
    return {
        itemId: "item5",
        requestId,
        verdict,
        reasons,
        needs: uniqNeeds,
        signals: {
            hasCitations,
            consistency,
            conflict,
            coverage,
            uTier,
        },
        meta: {
            noTruthClaim: true,
            noGate: true,
            version: "v0.1",
        },
    };
}
