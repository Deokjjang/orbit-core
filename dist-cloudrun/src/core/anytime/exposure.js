// src/core/anytime/exposure.ts
//
// ORBIT v0.2 SSOT — Exposure Switch (minimal vs analytical)
// 목적: “외부 출력은 기본 라벨/신호” 원칙을 v0.2 envelope 레벨에서 고정
// - 엔진 내부는 수치/확률 계산 허용
// - 외부 노출은 exposure/audience/stakes로 제어(Opt-in)
// 경계: 결정/의미부여 금지 (표현 정책만)
//
// 다음 ㄱ: runAnytimeV02에 exposure를 주입(1파일 수정)
import { z } from "zod";
export const ExposureV02 = z.enum(["minimal", "analytical"]);
export const AudienceV02 = z.enum(["general", "expert", "enterprise"]);
export const StakesV02 = z.enum(["low", "high"]);
export const ExposurePolicyV02 = z.object({
    exposure: ExposureV02.default("minimal"),
    audience: AudienceV02.default("general"),
    stakes: StakesV02.default("low"),
});
/**
 * v0.2 기본 규칙:
 * - minimal: deep 결과도 수치 대신 tier/signal 중심(모듈이 책임)
 * - analytical: deep 결과에서 opt-in 수치/구간/그래프 ref 허용(여전히 분리 저장)
 */
export function allowAnalytical(policy) {
    return policy.exposure === "analytical";
}
