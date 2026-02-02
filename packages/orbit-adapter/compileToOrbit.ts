// packages/orbit-adapter/compileToOrbit.ts
//
// compileToOrbit v0.1 ??SSOT
// Î™©Ï†Å: IR + AppliedRulesResult -> ORBIT ?ÖÎ†•Î¨??ùÏÑ±
// ?∞Ï∂ú: ScenarioSet + AxesInit + Constraints(hard/soft) + EvidenceLinks + OpenQuestions + QualitySignals
// Í≤ΩÍ≥Ñ: Í≤∞Ï†ï/ÏßëÌñâ/?òÎ? Î∂Ä??Í∏àÏ?. ?∞Ïù¥??Ïª¥Ìåå?ºÎßå ?òÌñâ.
//
// ?§Ïùå ?åÏùº(??: test/adapter.golden.test.ts

import { z } from "zod";
import type { IrV01 } from "./ir.schema";
import { AppliedRulesResult } from "./applyRules";

/** ---------- ORBIT-facing shapes (adapter output) ---------- */

export const AxisInit = z.object({
  axis: z.string().min(1),
  value: z.number().min(-1).max(1),
  reason: z.string().min(1),
});

export const HardConstraint = z.object({
  name: z.string().min(1),
  reason: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

export const SoftBarrier = z.object({
  name: z.string().min(1),
  g: z.number().positive(),
  beta: z.number().positive(),
  reason: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

export const CompileOutputV01 = z.object({
  version: z.literal("adapter.v0.1"),
  meta: z.object({
    docHash: z.string().min(1),
  }),
  axesInit: z.array(AxisInit).default([]),
  constraints: z.object({
    hard: z.array(HardConstraint).default([]),
    soft: z.array(SoftBarrier).default([]),
  }),
  openQuestions: z.array(
    z.object({
      id: z.string().min(1),
      question: z.string().min(1),
      target: z.enum(["USER", "UPSTREAM_SYSTEM"]),
    })
  ).default([]),
  qualitySignals: z.array(
    z.object({
      id: z.string().min(1),
      signal: z.string().min(1),
      reason: z.string().min(1),
    })
  ).default([]),
  evidenceLinks: z.any().optional(), // Í∑∏Î?Î°??ÑÎã¨(?úÏ??Ä IR???¥Î? ?àÏùå)
});

export type CompileOutputV01 = z.infer<typeof CompileOutputV01>;

/** ---------- Compile ---------- */

export function compileToOrbitV01(args: {
  ir: IrV01;
  applied: z.infer<typeof AppliedRulesResult>;
}): CompileOutputV01 {
  const { ir, applied } = args;

  const axesInit = applied.axesInit.map((a) => ({
    axis: a.axis,
    value: a.value,
    reason: a.reason,
  }));

  const hard = applied.hardBlocks.map((h) => ({
    name: h.constraintName,
    reason: h.reason,
    severity: h.severity,
  }));

  const soft = applied.softBarriers.map((s) => ({
    name: s.barrierName,
    g: s.g,
    beta: s.beta,
    reason: s.reason,
    severity: s.severity,
  }));

  const out: CompileOutputV01 = {
    version: "adapter.v0.1",
    meta: { docHash: ir.meta.docHash },
    axesInit,
    constraints: { hard, soft },
    openQuestions: applied.openQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      target: q.target,
    })),
    qualitySignals: applied.qualitySignals.map((q) => ({
      id: q.id,
      signal: q.signal,
      reason: q.reason,
    })),
    evidenceLinks: ir.evidenceLinks,
  };

  return CompileOutputV01.parse(out);
}
