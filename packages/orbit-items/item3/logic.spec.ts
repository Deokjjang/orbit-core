import { describe, it, expect } from "vitest";
import { runItem3 } from "./logic";
import { Item3ResponseSchema } from "./schema.response";
import type { Item3Request } from "./schema.request";

function baseReq(overrides: Partial<Item3Request> = {}): Item3Request {
  return {
    requestId: "req_1",
    scenarioSet: [{ id: "s1", label: "base scenario" }],
    state: { core: { v: 0.1, r: 0.1, u: 0.1, i: 0.1 } },
    ...overrides,
  };
}

describe("Item3 Uncertainty Mapper (smoke)", () => {
  it("Case1: minimal input -> should run, return required fields, no crash", () => {
    const req = baseReq();
    const out = runItem3(req);

    // schema validation (hard guarantee)
    expect(() => Item3ResponseSchema.parse(out)).not.toThrow();

    expect(out.itemId).toBe("item3");
    expect(out.requestId).toBe("req_1");
    expect(out.meta.noDecision).toBe(true);
    expect(out.meta.noGate).toBe(true);
  });

  it("Case2: missing evidence/constraints -> should raise tier & include evidence_gap", () => {
    const req = baseReq({
      state: { core: { v: 0.1, r: 0.1, u: 0.1, i: 0.1 } }, // LOW base
      // no evidenceLinks, no constraints
    });
    const out = runItem3(req);

    expect(out.uncertainty.sources.some((s) => s.where === "evidence" && s.type === "MISSING")).toBe(true);
    expect(out.uncertainty.sources.some((s) => s.where === "constraint" && s.type === "MISSING")).toBe(true);
    expect(out.signals.some((s) => s.name === "evidence_gap")).toBe(true);

    // base u was LOW; missing evidence/constraints should bump at least once => not LOW
    expect(out.uncertainty.overallTier).toBe("MEDIUM");

    // should ask at least one evidence question
    expect(out.questions.length).toBeGreaterThan(0);
    expect(out.questions[0].target === "evidence" || out.questions.some((q) => q.target === "evidence")).toBe(true);
  });

  it("Case3: constraint conflict -> overallTier HIGH + constraint_conflict signal", () => {
    const req = baseReq({
      constraints: {
        hard: [{ name: "H1", rule: "x", ref: "refA" }],
        soft: [{ name: "S1", g: 1, beta: 1, ref: "refA" }], // same ref, different name => conflict
      },
      evidenceLinks: [
        { docHash: "d", sectionId: "sec", span: { start: 0, end: 10 } },
      ],
    });

    const out = runItem3(req);

    expect(out.signals.some((s) => s.name === "constraint_conflict" && s.severity === "HIGH")).toBe(true);
    expect(out.uncertainty.sources.some((s) => s.type === "CONFLICT" && s.where === "constraint" && s.ref === "refA")).toBe(true);
    expect(out.uncertainty.overallTier).toBe("HIGH");
  });
});
