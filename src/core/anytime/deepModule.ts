// src/core/anytime/deepModule.ts
//
// ORBIT v0.2 — Deep Module Contract (SSOT LOCK)
// - shouldRun / estimateUnits / run: 모두 필수
// - tier / implemented: 모두 필수
// - PolicyCtxOnly / UnitsCtxOnly: coreInternal 접근 금지(타입상 불가)
// - buildDeepPlanV02: any/optional 없이 registry 순서대로 "plan snapshot" 생성

import type { ExecutionEnvelopeV02 } from "./executionEnvelope";

// -----------------------------
// Context types (SSOT)
// -----------------------------

export type DeepContextV02 = {
  envelope: ExecutionEnvelopeV02;
  coreInternal?: unknown;
};

// coreInternal 접근 금지용 컨텍스트 (envelope 최소 필드만 전달)
export type PolicyCtxOnlyV02 = {
  envelope: Pick<ExecutionEnvelopeV02, "exposure" | "deep">;
};

export type UnitsCtxOnlyV02 = {
  envelope: Pick<ExecutionEnvelopeV02, "exposure" | "deep">;
};

// -----------------------------
// Output / Result (SSOT)
// -----------------------------

export type DeepOutputV02 =
  | { kind: "INLINE"; inline: unknown }
  | { kind: "URI"; uri: string; contentType?: string };

export type DeepRunResultV02 = {
  moduleId: string;
  output: DeepOutputV02;
  unitsUsed: number;
  tags?: string[];
};

// -----------------------------
// Module / Registry (SSOT)
// -----------------------------

export type DeepModuleV02 = {
  moduleId: string;

  // v0.2: deep 모듈만 (base/lite는 runner 훅으로만)
  tier: "deep";

  // implemented=false면 계획에서 제외(스텁/미구현 락)
  implemented: boolean;

  // 둘 다 필수. preflight/runner/plan에서 optional 호출 금지.
  shouldRun: (ctx: PolicyCtxOnlyV02) => boolean;
  estimateUnits: (ctx: UnitsCtxOnlyV02) => number;

  run: (ctx: DeepContextV02) => Promise<DeepRunResultV02>;
};

export type DeepModuleRegistryV02 = {
  modules: DeepModuleV02[];
};

// -----------------------------
// Plan building (registry order snapshot)
// -----------------------------

export type DeepPlannedItemV02 = {
  planIndex: number;
  moduleId: string;
};

export function buildDeepPlanV02(
  reg: DeepModuleRegistryV02,
  ctx: DeepContextV02
): DeepPlannedItemV02[] {
  const mods = reg.modules;
  const out: DeepPlannedItemV02[] = [];

  const policyCtx: PolicyCtxOnlyV02 = {
    envelope: {
      exposure: ctx.envelope.exposure,
      deep: ctx.envelope.deep,
    },
  };

  const unitsCtx: UnitsCtxOnlyV02 = {
    envelope: {
      exposure: ctx.envelope.exposure,
      deep: ctx.envelope.deep,
    },
  };

  // registry 순서가 곧 plan 스냅샷
  for (const m of mods) {
    if (!m.implemented) continue;
    if (!m.shouldRun(policyCtx)) continue;

    // estimateUnits는 runner가 다시 호출하지만,
    // plan 구성 시점에서 "실행 가능성"은 shouldRun만으로 판단 (SSOT)
    out.push({ planIndex: out.length, moduleId: m.moduleId });
  }

  return out;
}
