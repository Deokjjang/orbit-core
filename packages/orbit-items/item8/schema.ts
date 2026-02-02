import { z } from "zod";

/* ============================================================
 * Item8 — Time & Revisit Scheduler (Schema v0.1)
 * ============================================================ */

export const Item8RequestSchema = z.object({
  requestId: z.string().min(1),

  signals: z
    .array(
      z
        .object({
          code: z.string().min(1),
          severity: z.enum(["LOW", "MED", "HIGH"]).optional(),
        })
        .strict()
    )
    .optional(),

  meta: z
    .object({
      stakes: z.enum(["low", "high"]).optional(),
      audience: z.enum(["general", "expert", "enterprise"]).optional(),
      exposure: z.enum(["minimal", "analytical"]).optional(),
    })
    .strict()
    .optional(),
});

export type Item8Request = z.infer<typeof Item8RequestSchema>;

export const Item8TimingSchema = z.enum(["NOW", "LATER", "NEVER"]);
export type Item8Timing = z.infer<typeof Item8TimingSchema>;

export const Item8ResultSchema = z.object({
  timing: Item8TimingSchema,
  revisitAt: z.string().min(1).optional(), // ISO string; kept loose
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
});

export type Item8Result = z.infer<typeof Item8ResultSchema>;
