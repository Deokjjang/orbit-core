// src/core/anytime/deepModule.ts
//
// ORBIT v0.2 — Deep Module Contract (SSOT LOCK)
// - shouldRun / estimateUnits / run: 모두 필수
// - tier / implemented: 모두 필수
// - PolicyCtxOnly / UnitsCtxOnly: coreInternal 접근 금지(타입상 불가)
// - buildDeepPlanV02: any/optional 없이 registry 순서대로 "plan snapshot" 생성
export function buildDeepPlanV02(reg, ctx) {
    const mods = reg.modules;
    const out = [];
    const policyCtx = {
        envelope: {
            exposure: ctx.envelope.exposure,
            deep: ctx.envelope.deep,
        },
    };
    const unitsCtx = {
        envelope: {
            exposure: ctx.envelope.exposure,
            deep: ctx.envelope.deep,
        },
    };
    // registry 순서가 곧 plan 스냅샷
    for (const m of mods) {
        if (!m.implemented)
            continue;
        if (!m.shouldRun(policyCtx))
            continue;
        // estimateUnits는 runner가 다시 호출하지만,
        // plan 구성 시점에서 "실행 가능성"은 shouldRun만으로 판단 (SSOT)
        out.push({ planIndex: out.length, moduleId: m.moduleId });
    }
    return out;
}
