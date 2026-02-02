// apps/server/src/orbit/runAnytimeV02Route.ts
//
// v0.2 Route ??v0.1?�v0.2 wrap path is DISABLED by default (SSOT safety).
// Enable only when ORBIT_ALLOW_V01_WRAP === "1".

import { evaluateWithAnytimeV02 } from "../../../../src/core/anytime/router_v01_to_v02";

type BodyShape = {
  v01Args: any[]; // evaluate(...args) ?�플
  repro: {
    requestId: string;
    createdAt?: string;
    seed: number;
    presetId: string;
    codeVersion: string;
    docHash?: string;
    adapterVersion?: string;
    rulePackIds?: string[];
  };
  budget: { totalUnits: number; deepMaxUnits: number };
};

function isBodyShape(x: any): x is BodyShape {
  return (
    x &&
    Array.isArray(x.v01Args) &&
    x.repro &&
    typeof x.repro.requestId === "string" &&
    typeof x.repro.seed !== "undefined" &&
    typeof x.repro.presetId === "string" &&
    typeof x.repro.codeVersion === "string" &&
    x.budget &&
    typeof x.budget.totalUnits === "number" &&
    typeof x.budget.deepMaxUnits === "number"
  );
}

export async function POST(req: Request): Promise<Response> {
  try {
    // ??기본 비활??(prod ?�수 차단)
    if (process.env.ORBIT_ALLOW_V01_WRAP !== "1") {
      return Response.json(
        { error: "V01_WRAP_DISABLED" },
        { status: 501 }
      );
    }

    const raw = await req.json();
    if (!isBodyShape(raw)) {
      return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
    }

    const seed = globalThis.Number(raw.repro.seed);
    const totalUnits = globalThis.Number(raw.budget.totalUnits);
    const deepMaxUnits = globalThis.Number(raw.budget.deepMaxUnits);

    const env = await evaluateWithAnytimeV02({
      v01: raw.v01Args as any,
      repro: { ...raw.repro, seed },
      budget: { totalUnits, deepMaxUnits },
    });

    return Response.json(env, { status: 200 });
  } catch (e: any) {
    return Response.json(
      { error: "ANYTIME_V02_FAILED", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
