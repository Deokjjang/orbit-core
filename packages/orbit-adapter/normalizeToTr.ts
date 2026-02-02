// packages/orbit-adapter/normalizeToIr.ts
//
// IR Normalize v0.1 ??SSOT
// ëª©ì : RawEnvelope(text/sections) -> IR(v0.1) ìµœì†Œ ?•ê·œ??
// ì£¼ì˜: ?¬ê¸°?œëŠ” ?œì¶”ì¶??´ì„?ì„ ?˜ì? ?ŠëŠ”??
// - entities/obligations/rights/...??ë¹?ë°°ì—´(?¹ì? undefined)ë¡??œì‘ ê°€??
// - evidenceLinks ?œì???docHash/sectionId/span)?€ meta ?•ë¦¬ë§??˜í–‰.
// ?¤ìŒ ?Œì¼(??: packages/orbit-adapter/ruleAtom.ts

import { z } from "zod";
import {
  IrSchemaV01,
  type IrV01,
  EvidenceSpan,
} from "./ir.schema";
import {
  RawEnvelopeV01,
  RawSpan,
} from "./ingest";

/** ---------- Inputs ---------- */

export const NormalizeOptionsV01 = z.object({
  /**
   * ?¹ì…˜???†ëŠ” text ?…ë ¥??ê²½ìš° sectionId ë¶€??ë°©ì‹
   * - "single": sec_1 ?¨ì¼ ?¹ì…˜?¼ë¡œ ì·¨ê¸‰ (ê¸°ë³¸)
   * - "none": sectionId ?†ì´ evidenceLinks ?ì„±(ë¹„ê¶Œ?? ì¶”ì  ?ˆì§ˆ ?€??
   */
  textSectionMode: z.enum(["single", "none"]).default("single"),

  /**
   * text ?…ë ¥????ë¬¸ì„œ ?„ì²´ë¥?ê·¼ê±° 1ê°œë¡œ ?¡ì„ì§€
   * - true: EvidenceSpan 1ê°?docHash, sectionId, span ?„ì²´)
   * - false: evidenceLinks ë¹„ì?
   */
  attachWholeTextEvidence: z.boolean().default(false),
});

export type NormalizeOptionsV01 = z.infer<typeof NormalizeOptionsV01>;

/** ---------- Helpers ---------- */

function clampSpan(span: { start: number; end: number }, len: number) {
  const s = Math.max(0, Math.min(span.start, len));
  const e = Math.max(0, Math.min(span.end, len));
  return { start: Math.min(s, e), end: Math.max(s, e) };
}

function makeEvidenceSpan(params: {
  docHash: string;
  sectionId: string;
  span?: { start: number; end: number };
  quote?: string;
  textLen?: number;
}): z.infer<typeof EvidenceSpan> {
  const span =
    params.span && typeof params.textLen === "number"
      ? clampSpan(params.span, params.textLen)
      : params.span ?? { start: 0, end: 0 };

  return EvidenceSpan.parse({
    docHash: params.docHash,
    sectionId: params.sectionId,
    span,
    quote: params.quote,
  });
}

function wholeSpan(text: string) {
  return RawSpan.parse({ start: 0, end: text.length });
}

/** ---------- Normalize (pure) ---------- */

export function normalizeToIrV01(
  raw: RawEnvelopeV01,
  options?: Partial<NormalizeOptionsV01>
): IrV01 {
  const env = RawEnvelopeV01.parse(raw);
  const opt = NormalizeOptionsV01.parse(options ?? {});

  const meta = {
    docHash: env.docHash,
    title: env.meta.title,
    sourceType: env.meta.sourceType,
    locale: env.meta.locale,
    createdAt: env.meta.createdAt,
  };

  // evidenceLinks ?œì??? sectionsê°€ ?ˆìœ¼ë©?sections ?¨ìœ„ë¡? ?†ìœ¼ë©??µì…˜???°ë¼ ?¨ì¼ ?¹ì…˜ ì²˜ë¦¬
  const evidenceLinks = (() => {
    const links: Array<z.infer<typeof EvidenceSpan>> = [];

    const sections = env.artifact.sections;
    if (sections && sections.length > 0) {
      for (const sec of sections) {
        // section text ê¸¸ì´ ê¸°ë°˜ span?€ optional. v0.1?ì„œ??sectionIdë§??ˆì–´??ì¶©ë¶„.
        // span???ˆìœ¼ë©?? ì?, ?†ìœ¼ë©??ëµ(0,0)
        const span = sec.evidence?.span;
        const quote = sec.evidence?.quote;

        links.push(
          makeEvidenceSpan({
            docHash: env.docHash,
            sectionId: sec.id,
            span: span
              ? { start: span.start, end: span.end }
              : undefined,
            quote,
            textLen: span ? sec.text.length : undefined,
          })
        );
      }
      return links;
    }

    // text-only
    if (opt.textSectionMode === "none") {
      return links;
    }

    const sectionId = "sec_1";
    if (!opt.attachWholeTextEvidence) {
      // ìµœì†Œ ê·¼ê±°: sectionIdë§??¨ê¸°ê³?span 0,0
      links.push(
        makeEvidenceSpan({
          docHash: env.docHash,
          sectionId,
          span: { start: 0, end: 0 },
        })
      );
      return links;
    }

    // ë¬¸ì„œ ?„ì²´ë¥?1ê°?ê·¼ê±°ë¡?ì²¨ë?
    const sp = wholeSpan(env.artifact.text);
    links.push(
      makeEvidenceSpan({
        docHash: env.docHash,
        sectionId,
        span: { start: sp.start, end: sp.end },
        textLen: env.artifact.text.length,
      })
    );
    return links;
  })();

  // IR?€ ?œì˜ë¯??´ì„ ?„â€ìœ¼ë¡?ë¹?êµ¬ì¡°ë¥??ˆìš©
  const ir: IrV01 = IrSchemaV01.parse({
    version: "ir.v0.1",
    meta,
    entities: [],
    obligations: [],
    rights: [],
    liabilityTerms: undefined,
    dataFlow: undefined,
    timers: [],
    evidenceLinks,
  });

  return ir;
}

/** ---------- Strict parse for convenience ---------- */

export function parseNormalizeOptionsV01(input: unknown): NormalizeOptionsV01 {
  return NormalizeOptionsV01.parse(input);
}

export function safeParseNormalizeOptionsV01(input: unknown) {
  return NormalizeOptionsV01.safeParse(input);
}
