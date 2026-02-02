// packages/orbit-adapter/ir.schema.ts
//
// IR (Intermediate Representation) v0.1 — SSOT
// 목적: ingest 결과를 “규칙 적용 가능”한 구조로 정규화한 최소 스키마.
// 다음 단계: RuleAtom/RulePack(applyRules)에서 이 IR을 입력으로 사용해
// Constraints/Barriers/AxesInit/EvidenceLinks/OpenQuestions/QualitySignals로 컴파일.
//
// NOTE: 이 파일은 “IR 스키마만” 다룬다. (RuleAtom/RulePack/compileToOrbit는 다음 파일들)

import { z } from "zod";

/** ---------- Common primitives ---------- */

export const Id = z.string().min(1);
export const IsoDate = z
  .string()
  .min(4)
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid ISO date string");

export const Confidence = z.number().min(0).max(1).optional();

/**
 * EvidenceSpan: 원문 근거 위치 표준(SSOT)
 * - docHash: 문서 해시(원문 불변성 키)
 * - sectionId: 논리 섹션/페이지/조항 등 식별자(문서 타입별)
 * - span: 텍스트 범위(문자 오프셋 또는 라인 기반) — v0.1은 char offset 권장
 */
export const EvidenceSpan = z.object({
  docHash: Id,
  sectionId: Id,
  span: z
    .object({
      start: z.number().int().nonnegative(),
      end: z.number().int().nonnegative(),
    })
    .refine((v) => v.end >= v.start, "span.end must be >= span.start"),
  quote: z.string().min(1).optional(), // optional: 디버깅/리뷰 편의용 (원문 저장은 Raw Layer가 담당)
});

export type EvidenceSpan = z.infer<typeof EvidenceSpan>;

export const EvidenceLinks = z.array(EvidenceSpan).default([]);
export type EvidenceLinks = z.infer<typeof EvidenceLinks>;

/** ---------- Entities ---------- */

export const EntityType = z.enum([
  "PERSON",
  "ORG",
  "GOV",
  "PRODUCT",
  "SERVICE",
  "SYSTEM",
  "DATASET",
  "LOCATION",
  "CONTRACT_PARTY",
  "UNKNOWN",
]);

export const Entity = z.object({
  id: Id, // 내부 식별자(정규화 키)
  type: EntityType,
  name: z.string().min(1), // 표기명
  aliases: z.array(z.string().min(1)).optional(),
  jurisdiction: z.string().min(1).optional(), // e.g., "KR", "EU", "US-CA"
  identifiers: z
    .record(z.string().min(1), z.string().min(1))
    .optional(), // e.g., {"registrationNo":"..."}
  evidenceLinks: EvidenceLinks.optional(),
  confidence: Confidence,
});

export type Entity = z.infer<typeof Entity>;

export const Entities = z.array(Entity).default([]);
export type Entities = z.infer<typeof Entities>;

/** ---------- Obligations / Rights ---------- */

export const Deontic = z.enum(["MUST", "SHOULD", "MAY", "MUST_NOT", "SHOULD_NOT"]);

export const Obligation = z.object({
  id: Id,
  subjectEntityId: Id, // 누가(의무 주체)
  objectEntityId: Id.optional(), // 대상(상대방/데이터/자산 등)
  deontic: Deontic, // MUST/SHOULD/...
  action: z.string().min(1), // 자연어 요약(정규화된 동사구)
  scope: z.string().min(1).optional(), // 범위/조건/예외 요약
  triggers: z.array(z.string().min(1)).optional(), // 이벤트 트리거(룰 엔진에서 사용)
  due: z
    .object({
      type: z.enum(["DATE", "DURATION", "EVENT", "NONE"]),
      date: IsoDate.optional(),
      durationDays: z.number().int().positive().optional(),
      event: z.string().min(1).optional(),
    })
    .optional(),
  evidenceLinks: EvidenceLinks.optional(),
  confidence: Confidence,
});

export type Obligation = z.infer<typeof Obligation>;
export const Obligations = z.array(Obligation).default([]);
export type Obligations = z.infer<typeof Obligations>;

export const Right = z.object({
  id: Id,
  holderEntityId: Id, // 권리 보유자
  againstEntityId: Id.optional(), // 상대방
  deontic: z.enum(["MAY", "MUST"]).default("MAY"), // 권리는 기본 MAY, 특정 권한 보장은 MUST로도 표현 가능
  action: z.string().min(1), // 권리 내용(정규화)
  scope: z.string().min(1).optional(),
  triggers: z.array(z.string().min(1)).optional(),
  evidenceLinks: EvidenceLinks.optional(),
  confidence: Confidence,
});

export type Right = z.infer<typeof Right>;
export const Rights = z.array(Right).default([]);
export type Rights = z.infer<typeof Rights>;

/** ---------- Liability Terms ---------- */

export const CurrencyCode = z
  .string()
  .regex(/^[A-Z]{3}$/, "Currency code must be ISO 4217 like 'KRW', 'USD'");

export const Money = z.object({
  amount: z.number().finite().nonnegative(),
  currency: CurrencyCode,
});

export type Money = z.infer<typeof Money>;

export const LiabilityCap = z.object({
  type: z.enum(["FIXED", "MULTIPLIER", "UNLIMITED", "UNKNOWN"]),
  money: Money.optional(), // FIXED일 때
  multiplier: z.number().finite().positive().optional(), // MULTIPLIER일 때 (e.g., 1.0x fees)
  basis: z.string().min(1).optional(), // multiplier 기준(e.g., "fees paid in last 12 months")
  exclusions: z.array(z.string().min(1)).optional(), // cap 적용 제외
  evidenceLinks: EvidenceLinks.optional(),
  confidence: Confidence,
});

export type LiabilityCap = z.infer<typeof LiabilityCap>;

export const Indemnity = z.object({
  id: Id,
  indemnifierEntityId: Id,
  indemnifiedEntityId: Id,
  scope: z.string().min(1), // indemnity 범위
  procedure: z.string().min(1).optional(), // 방어/통지 절차 등
  exclusions: z.array(z.string().min(1)).optional(),
  evidenceLinks: EvidenceLinks.optional(),
  confidence: Confidence,
});

export type Indemnity = z.infer<typeof Indemnity>;

export const LiabilityTerms = z.object({
  caps: z.array(LiabilityCap).default([]),
  indemnities: z.array(Indemnity).default([]),
  limitationOfLiabilityText: z.string().min(1).optional(), // 원문 요약
  governingLaw: z.string().min(1).optional(),
  disputeResolution: z.string().min(1).optional(),
  evidenceLinks: EvidenceLinks.optional(),
  confidence: Confidence,
});

export type LiabilityTerms = z.infer<typeof LiabilityTerms>;

/** ---------- Data Flow ---------- */

export const DataCategory = z.enum([
  "PII",
  "SENSITIVE_PII",
  "FINANCIAL",
  "HEALTH",
  "BIOMETRIC",
  "AUTH",
  "TELEMETRY",
  "CONTENT",
  "METADATA",
  "ANONYMIZED",
  "OTHER",
]);

export const DataFlowEdge = z.object({
  id: Id,
  fromEntityId: Id,
  toEntityId: Id,
  dataCategories: z.array(DataCategory).min(1),
  purpose: z.string().min(1).optional(),
  lawfulBasis: z.string().min(1).optional(), // GDPR 등 대응(있으면)
  retention: z
    .object({
      type: z.enum(["DURATION", "UNTIL_EVENT", "UNKNOWN"]),
      durationDays: z.number().int().positive().optional(),
      untilEvent: z.string().min(1).optional(),
    })
    .optional(),
  subprocessor: z.boolean().optional(),
  crossBorder: z.boolean().optional(),
  security: z
    .object({
      encryptionInTransit: z.boolean().optional(),
      encryptionAtRest: z.boolean().optional(),
      accessControl: z.string().min(1).optional(),
    })
    .optional(),
  evidenceLinks: EvidenceLinks.optional(),
  confidence: Confidence,
});

export type DataFlowEdge = z.infer<typeof DataFlowEdge>;

export const DataFlow = z.object({
  edges: z.array(DataFlowEdge).default([]),
  notes: z.array(z.string().min(1)).optional(),
  evidenceLinks: EvidenceLinks.optional(),
  confidence: Confidence,
});

export type DataFlow = z.infer<typeof DataFlow>;

/** ---------- Timers / Dates ---------- */

export const Timer = z.object({
  id: Id,
  type: z.enum([
    "NOTICE_PERIOD",
    "TERM_LENGTH",
    "RENEWAL",
    "TERMINATION",
    "CURE_PERIOD",
    "SLA_WINDOW",
    "PAYMENT_DUE",
    "RETENTION",
    "OTHER",
  ]),
  value: z
    .object({
      kind: z.enum(["DAYS", "MONTHS", "DATE", "EVENT", "UNKNOWN"]),
      days: z.number().int().positive().optional(),
      months: z.number().int().positive().optional(),
      date: IsoDate.optional(),
      event: z.string().min(1).optional(),
    })
    .optional(),
  appliesToEntityId: Id.optional(),
  scope: z.string().min(1).optional(),
  evidenceLinks: EvidenceLinks.optional(),
  confidence: Confidence,
});

export type Timer = z.infer<typeof Timer>;
export const Timers = z.array(Timer).default([]);
export type Timers = z.infer<typeof Timers>;

/** ---------- IR Root ---------- */

export const IrDocumentMeta = z.object({
  docHash: Id, // Raw Layer 문서 해시와 동일 키
  title: z.string().min(1).optional(),
  sourceType: z.enum(["PDF", "DOCX", "HTML", "TEXT", "UNKNOWN"]).default("UNKNOWN"),
  locale: z.string().min(1).optional(), // e.g., "ko-KR"
  createdAt: IsoDate.optional(),
});

export type IrDocumentMeta = z.infer<typeof IrDocumentMeta>;

export const IrSchemaV01 = z.object({
  version: z.literal("ir.v0.1"),
  meta: IrDocumentMeta,
  entities: Entities,
  obligations: Obligations,
  rights: Rights,
  liabilityTerms: LiabilityTerms.optional(),
  dataFlow: DataFlow.optional(),
  timers: Timers,
  evidenceLinks: EvidenceLinks.optional(), // 문서 전체 레벨 근거(옵션)
});

export type IrV01 = z.infer<typeof IrSchemaV01>;

/** ---------- Helpers (strict parse) ---------- */

export function parseIrV01(input: unknown): IrV01 {
  return IrSchemaV01.parse(input);
}

export function safeParseIrV01(input: unknown) {
  return IrSchemaV01.safeParse(input);
}
