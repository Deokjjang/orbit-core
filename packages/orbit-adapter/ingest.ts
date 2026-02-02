// packages/orbit-adapter/ingest.ts
//
// Ingest v0.1 — SSOT
// 목적: 입력(문서/텍스트/구조)을 “IR normalize” 단계에 넘길 수 있는 최소 RawEnvelope로 변환.
// 주의: 여기서는 의미 해석/규칙 적용/ORBIT 컴파일 금지. (경계 준수)
//
// 다음 파일(ㄱ): packages/orbit-adapter/normalizeToIr.ts

import { z } from "zod";

export const Id = z.string().min(1);
export const IsoDate = z
  .string()
  .min(4)
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid ISO date string");

export const SourceType = z.enum(["PDF", "DOCX", "HTML", "TEXT", "UNKNOWN"]);

export const RawSpan = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
}).refine((v) => v.end >= v.start, "span.end must be >= span.start");

export type RawSpan = z.infer<typeof RawSpan>;

/**
 * RawEvidence: v0.1에서 근거는 “원문 기반”으로만 유지.
 * - normalizeToIr 단계에서 EvidenceSpan(docHash/sectionId/span)로 표준화됨.
 */
export const RawEvidence = z.object({
  sectionId: Id.optional(), // 없으면 normalize 단계에서 추정/생성 가능
  span: RawSpan.optional(),
  quote: z.string().min(1).optional(),
});

export type RawEvidence = z.infer<typeof RawEvidence>;

/**
 * RawArtifact: ingest 결과물 (의미 해석 전)
 * - text: 분석 대상 텍스트 (필수)
 * - sections: 선택(있으면 근거 추적 품질↑)
 */
export const RawSection = z.object({
  id: Id,
  title: z.string().min(1).optional(),
  text: z.string().min(1),
  evidence: RawEvidence.optional(),
});

export type RawSection = z.infer<typeof RawSection>;

export const RawArtifact = z.object({
  text: z.string().min(1),
  sections: z.array(RawSection).optional(),
});

export type RawArtifact = z.infer<typeof RawArtifact>;

/**
 * RawEnvelope: ingest의 표준 출력
 * - docHash: Raw Layer 불변 키 (v0.1은 외부에서 주입 or 임시 생성 둘 다 허용)
 * - meta: 파일 메타/로케일 등
 */
export const RawEnvelopeV01 = z.object({
  version: z.literal("raw.v0.1"),
  docHash: Id,
  meta: z.object({
    title: z.string().min(1).optional(),
    sourceType: SourceType.default("UNKNOWN"),
    locale: z.string().min(1).optional(), // e.g., "ko-KR"
    createdAt: IsoDate.optional(),
  }),
  artifact: RawArtifact,
});

export type RawEnvelopeV01 = z.infer<typeof RawEnvelopeV01>;

/** ---------- Inputs (ingest entry types) ---------- */

export const IngestTextInput = z.object({
  kind: z.literal("text"),
  docHash: Id.optional(),
  title: z.string().min(1).optional(),
  locale: z.string().min(1).optional(),
  createdAt: IsoDate.optional(),
  text: z.string().min(1),
});

export type IngestTextInput = z.infer<typeof IngestTextInput>;

export const IngestSectionsInput = z.object({
  kind: z.literal("sections"),
  docHash: Id.optional(),
  title: z.string().min(1).optional(),
  locale: z.string().min(1).optional(),
  createdAt: IsoDate.optional(),
  sections: z.array(
    z.object({
      id: Id.optional(),
      title: z.string().min(1).optional(),
      text: z.string().min(1),
    })
  ),
});

export type IngestSectionsInput = z.infer<typeof IngestSectionsInput>;

export const IngestInput = z.union([IngestTextInput, IngestSectionsInput]);
export type IngestInput = z.infer<typeof IngestInput>;

/** ---------- Ingest (pure) ---------- */

/**
 * v0.1 임시 docHash 생성:
 * - 외부에서 docHash를 주입하는 게 정석(SSOT: Raw Layer에서 docHash 관리)
 * - 하지만 테스트/로컬 개발 편의를 위해 ingest에서 fallback 제공
 */
function fallbackDocHash(): string {
  // crypto 없는 환경도 고려: 시간+난수 기반(충돌 가능성 낮지만 “불변 키”로는 임시용)
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `tmp_${t}_${r}`;
}

function joinSections(sections: Array<{ text: string }>): string {
  // 섹션 사이 구분자: normalize 단계에서 sectionId/span 추적 가능하게 줄바꿈 2개
  return sections.map((s) => s.text.trim()).filter(Boolean).join("\n\n");
}

export function ingestV01(input: IngestInput): RawEnvelopeV01 {
  const parsed = IngestInput.parse(input);

  const docHash = parsed.docHash ?? fallbackDocHash();

  if (parsed.kind === "text") {
    return RawEnvelopeV01.parse({
      version: "raw.v0.1",
      docHash,
      meta: {
        title: parsed.title,
        sourceType: "TEXT",
        locale: parsed.locale,
        createdAt: parsed.createdAt,
      },
      artifact: {
        text: parsed.text,
      },
    });
  }

  // sections
  const sections: RawSection[] = parsed.sections.map((s, idx) => {
    const id = (s.id ?? `sec_${idx + 1}`) as string;
    return {
      id,
      title: s.title,
      text: s.text,
      evidence: {
        sectionId: id,
      },
    };
  });

  return RawEnvelopeV01.parse({
    version: "raw.v0.1",
    docHash,
    meta: {
      title: parsed.title,
      sourceType: "TEXT",
      locale: parsed.locale,
      createdAt: parsed.createdAt,
    },
    artifact: {
      text: joinSections(sections),
      sections,
    },
  });
}

/** ---------- Helpers ---------- */

export function parseRawEnvelopeV01(input: unknown): RawEnvelopeV01 {
  return RawEnvelopeV01.parse(input);
}

export function safeParseRawEnvelopeV01(input: unknown) {
  return RawEnvelopeV01.safeParse(input);
}
