// packages/orbit-items/item3/logic.ts
function tierFromAbs(x) {
    const a = Math.abs(x);
    if (a >= 0.67)
        return "HIGH";
    if (a >= 0.34)
        return "MEDIUM";
    return "LOW";
}
function bumpTier(t) {
    if (t === "LOW")
        return "MEDIUM";
    if (t === "MEDIUM")
        return "HIGH";
    return "HIGH";
}
function maxTier(a, b) {
    const rank = { LOW: 0, MEDIUM: 1, HIGH: 2 };
    return rank[a] >= rank[b] ? a : b;
}
export function runItem3(req) {
    const { requestId, scenarioSet, state, constraints, evidenceLinks, context } = req;
    // 1) Base axis tiers from core state
    let byAxis = {
        u: tierFromAbs(state.core.u),
        r: tierFromAbs(state.core.r),
        i: tierFromAbs(state.core.i),
        v: tierFromAbs(state.core.v),
    };
    const sources = [];
    const signals = [];
    // overall tier bump reservation (do NOT mutate byAxis for missing evidence/constraints)
    let overallBump = null;
    // 2) Missing optional axes signal (low severity only; informational)
    if (!state.optional || Object.keys(state.optional).length === 0) {
        signals.push({ name: "axis_missing_optional", severity: "LOW" });
        sources.push({ type: "MISSING", where: "axis", signal: "optional_axes_absent" });
    }
    // 3) Evidence gap handling
    const hasEvidence = Array.isArray(evidenceLinks) && evidenceLinks.length > 0;
    if (!hasEvidence) {
        sources.push({ type: "MISSING", where: "evidence", signal: "evidenceLinks_absent" });
        if (!signals.some((s) => s.name === "evidence_gap")) {
            signals.push({ name: "evidence_gap", severity: "MEDIUM" });
        }
        overallBump = maxTier(overallBump ?? "LOW", "MEDIUM");
    }
    // 4) Constraints missing handling
    const hasConstraints = !!constraints && ((constraints.hard?.length ?? 0) > 0 || (constraints.soft?.length ?? 0) > 0);
    if (!hasConstraints) {
        sources.push({ type: "MISSING", where: "constraint", signal: "constraints_absent" });
        if (!signals.some((s) => s.name === "evidence_gap")) {
            signals.push({ name: "evidence_gap", severity: "MEDIUM" });
        }
        overallBump = maxTier(overallBump ?? "LOW", "MEDIUM");
    }
    // 5) Stale evidence hint (upstream only; Item3 does not validate freshness)
    if (context?.evidenceStale === true) {
        sources.push({ type: "STALE", where: "evidence", signal: "upstream_evidence_stale_hint" });
        signals.push({ name: "stale_evidence", severity: "MEDIUM" });
        // stale is a real uncertainty increase signal -> bump u only (not all axes)
        byAxis = { ...byAxis, u: bumpTier(byAxis.u) };
        overallBump = maxTier(overallBump ?? "LOW", "MEDIUM");
    }
    // 6) Constraint conflict heuristic (lightweight; no enforcement)
    const hard = constraints?.hard ?? [];
    const soft = constraints?.soft ?? [];
    const hardByRef = new Map();
    for (const h of hard) {
        if (!h.ref)
            continue;
        const set = hardByRef.get(h.ref) ?? new Set();
        set.add(h.name);
        hardByRef.set(h.ref, set);
    }
    let conflict = false;
    for (const s of soft) {
        if (!s.ref)
            continue;
        const hset = hardByRef.get(s.ref);
        if (hset && !hset.has(s.name)) {
            conflict = true;
            sources.push({
                type: "CONFLICT",
                where: "constraint",
                ref: s.ref,
                signal: "hard_soft_ref_overlap_name_mismatch",
            });
        }
    }
    if (conflict) {
        signals.push({ name: "constraint_conflict", severity: "HIGH" });
        // conflict is strong u signal -> force u HIGH, keep other axes at least MEDIUM
        byAxis = {
            u: "HIGH",
            r: maxTier(byAxis.r, "MEDIUM"),
            i: maxTier(byAxis.i, "MEDIUM"),
            v: maxTier(byAxis.v, "MEDIUM"),
        };
        overallBump = "HIGH";
    }
    // 7) Scenario underdefined / assumption heavy
    let assumptionHeavyCount = 0;
    let underDefinedCount = 0;
    for (const sc of scenarioSet) {
        const aLen = sc.assumptions?.length ?? 0;
        if (aLen >= 3)
            assumptionHeavyCount++;
        if (!sc.label || sc.label.trim().length < 3)
            underDefinedCount++;
    }
    if (assumptionHeavyCount > 0) {
        sources.push({ type: "ASSUMPTION", where: "scenario", signal: "scenario_assumptions_heavy" });
        signals.push({
            name: "assumption_heavy",
            severity: assumptionHeavyCount >= 2 ? "HIGH" : "MEDIUM",
        });
        byAxis = { ...byAxis, u: bumpTier(byAxis.u) };
        overallBump = maxTier(overallBump ?? "LOW", "MEDIUM");
    }
    if (underDefinedCount > 0) {
        sources.push({ type: "AMBIGUOUS", where: "scenario", signal: "scenario_label_underdefined" });
        signals.push({
            name: "scenario_underdefined",
            severity: underDefinedCount >= 2 ? "HIGH" : "MEDIUM",
        });
        byAxis = { ...byAxis, u: bumpTier(byAxis.u) };
        overallBump = maxTier(overallBump ?? "LOW", "MEDIUM");
    }
    // 8) u_spike signal (based purely on current u tier)
    if (byAxis.u === "HIGH") {
        signals.push({ name: "u_spike", severity: "HIGH" });
    }
    // 9) byScenario density = coarse; inherits current u tier only
    const scenarioTiers = scenarioSet.map((sc) => ({
        scenarioId: sc.id,
        tier: byAxis.u,
    }));
    // 10) overallTier = max of axis tiers (coarse) + reserved overall bump
    const baseOverallTier = [byAxis.u, byAxis.r, byAxis.i, byAxis.v].reduce((acc, t) => maxTier(acc, t), "LOW");
    const overallTier = overallBump ? maxTier(baseOverallTier, overallBump) : baseOverallTier;
    // 11) Minimal question set (1–3 default, up to 6 when needed)
    const questions = [];
    if (!hasEvidence) {
        questions.push({
            id: "Q1",
            priority: "HIGH",
            target: "evidence",
            text: "근거 문서/섹션(evidenceLinks)이 없습니다. 어떤 문서(해시)와 어느 구간(섹션/스팬)을 근거로 삼을지 제공해 주세요.",
        });
    }
    if (!hasConstraints) {
        questions.push({
            id: "Q2",
            priority: "MEDIUM",
            target: "system",
            text: "constraints가 비어 있습니다. 도메인 어댑터가 hard/soft 제약을 컴파일해 제공해야 합니다(없으면 불확실성 신호만 상승).",
        });
    }
    if (conflict) {
        questions.push({
            id: "Q3",
            priority: "HIGH",
            target: "system",
            text: "동일 ref에서 hard/soft 제약이 충돌합니다. RulePack/컴파일 단계에서 ref 매핑과 명칭 정합성을 확인해 주세요.",
        });
    }
    if (questions.length === 0 && overallTier === "HIGH") {
        questions.push({
            id: "Q4",
            priority: "MEDIUM",
            target: "user",
            text: "현재 상황에서 가장 확실히 정해진 전제(assumption)와 가장 불확실한 전제를 각각 1개씩 지정해 주세요.",
        });
    }
    const cappedQuestions = questions.slice(0, 6);
    return {
        itemId: "item3",
        requestId,
        uncertainty: {
            overallTier,
            density: {
                byAxis,
                byScenario: scenarioTiers,
            },
            sources,
        },
        questions: cappedQuestions,
        signals,
        meta: {
            noDecision: true,
            noGate: true,
            version: "v0.1",
        },
    };
}
