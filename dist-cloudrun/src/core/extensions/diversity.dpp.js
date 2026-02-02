// src/core/extensions/diversity.dpp.ts
export const diversityDppV02 = {
    moduleId: "diversity.dpp",
    tier: "deep",
    implemented: true,
    // ??PolicyCtxOnly
    shouldRun: (_ctx) => {
        return true;
    },
    // ??UnitsCtxOnly (결정??
    estimateUnits: (_ctx) => {
        return 1;
    },
    // ??DeepContextV02
    run: async (_ctx) => {
        return {
            moduleId: "diversity.dpp",
            unitsUsed: 1,
            tags: ["stub"],
            // ??DeepOutputV02 ??리터??고정
            output: {
                kind: "INLINE",
                inline: {
                    diversity: "stub",
                },
            },
        };
    },
};
