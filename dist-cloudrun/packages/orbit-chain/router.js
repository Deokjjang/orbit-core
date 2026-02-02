function pickItem3Thin(outputs) {
    const o = outputs["item3"];
    // item3 output shape could be either:
    // A) { overallTier, signals?, questions? }
    // B) { uncertainty: { overallTier, signals?, questions? }, ... }
    const u = o?.uncertainty ?? o ?? undefined;
    if (!u)
        return undefined;
    const overallTier = u?.overallTier;
    if (overallTier !== "LOW" && overallTier !== "MEDIUM" && overallTier !== "HIGH") {
        return undefined;
    }
    return {
        overallTier,
        signals: u?.signals,
        questions: u?.questions,
    };
}
/**
 * Router v0.1
 * - Produces the smallest payload that passes each item schema.
 * - No meaning interpretation; only field wiring.
 */
export const routerV01 = {
    build(step, ctx) {
        const { input, options, outputs } = ctx;
        switch (step) {
            /**
             * Phase1 items (1/2/4)
             * - For now router emits minimal placeholders.
             * - Execution path decision is handled elsewhere (server/core runner).
             */
            case "item1":
            case "item2":
            case "item4": {
                // If input already looks like ItemRequestBase (server/core path), pass-through.
                // required keys: init, constraints, preset, seed
                const anyIn = input;
                const looksLikeItemBase = anyIn &&
                    typeof anyIn === "object" &&
                    "init" in anyIn &&
                    "constraints" in anyIn &&
                    "preset" in anyIn &&
                    "seed" in anyIn;
                if (looksLikeItemBase)
                    return input;
                // fallback placeholder (worker env or incomplete input)
                return {
                    requestId: input.requestId,
                    init: input.state ?? { core: { u: 0, r: 0, i: 0, v: 0 } },
                    constraints: [],
                    preset: "default",
                    seed: 1,
                };
            }
            /**
             * Item3 (Uncertainty Mapper)
             * expects: { requestId, scenarioSet, state }
             */
            case "item3":
                return {
                    requestId: input.requestId,
                    scenarioSet: input.scenarioSet ?? [],
                    state: input.state ?? {},
                };
            /**
             * Item5 (Anti-Hallucination Filter)
             * Typically depends on upstream signals; keep minimal.
             */
            case "item5": {
                // Item5 requires a candidate { text }
                const subjectText = input.subject?.kind === "text" ? input.subject.text ?? "" : "";
                const text = subjectText || "candidate";
                return {
                    requestId: input.requestId,
                    candidate: {
                        text,
                        meta: { model: "chain_router" },
                    },
                    uncertainty: pickItem3Thin(outputs),
                    context: {
                        audience: options.audience ?? "general",
                        stakes: options.stakes ?? "low",
                    },
                };
            }
            /**
             * Item6 (Consensus Router)
             * **This is the one that was failing**
             * Needs: requestId + modelOutputs (or comparable fields)
             * We provide minimal "texts" from subject and upstream outputs.
             */
            case "item6_pre":
            case "item6_post": {
                const thin = pickItem3Thin(outputs);
                // candidates는 기존 로직 유지 (없으면 최소 2개 생성)
                const candidates = input.candidates && Array.isArray(input.candidates)
                    ? input.candidates
                    : [
                        { id: "c1", text: "candidate 1" },
                        { id: "c2", text: "candidate 2" },
                    ];
                // POST 단계에서만 item5ByCandidateId를 강제 주입
                const item5Out = outputs["item5"];
                const item5ByCandidateId = 
                // item6_post에서만 넣는다
                (step === "item6_post" && item5Out)
                    ? Object.fromEntries(candidates.map((c) => [
                        c.id,
                        { verdict: item5Out.verdict, reasons: item5Out.reasons },
                    ]))
                    : undefined;
                return {
                    requestId: input.requestId,
                    candidates,
                    uncertainty: thin,
                    item5ByCandidateId,
                    context: {
                        audience: options.audience ?? "general",
                        stakes: options.stakes ?? "low",
                    },
                };
            }
            /**
             * Item7 (Sense/Anomaly)
             * Needs observations; if absent, provide minimal 2 ticks from current state.
             */
            case "item7": {
                const core = input.state?.core ?? {};
                return {
                    requestId: input.requestId,
                    observations: [
                        { t: 1, state: { ...core } },
                        { t: 2, state: { ...core } },
                    ],
                };
            }
            /**
             * Item8 (Time & Revisit)
             */
            case "item8":
                return {
                    requestId: input.requestId,
                    signals: ctx.signals ?? input.signals ?? [],
                    meta: {
                        stakes: input?.meta?.stakes ?? "low",
                    },
                };
            /**
             * Item9 (HITL Optimizer)
             */
            case "item9":
                return {
                    requestId: input.requestId,
                    feedbacks: input.feedbacks ?? [],
                    meta: input.meta ?? {},
                };
            /**
             * Item10 (Meta-Agent Governor)
             * If absent, provide safe defaults.
             */
            case "item10":
                return {
                    requestId: input.requestId,
                    meta: {
                        loop: options.loop ?? 1,
                        slots: 1,
                        budget: { credits: 1 },
                        exposure: options.exposure ?? "minimal",
                        audience: options.audience ?? "general",
                        stakes: options.stakes ?? "low",
                    },
                    workspace: input.meta?.workspaceId
                        ? { id: input.meta.workspaceId, plan: input.meta.plan }
                        : undefined,
                };
            default:
                return { requestId: input.requestId };
        }
    },
    canBuild(step, ctx) {
        // v0.1: only enforce minimal requirements to avoid hard-blocking.
        if (!ctx.input.requestId)
            return { ok: false, reasons: ["missing_requestId"] };
        // item9: feedbacks 필요
        if (step === "item9" && (!ctx.input.feedbacks || ctx.input.feedbacks.length === 0)) {
            return { ok: false, reasons: ["missing_feedbacks"] };
        }
        // item6_post: outputs.item5 필요
        if (step === "item6_post") {
            const allowSkip = ctx.options?.branching?.allowSkip === true;
            if (allowSkip && !ctx.outputs?.item5) {
                return { ok: false, reasons: ["missing_item5"] };
            }
        }
        return { ok: true };
    },
};
