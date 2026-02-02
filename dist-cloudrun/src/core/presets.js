// src/core/presets.ts
const FLOORS = {
    spreadNMin: 200,
    selectKMin: 20,
    relaxStepsMin: 20,
    minClusters: 2,
};
export const PRESETS = {
    FREE: {
        id: "FREE",
        spreadN: 220,
        selectK: 22,
        relaxSteps: 22,
        relaxRadius: 0.18,
        gateScale: 3,
        eps: 0.06,
        minPts: 5,
        minClusters: 2,
        maxClusters: 5,
        floors: { ...FLOORS },
        exposure: "minimal",
        audience: "general",
        stakes: "low",
    },
    PLUS: {
        id: "PLUS",
        spreadN: 320,
        selectK: 30,
        relaxSteps: 26,
        relaxRadius: 0.18,
        gateScale: 3,
        eps: 0.06,
        minPts: 5,
        minClusters: 2,
        maxClusters: 5,
        floors: { ...FLOORS },
        exposure: "minimal",
        audience: "general",
        stakes: "low",
    },
    PRO: {
        id: "PRO",
        spreadN: 520,
        selectK: 40,
        relaxSteps: 30,
        relaxRadius: 0.18,
        gateScale: 5,
        eps: 0.06,
        minPts: 5,
        minClusters: 2,
        maxClusters: 5,
        floors: { ...FLOORS },
        exposure: "minimal",
        audience: "expert",
        stakes: "high",
    },
    ENTERPRISE_ANALYTICAL: {
        id: "ENTERPRISE_ANALYTICAL",
        spreadN: 900,
        selectK: 60,
        relaxSteps: 40,
        relaxRadius: 0.18,
        gateScale: 7,
        eps: 0.06,
        minPts: 5,
        minClusters: 2,
        maxClusters: 5,
        floors: { ...FLOORS },
        exposure: "analytical",
        audience: "enterprise",
        stakes: "high",
    },
};
/**
 * ✅ IMPORTANT: 기존 코드/테스트가 `assertPreset(PRESETS[k])` 를 호출함.
 * 그래서 "PresetConfig 검증 함수"는 반드시 이름이 assertPreset이어야 한다.
 */
export function assertPreset(cfg) {
    if (cfg.spreadN < cfg.floors.spreadNMin)
        throw new Error(`Preset ${cfg.id}: spreadN below floor`);
    if (cfg.selectK < cfg.floors.selectKMin)
        throw new Error(`Preset ${cfg.id}: selectK below floor`);
    if (cfg.relaxSteps < cfg.floors.relaxStepsMin)
        throw new Error(`Preset ${cfg.id}: relaxSteps below floor`);
    if (cfg.minClusters < cfg.floors.minClusters)
        throw new Error(`Preset ${cfg.id}: minClusters below floor`);
    if (cfg.maxClusters < cfg.minClusters)
        throw new Error(`Preset ${cfg.id}: cluster bounds invalid`);
}
/**
 * ✅ NEW: 외부 입력(string) -> PresetId narrowing 전용
 * (API Step 15에서 필요)
 */
export function assertPresetId(x) {
    if (!(x in PRESETS))
        throw new Error(`Invalid preset: ${x}`);
}
