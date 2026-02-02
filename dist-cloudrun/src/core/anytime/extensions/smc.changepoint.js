// ORBIT v0.2 — Deep Extension: smc.changepoint (STUB, analytical opt-in)
// 목적: exposure=analytical일 때만 analytics 블록 포함
// 경계: 결정/집행/정책/승인/감사 금지, deep 분리 결과만 제공
function isAnalytical(ctx) {
    const exp = ctx.envelope?.exposure;
    return exp?.exposure === "analytical";
}
export const smcChangepointV02 = {
    moduleId: "smc.changepoint",
    shouldRun: (_ctx) => true,
    // 고정 비용: 2 units
    estimateUnits: (_ctx) => 2,
    async run(ctx) {
        const analytics = isAnalytical(ctx)
            ? {
                analytics: {
                    changePoint: "UNKNOWN",
                    note: "stub analytics (no-op)",
                },
            }
            : {};
        return {
            moduleId: "smc.changepoint",
            unitsUsed: 2,
            tags: ["stub", "v0.2", isAnalytical(ctx) ? "analytical" : "minimal"],
            output: {
                kind: "INLINE",
                inline: {
                    kind: "SMC_STUB",
                    note: "stub result (no-op)",
                    ...analytics,
                },
            },
        };
    },
};
