// ORBIT v0.2 — Deep Extension: diversity.dpp (STUB)
// 목적: 후보 다양성 확보용 최소 스텁 (항상 실행, 비용 1)
// 경계: 결정/집행/정책/승인/감사 금지, deep 분리 결과만 제공
function isAnalytical(ctx) {
    const exp = ctx.envelope?.exposure;
    return exp?.exposure === "analytical";
}
export const diversityDppV02 = {
    moduleId: "diversity.dpp",
    shouldRun: (_ctx) => true,
    // 고정 비용: 1 unit
    estimateUnits: (_ctx) => 1,
    async run(ctx) {
        const analytics = isAnalytical(ctx)
            ? { analytics: { note: "stub analytics (no-op)" } }
            : {};
        return {
            moduleId: "diversity.dpp",
            unitsUsed: 1,
            tags: ["stub", "v0.2"],
            output: {
                kind: "INLINE",
                inline: {
                    kind: "DIVERSITY_STUB",
                    note: "stub result (no-op)",
                    ...analytics,
                },
            },
        };
    },
};
