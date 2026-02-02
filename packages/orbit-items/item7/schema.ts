import { z } from "zod";

/* ============================================================
 * Item7 — Sense / Anomaly Detector (Schema v0.1)
 * ============================================================ */

export const Item7RequestSchema = z.object({
  requestId: z.string().min(1),

  observations: z
    .array(
      z
        .object({
          t: z.number(),
          state: z
            .object({
              u: z.number().optional(),
              r: z.number().optional(),
              i: z.number().optional(),
              v: z.number().optional(),
            })
            .strict(),
        })
        .strict()
    )
    .min(1),

  meta: z
    .object({
      window: z.number().int().min(2).optional(),
    })
    .strict()
    .optional(),
});

export type Item7Request = z.infer<typeof Item7RequestSchema>;

export const Item7SignalCodeSchema = z.enum([
  "drift_detected",
  "spike_detected",
  "oscillation_detected",
  "stable",
]);

export type Item7SignalCode = z.infer<typeof Item7SignalCodeSchema>;

export const Item7ResultSchema = z.object({
  signals: z
    .array(
      z
        .object({
          code: Item7SignalCodeSchema,
          severity: z.enum(["LOW", "MED", "HIGH"]),
          note: z.string().min(1).optional(),
        })
        .strict()
    )
    .default([]),
});

export type Item7Result = z.infer<typeof Item7ResultSchema>;
