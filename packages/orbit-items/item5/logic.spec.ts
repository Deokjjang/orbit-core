import { describe, it, expect } from "vitest";
import { runItem5 } from "./logic";
import { Item5ResponseSchema } from "./schema.response";
import type { Item5Request } from "./schema.request";

function baseReq(overrides: Partial<Item5Request> = {}): Item5Request {
  return {
    requestId: "req_5_1",
    candidate: { text: "This is a cautious answer with conditions." },
    ...overrides,
  };
}

describe("Item5 Anti-Hallucination Filter (smoke)", () => {
  it("Case1: no evidenceLinks -> should HOLD with citation_missing", () => {
    const req = baseReq({
      candidate: { text: "ë°˜ë“œ??100% ë§žìŠµ?ˆë‹¤." },
    });
    const out = runItem5(req);

    expect(() => Item5ResponseSchema.parse(out)).not.toThrow();
    expect(out.verdict).toBe("HOLD");
    expect(out.reasons.some((r) => r.signal === "citation_missing")).toBe(true);
  });

  it("Case2: has evidenceLinks + calm text + low u -> should not be REJECT", () => {
    const req = baseReq({
      evidenceLinks: [{ docHash: "d1", sectionId: "s1", span: { start: 0, end: 10 } }],
      uncertainty: { overallTier: "LOW" },
      candidate: { text: "ì¡°ê±´ë¶€ë¡?ê°€?¥í•˜ë©? ?ˆì™¸ê°€ ?ˆìŠµ?ˆë‹¤." },
    });
    const out = runItem5(req);

    expect(() => Item5ResponseSchema.parse(out)).not.toThrow();
    expect(out.verdict).not.toBe("REJECT");
    expect(out.signals.hasCitations).toBe("YES");
  });

  it("Case3: high u + missing coverage -> should HOLD with u_high and/or coverage_gap", () => {
    const req = baseReq({
      uncertainty: {
        overallTier: "HIGH",
        questions: [
          { id: "Q1", text: "ê·¼ê±° ë¬¸ì„œê°€ ë¬´ì—‡?¸ê??" },
          { id: "Q2", text: "?œì•½ ì¡°ê±´?€ ë¬´ì—‡?¸ê??" },
        ],
      },
      candidate: { text: "??ëª¨ë¥´ê² ì?ë§??€ì¶??´ë ‡ê²??˜ë©´ ?©ë‹ˆ??" },
    });

    const out = runItem5(req);

    expect(() => Item5ResponseSchema.parse(out)).not.toThrow();
    expect(out.verdict).toBe("HOLD");
    expect(out.reasons.some((r) => r.signal === "u_high")).toBe(true);
    expect(out.reasons.some((r) => r.signal === "coverage_gap")).toBe(true);
  });
});
