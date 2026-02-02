// src/core/anytime/extensions/deepModuleV02.ts
//
// ORBIT v0.2 SSOT — Deep Module Interface (Extensions)
// 목적: v0.2 업그레이드 모듈의 “꽂는 면”을 단일 계약으로 고정
// 경계: 결정/의미부여/집행 금지, 계산/신호/분리결과만
//
// 다음 ㄱ: 첫 모듈 스텁(diversity.dpp) 구현
import { z } from "zod";
/** -------------------- Output -------------------- */
export const DeepOutputV02 = z.union([
    z.object({ kind: z.literal("INLINE"), inline: z.any() }),
    z.object({ kind: z.literal("URI"), uri: z.string().min(1) }),
]);
/** -------------------- Result -------------------- */
export const DeepRunResultV02 = z.object({
    moduleId: z.string().min(1),
    output: DeepOutputV02,
    unitsUsed: z.number().int().nonnegative(),
    tags: z.array(z.string().min(1)).default([]),
});
/** -------------------- Module Contract -------------------- */
export const DeepModuleV02 = z.object({
    // 고유 ID (registry 순서가 실행 순서)
    moduleId: z.string().min(1),
    // 실행 여부 판단 (순수 함수, 상태 변경 금지)
    shouldRun: z.custom(),
    // 비용 추정 (보수적, 예산 초과 방지용)
    estimateUnits: z.custom(),
    // 실행 (부작용 금지, 결과는 분리 산출)
    run: z.custom(),
});
/** -------------------- Registry -------------------- */
export const DeepModuleRegistryV02 = z.object({
    modules: z.array(DeepModuleV02).default([]),
});
