// packages/orbit-adapter/rulePack.ts
//
// RulePack v0.1 ??SSOT

import { z } from "zod";
import { RuleAtom } from "./ruleAtom";

export const RulePackMeta = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  jurisdiction: z.string().min(1).optional(),
  domain: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).default([]),
});

export type RulePackMeta = z.infer<typeof RulePackMeta>;

export const ConflictPolicy = z.object({
  hardBlockWins: z.literal(true).default(true),
  softBarrierMerge: z.enum(["MAX", "SUM"]).default("MAX"),
  axisInitMerge: z.enum(["LAST_WINS", "PRIORITY_WINS"]).default("PRIORITY_WINS"),
  dedupeBy: z.enum(["ID", "TEXT"]).default("ID"),
});

export type ConflictPolicy = z.infer<typeof ConflictPolicy>;

const DEFAULT_CONFLICT_POLICY: ConflictPolicy = {
  hardBlockWins: true,
  softBarrierMerge: "MAX",
  axisInitMerge: "PRIORITY_WINS",
  dedupeBy: "ID",
};

export const RulePack = z.object({
  meta: RulePackMeta,
  atoms: z.array(RuleAtom).default([]),
  // ??{} ?€???œì™„?„í•œ default ê°ì²´???œê³µ (?ëŠ” default(() => DEFAULT_CONFLICT_POLICY))
  conflictPolicy: ConflictPolicy.default(DEFAULT_CONFLICT_POLICY),
});

export type RulePack = z.infer<typeof RulePack>;

export const RulePackSet = z.object({
  packs: z.array(RulePack).min(1),
});

export type RulePackSet = z.infer<typeof RulePackSet>;

/** ---------- Helpers ---------- */

export function parseRulePack(input: unknown): RulePack {
  return RulePack.parse(input);
}

export function safeParseRulePack(input: unknown) {
  return RulePack.safeParse(input);
}

export function parseRulePackSet(input: unknown): RulePackSet {
  return RulePackSet.parse(input);
}

export function safeParseRulePackSet(input: unknown) {
  return RulePackSet.safeParse(input);
}
