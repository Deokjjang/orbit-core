import { Item10RequestSchema, Item10ResultSchema, type Item10Request, type Item10Result } from "./schema";

/* ============================================================
 * Item10 ??Meta-Agent Governor (v0.1)
 * - governs request metadata (loop/slots/budget)
 * - NO content judgment
 * - expression-only verdict
 * ============================================================ */

const DEFAULT_LIMITS = {
  loopMax: 1,
  slotsMax: 1,
  creditsMax: 0,
} as const;

type Limits = {
  loopMax: number;
  slotsMax: number;
  creditsMax: number;
};

function deriveLimits(req: Item10Request): Limits {
  // v0.1: conservative fixed caps; later bind to workspace plan
  // NOTE: do not infer business pricing; just caps.
  const plan = req.workspace?.plan?.toLowerCase();

  if (plan === "enterprise") return { loopMax: 5, slotsMax: 10, creditsMax: 10_000 };
  if (plan === "business") return { loopMax: 4, slotsMax: 6, creditsMax: 1_000 };
  if (plan === "team") return { loopMax: 3, slotsMax: 3, creditsMax: 300 };
  if (plan === "pro") return { loopMax: 3, slotsMax: 1, creditsMax: 100 };
  if (plan === "plus") return { loopMax: 2, slotsMax: 1, creditsMax: 30 };
  if (plan === "free") return { loopMax: 1, slotsMax: 1, creditsMax: 8 };

  return { ...DEFAULT_LIMITS };
}

export function runItem10(raw: unknown): Item10Result {
  const req = Item10RequestSchema.parse(raw);

  const limits = deriveLimits(req);

  const signals: Item10Result["signals"] = [];

  const loop = req.meta.loop ?? 0;
  const slots = req.meta.slots ?? 0;
  const credits = req.meta.budget?.credits ?? 0;

  if (loop > limits.loopMax) {
    signals.push({
      code: "loop_exceeded",
      severity: "MED",
      note: "requested loop exceeds limit",
    });
  }

  if (slots > limits.slotsMax) {
    signals.push({
      code: "slots_exceeded",
      severity: "MED",
      note: "requested slots exceeds limit",
    });
  }

  if (credits > limits.creditsMax) {
    signals.push({
      code: "budget_exceeded",
      severity: "HIGH",
      note: "requested credits exceeds limit",
    });
  }

  // expression-only verdict
  // - BLOCK only when budget exceeded (hard cap)
  // - HOLD when loop/slots exceeded (soft friction)
  // - ALLOW otherwise
  const verdict =
    signals.some(s => s.code === "budget_exceeded")
      ? "BLOCK"
      : signals.length > 0
        ? "HOLD"
        : "ALLOW";

  return Item10ResultSchema.parse({
    verdict,
    signals,
    limits,
  });
}
