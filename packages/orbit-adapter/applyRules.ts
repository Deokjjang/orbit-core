// packages/orbit-adapter/applyRules.ts
//
// applyRules v0.1 ??SSOT
// Î™©Ï†Å: RulePackSet + IR -> ?úÍ∑úÏπ??®Í≥º ÏßëÌï©?ùÏúºÎ°??âÍ?(?ÑÏßÅ ORBIT compile ?ÑÎãò)
// ?µÏã¨: RuleEffect union?Ä Î∞òÎìú??effect.type?ºÎ°ú narrowing ???ÑÎìú ?ëÍ∑º.
//
// ?§Ïùå ?åÏùº(??: packages/orbit-adapter/compileToOrbit.ts

import { z } from "zod";
import type { IrV01 } from "./ir.schema";
import {
  RuleAtom,
  RuleEffect,
  HardBlockEffect,
  SoftBarrierEffect,
  AxisInitEffect,
  OpenQuestionEffect,
  QualitySignalEffect,
} from "./ruleAtom";
import { RulePackSet, type ConflictPolicy } from "./rulePack";

/** ---------- Output shapes (compiler input) ---------- */

export const AppliedHardBlock = z.object({
  id: z.string().min(1),
  constraintName: z.string().min(1),
  reason: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  ruleId: z.string().min(1),
  packId: z.string().min(1),
});

export const AppliedSoftBarrier = z.object({
  id: z.string().min(1),
  barrierName: z.string().min(1),
  g: z.number().positive(),
  beta: z.number().positive(),
  reason: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  ruleId: z.string().min(1),
  packId: z.string().min(1),
});

export const AppliedAxisInit = z.object({
  id: z.string().min(1),
  axis: z.string().min(1),
  value: z.number().min(-1).max(1),
  reason: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  ruleId: z.string().min(1),
  packId: z.string().min(1),
  priority: z.number().int().min(0).max(100),
});

export const AppliedOpenQuestion = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  target: z.enum(["USER", "UPSTREAM_SYSTEM"]),
  reason: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  ruleId: z.string().min(1),
  packId: z.string().min(1),
});

export const AppliedQualitySignal = z.object({
  id: z.string().min(1),
  signal: z.enum([
    "MISSING_CLAUSE",
    "AMBIGUOUS_TEXT",
    "OCR_LOW_CONFIDENCE",
    "INCONSISTENT_TERMS",
    "UNSUPPORTED_FORMAT",
    "OTHER",
  ]),
  reason: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  ruleId: z.string().min(1),
  packId: z.string().min(1),
});

export const AppliedRulesResult = z.object({
  hardBlocks: z.array(AppliedHardBlock).default([]),
  softBarriers: z.array(AppliedSoftBarrier).default([]),
  axesInit: z.array(AppliedAxisInit).default([]),
  openQuestions: z.array(AppliedOpenQuestion).default([]),
  qualitySignals: z.array(AppliedQualitySignal).default([]),
});

export type AppliedRulesResult = z.infer<typeof AppliedRulesResult>;

/** ---------- Minimal predicate matcher (v0.1) ---------- */

function matchesWhen(when: Record<string, any> | undefined, _ir: IrV01): boolean {
  // v0.1: when???ÜÏúºÎ©???ÉÅ Îß§Ïπ≠. (?ïÍµê Îß§Ïπ≠?Ä v0.1 Î≤îÏúÑ Î∞?
  if (!when) return true;
  // TODO(v0.1+): ?πÏ†ï meta/locale/jurisdiction ???ïÎèÑÎß?Îß§Ïπ≠ Ï∂îÍ? Í∞Ä??
  return true;
}

/** ---------- Dedupe helpers ---------- */

function dedupeById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    if (seen.has(x.id)) continue;
    seen.add(x.id);
    out.push(x);
  }
  return out;
}

function dedupeByText<T extends { id: string; reason: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    const key = `${x.reason}`.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(x);
  }
  return out;
}

/** ---------- Merge rules per conflict policy ---------- */

function mergeSoftBarriers(
  policy: ConflictPolicy,
  items: z.infer<typeof AppliedSoftBarrier>[]
) {
  if (policy.softBarrierMerge === "SUM") return items;

  // MAX by barrierName: g/beta????Í∞??∞ÏÑ†(Î≥¥Ïàò??
  const map = new Map<string, z.infer<typeof AppliedSoftBarrier>>();
  for (const it of items) {
    const prev = map.get(it.barrierName);
    if (!prev) {
      map.set(it.barrierName, it);
      continue;
    }
    const pick =
      it.g > prev.g || (it.g === prev.g && it.beta >= prev.beta) ? it : prev;
    map.set(it.barrierName, pick);
  }
  return Array.from(map.values());
}

function mergeAxisInit(policy: ConflictPolicy, items: z.infer<typeof AppliedAxisInit>[]) {
  if (items.length === 0) return items;

  const map = new Map<string, z.infer<typeof AppliedAxisInit>>();
  for (const it of items) {
    const prev = map.get(it.axis);
    if (!prev) {
      map.set(it.axis, it);
      continue;
    }
    if (policy.axisInitMerge === "LAST_WINS") {
      map.set(it.axis, it);
      continue;
    }
    // PRIORITY_WINS
    const pick = it.priority >= prev.priority ? it : prev;
    map.set(it.axis, pick);
  }
  return Array.from(map.values());
}

/** ---------- Core: apply ---------- */

export function applyRulesV01(args: {
  ir: IrV01;
  rulePackSet: RulePackSet;
}): AppliedRulesResult {
  const ir = args.ir;
  const set = RulePackSet.parse(args.rulePackSet);

  const hardBlocks: z.infer<typeof AppliedHardBlock>[] = [];
  const softBarriers: z.infer<typeof AppliedSoftBarrier>[] = [];
  const axesInit: z.infer<typeof AppliedAxisInit>[] = [];
  const openQuestions: z.infer<typeof AppliedOpenQuestion>[] = [];
  const qualitySignals: z.infer<typeof AppliedQualitySignal>[] = [];

  for (const pack of set.packs) {
    const policy = pack.conflictPolicy;

    for (const atom of pack.atoms) {
      if (!matchesWhen(atom.when, ir)) continue;

      for (const effect of atom.effects) {
        // ???¨Í∏∞?úÎ??∞Í? ?µÏã¨: Î∞òÎìú??type?ºÎ°ú narrowing
        switch (effect.type) {
          case "HARD_BLOCK": {
            const e: HardBlockEffect = effect;
            hardBlocks.push(
              AppliedHardBlock.parse({
                id: e.id,
                constraintName: e.constraintName,
                reason: e.reason,
                severity: e.severity,
                ruleId: atom.id,
                packId: pack.meta.id,
              })
            );
            break;
          }
          case "SOFT_BARRIER": {
            const e: SoftBarrierEffect = effect;
            softBarriers.push(
              AppliedSoftBarrier.parse({
                id: e.id,
                barrierName: e.barrierName,
                g: e.g,
                beta: e.beta,
                reason: e.reason,
                severity: e.severity,
                ruleId: atom.id,
                packId: pack.meta.id,
              })
            );
            break;
          }
          case "AXIS_INIT": {
            const e: AxisInitEffect = effect;
            axesInit.push(
              AppliedAxisInit.parse({
                id: e.id,
                axis: e.axis,
                value: e.value,
                reason: e.reason,
                severity: e.severity,
                ruleId: atom.id,
                packId: pack.meta.id,
                priority: atom.priority ?? 50,
              })
            );
            break;
          }
          case "OPEN_QUESTION": {
            const e: OpenQuestionEffect = effect;
            openQuestions.push(
              AppliedOpenQuestion.parse({
                id: e.id,
                question: e.question,
                target: e.target ?? "USER",
                reason: e.reason,
                severity: e.severity,
                ruleId: atom.id,
                packId: pack.meta.id,
              })
            );
            break;
          }
          case "QUALITY_SIGNAL": {
            const e: QualitySignalEffect = effect;
            qualitySignals.push(
              AppliedQualitySignal.parse({
                id: e.id,
                signal: e.signal,
                reason: e.reason,
                severity: e.severity,
                ruleId: atom.id,
                packId: pack.meta.id,
              })
            );
            break;
          }
          default: {
            // exhaustive check
            const _never: never = effect;
            void _never;
          }
        }
      }

      // HARD_BLOCK ?∞ÏÑ† ?ïÏ±Ö?¥Î©¥: atom ?òÏ??êÏÑú ?òÎÇò?ºÎèÑ ?òÏò§Î©??òÎ®∏ÏßÄ ?®Í≥º???úÌèâÍ∞Ä ?Ñ‚ÄùÏó¨??Î¨¥Î∞©
      // v0.1?Ä ?®Ïàú?? ?ÑÏ≤¥ ?âÍ? ??merge?êÏÑú HARD ?∞ÏÑ†Îß?Î≥¥Ïû•
      void policy;
    }
  }

  // dedupe/merge ?ÅÏö©
  const result: AppliedRulesResult = {
    hardBlocks:
      set.packs[0].conflictPolicy.dedupeBy === "TEXT"
        ? (dedupeByText(hardBlocks as any) as any)
        : dedupeById(hardBlocks),
    softBarriers: mergeSoftBarriers(
      set.packs[0].conflictPolicy,
      set.packs[0].conflictPolicy.dedupeBy === "TEXT"
        ? (dedupeByText(softBarriers as any) as any)
        : dedupeById(softBarriers)
    ),
    axesInit: mergeAxisInit(
      set.packs[0].conflictPolicy,
      set.packs[0].conflictPolicy.dedupeBy === "TEXT"
        ? (dedupeByText(axesInit as any) as any)
        : dedupeById(axesInit)
    ),
    openQuestions:
      set.packs[0].conflictPolicy.dedupeBy === "TEXT"
        ? (dedupeByText(openQuestions as any) as any)
        : dedupeById(openQuestions),
    qualitySignals:
      set.packs[0].conflictPolicy.dedupeBy === "TEXT"
        ? (dedupeByText(qualitySignals as any) as any)
        : dedupeById(qualitySignals),
  };

  return AppliedRulesResult.parse(result);
}
