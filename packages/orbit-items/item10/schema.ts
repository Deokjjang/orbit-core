import { z } from "zod";

/* ============================================================
 * Item10 — Meta-Agent Governor (Schema v0.1)
 * ============================================================ */

export const Item10RequestSchema = z.object({
  requestId: z.string().min(1),

  meta: z
    .object({
      loop: z.number().int().min(0).optional(),
      slots: z.number().int().min(0).optional(),
      budget: z
        .object({
          credits: z.number().int().min(0).optional(),
        })
        .optional(),
      exposure: z.enum(["minimal", "analytical"]).optional(),
      audience: z.enum(["general", "expert", "enterprise"]).optional(),
      stakes: z.enum(["low", "high"]).optional(),
    })
    .strict(),

  workspace: z
  .object({
    id: z.string().min(1),
    plan: z.string().min(1).optional(),
  })
  .strict()
  .optional(),
});

export type Item10Request = z.infer<typeof Item10RequestSchema>;

export const Item10VerdictSchema = z.enum(["ALLOW", "HOLD", "BLOCK"]);
export type Item10Verdict = z.infer<typeof Item10VerdictSchema>;

export const Item10ResultSchema = z.object({
  verdict: Item10VerdictSchema,

  signals: z
    .array(
      z
        .object({
          code: z.string().min(1),
          severity: z.enum(["LOW", "MED", "HIGH"]),
          note: z.string().min(1).optional(),
        })
        .strict()
    )
    .default([]),

  limits: z
    .object({
      loopMax: z.number().int().min(0).optional(),
      slotsMax: z.number().int().min(0).optional(),
      creditsMax: z.number().int().min(0).optional(),
    })
    .strict(),
});

export type Item10Result = z.infer<typeof Item10ResultSchema>;
