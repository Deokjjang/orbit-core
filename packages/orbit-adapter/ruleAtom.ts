// packages/orbit-adapter/ruleAtom.ts
//
// RuleAtom v0.1 — SSOT
// 목적: 규칙을 “데이터”로 표현하는 최소 단위.
// - 엔진 불변: RuleAtom은 계산/판단을 하지 않는다.
// - applyRules.ts에서 RulePack과 함께 해석되어
//   Constraints/Barriers/Axes/OpenQuestions/QualitySignals로 컴파일된다.
//
// 다음 파일(ㄱ): packages/orbit-adapter/rulePack.ts

import { z } from "zod";

/** ---------- Enums ---------- */

// 규칙이 작동하는 트리거(컨텍스트 키)
export const RuleTrigger = z.enum([
  "ALWAYS",
  "ON_ENTITY",
  "ON_OBLIGATION",
  "ON_RIGHT",
  "ON_LIABILITY",
  "ON_DATAFLOW",
  "ON_TIMER",
]);

export type RuleTrigger = z.infer<typeof RuleTrigger>;

// 규칙 효과 유형 (ORBIT 경계 준수)
export const RuleEffectType = z.enum([
  "HARD_BLOCK", // hard constraint (reject)
  "SOFT_BARRIER", // soft barrier (penalty)
  "AXIS_INIT", // 축 초기화(u/r/i/v or optional)
  "OPEN_QUESTION", // HOLD 해제 질문
  "QUALITY_SIGNAL", // 입력 품질 신호
]);

export type RuleEffectType = z.infer<typeof RuleEffectType>;

/** ---------- Effects ---------- */

// HARD / SOFT 공통 메타
const EffectBase = {
  id: z.string().min(1),
  reason: z.string().min(1), // explain(signal-only)에 노출될 사유 텍스트
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(), // UI tier용
};

// Hard reject (즉시 불가)
export const HardBlockEffect = z.object({
  ...EffectBase,
  type: z.literal("HARD_BLOCK"),
  constraintName: z.string().min(1), // Constraint 식별자
});

export type HardBlockEffect = z.infer<typeof HardBlockEffect>;

// Soft barrier (에너지 페널티)
export const SoftBarrierEffect = z.object({
  ...EffectBase,
  type: z.literal("SOFT_BARRIER"),
  barrierName: z.string().min(1),
  g: z.number().positive(), // barrier strength
  beta: z.number().positive(), // slope
});

export type SoftBarrierEffect = z.infer<typeof SoftBarrierEffect>;

// Axis 초기화 (u/r/i/v or optional axis)
export const AxisInitEffect = z.object({
  ...EffectBase,
  type: z.literal("AXIS_INIT"),
  axis: z.string().min(1), // e.g., "u","r","i","v","p","c","t"
  value: z.number().min(-1).max(1),
});

export type AxisInitEffect = z.infer<typeof AxisInitEffect>;

// HOLD 해제용 질문
export const OpenQuestionEffect = z.object({
  ...EffectBase,
  type: z.literal("OPEN_QUESTION"),
  question: z.string().min(1),
  target: z.enum(["USER", "UPSTREAM_SYSTEM"]).default("USER"),
});

export type OpenQuestionEffect = z.infer<typeof OpenQuestionEffect>;

// 입력 품질 신호 (OCR, 누락, 모호성 등)
export const QualitySignalEffect = z.object({
  ...EffectBase,
  type: z.literal("QUALITY_SIGNAL"),
  signal: z.enum([
    "MISSING_CLAUSE",
    "AMBIGUOUS_TEXT",
    "OCR_LOW_CONFIDENCE",
    "INCONSISTENT_TERMS",
    "UNSUPPORTED_FORMAT",
    "OTHER",
  ]),
});

export type QualitySignalEffect = z.infer<typeof QualitySignalEffect>;

export const RuleEffect = z.union([
  HardBlockEffect,
  SoftBarrierEffect,
  AxisInitEffect,
  OpenQuestionEffect,
  QualitySignalEffect,
]);

export type RuleEffect = z.infer<typeof RuleEffect>;

/** ---------- RuleAtom ---------- */

export const RuleAtom = z.object({
  id: z.string().min(1),
  description: z.string().min(1), // 사람이 읽는 규칙 설명
  triggers: z.array(RuleTrigger).min(1),
  /**
   * when: 매우 단순한 predicate 표현
   * - v0.1에서는 key/value match 정도만 허용
   * - 실제 평가 로직은 applyRules.ts에서 구현
   */
  when: z.record(z.string().min(1), z.any()).optional(),
  effects: z.array(RuleEffect).min(1),
  priority: z.number().int().min(0).max(100).default(50),
});

export type RuleAtom = z.infer<typeof RuleAtom>;

/** ---------- Helpers ---------- */

export function parseRuleAtom(input: unknown): RuleAtom {
  return RuleAtom.parse(input);
}

export function safeParseRuleAtom(input: unknown) {
  return RuleAtom.safeParse(input);
}
