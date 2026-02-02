import { routerV01 } from "./router";
import type { RouterContext } from "./router.contract";

import type {
  ChainInput,
  ChainOptions,
  ChainResult,
  ChainStepId,
  ChainStepTrace,
  RunnerEnv,
} from "./contract";

type Runner = (step: ChainStepId, payload: unknown) => Promise<unknown>;

export async function runOrbitChain(
  input: ChainInput,
  options: ChainOptions,
  runner: Runner,
  env: RunnerEnv
): Promise<ChainResult> {
  const traces: ChainStepTrace[] = [];

  const steps: ChainStepId[] =
  env === "server"
    ? (["item1", "item2", "item4"] as const)
    : ([
        "item1",
        "item2",
        "item3",
        "item6_pre",
        "item4",
        "item7",
        "item8",
        "item9",
        "item10",
        "item5",
        "item6_post",
      ] as const);

  const outputs: Partial<Record<ChainStepId, unknown>> = {};

  for (const step of steps) {
    // Phase1 items are server/core-only
    const isPhase1 = step === "item1" || step === "item2" || step === "item4";
    if (env === "worker" && isPhase1) {
      traces.push({
        step,
        status: "SKIPPED",
        notes: ["skip:phase1_server_only"],
      });
      continue;
    }

    const ctx: RouterContext = {
      input,
      options,
      outputs,
      signals: input.signals,
    };

    const can = routerV01.canBuild?.(step, ctx);
    if (options?.branching?.allowSkip && can && !can.ok) {
      traces.push({
        step,
        status: "SKIPPED",
        notes: can.reasons?.map((r) => `skip:${r}`),
      });
      continue;
    }

    const payload = routerV01.build(step, ctx);

    try {
      const out = await runner(step, payload);
      outputs[step] = out;

      let signalShape: "none" | "array" | "object" | "other" = "none";
      let signals: unknown = undefined;

      if (out && typeof out === "object" && "signals" in (out as any)) {
        signals = (out as any).signals;
        signalShape = Array.isArray(signals)
          ? "array"
          : typeof signals === "object"
          ? "object"
          : "other";
      }

      traces.push({
  step,
  status: "SUCCEEDED",
  signals,
  signalShape,
});
    } catch (e: any) {
  traces.push({
    step,
    status: "FAILED",
    notes: ["execution_failed", String(e?.message ?? e)],
  });

  if (!options?.branching?.allowRetry) break;
}
  }

  return {
    summary: { disposition: "CONTINUE" },
    optionsMap: [],
    traces,
  };
}
