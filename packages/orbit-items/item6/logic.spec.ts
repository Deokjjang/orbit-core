import { describe, it, expect } from "vitest";
import { runItem6 } from "./logic";
import { Item6ResponseSchema } from "./schema.response";
import type { Item6Request } from "./schema.request";

function baseReq(overrides: Partial<Item6Request> = {}): Item6Request {
  return {
    requestId: "req_6_1",
    candidates: [
      { id: "c1", text: "ì¡°ê±´ë¶€ë¡?ê°€?¥í•˜ë©??ˆì™¸ê°€ ?ˆìŠµ?ˆë‹¤. ê·¼ê±°???¹ì…˜ 1??ì°¸ê³ ." },
      { id: "c2", text: "ì¡°ê±´ë¶€ë¡?ê°€?¥í•˜ë©??ˆì™¸ê°€ ?ˆìŠµ?ˆë‹¤. ?¹ì…˜ 1 ê·¼ê±°ë¥?ì°¸ê³ ?˜ì„¸??" },
    ],
    uncertainty: { overallTier: "LOW" },
    ...overrides,
  };
}

describe("Item6 Multi-Model Consensus Router (smoke)", () => {
  it("Case1: very similar texts -> AGREE/HIGH overlap", () => {
    const out = runItem6(baseReq());
    expect(() => Item6ResponseSchema.parse(out)).not.toThrow();
    expect(out.consensus).toBe("AGREE");
    expect(out.overlap).toBe("HIGH");
  });

  it("Case2: divergent texts + negation -> DISAGREE/LOW overlap + contradiction signal", () => {
    const req = baseReq({
      candidates: [
        { id: "c1", text: "ê°€?¥í•©?ˆë‹¤. ??ƒ ?©ë‹ˆ?? 100% ë³´ìž¥." },
        { id: "c2", text: "ë¶ˆê??©ë‹ˆ?? ???í™©?ì„œ???ˆë? ???©ë‹ˆ??" },
        { id: "c3", text: "ëª¨ë¥´ê² ìŠµ?ˆë‹¤. ê·¼ê±°ê°€ ?†ìŠµ?ˆë‹¤." },
      ],
      uncertainty: { overallTier: "HIGH", questions: [{ id: "Q1", text: "ê·¼ê±°??" }] },
    });
    const out = runItem6(req);

    expect(() => Item6ResponseSchema.parse(out)).not.toThrow();
    expect(out.consensus).toBe("DISAGREE");
    expect(out.overlap).toBe("LOW");
    expect(out.varianceSignals.some((s) => s.name === "contradiction")).toBe(true);
    expect(out.varianceSignals.some((s) => s.name === "u_high")).toBe(true);
  });

  it("Case3: item5 HOLD heavy -> should emit item5_hold_heavy", () => {
    const req = baseReq({
      candidates: [
        { id: "c1", text: "?€ì¶??´ë ‡ê²??˜ë©´ ?©ë‹ˆ??" },
        { id: "c2", text: "??ëª¨ë¥´ê² ì?ë§??„ë§ˆ ?©ë‹ˆ??" },
        { id: "c3", text: "ê·¼ê±° ?†ì´ ì¶”ì •?©ë‹ˆ??" },
      ],
      item5ByCandidateId: {
        c1: { verdict: "HOLD" },
        c2: { verdict: "HOLD" },
        c3: { verdict: "USE" },
      },
      uncertainty: { overallTier: "MEDIUM", questions: [{ id: "Q1", text: "ê·¼ê±°??" }, { id: "Q2", text: "?œì•½?€?" }] },
    });

    const out = runItem6(req);

    expect(() => Item6ResponseSchema.parse(out)).not.toThrow();
    expect(out.varianceSignals.some((s) => s.name === "item5_hold_heavy")).toBe(true);
  });
});
