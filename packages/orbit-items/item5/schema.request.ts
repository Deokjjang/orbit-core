import { z } from "zod";

/**
 * Item 5 — Anti-Hallucination Filter
 * Request Schema v0.1 (FREEZE)
 *
 * Notes:
 * - candidate output is treated as opaque text by default
 * - optional structured claims can be provided by upstream adapter
 * - uncertainty can be a thin subset of Item3 output (tiers + questions)
 */

export const TierSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const Item3ThinUncertaintySchema = z.object({
  overallTier: TierSchema,
  questions: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
      })
    )
    .optional(),
  signals: z
    .array(
      z.object({
        name: z.string(),
        severity: TierSchema,
      })
    )
    .optional(),
});

export const EvidenceLinkSchema = z.object({
  docHash: z.string(),
  sectionId: z.string(),
  span: z.object({
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
  }),
});

export const CandidateSchema = z.object({
  text: z.string().min(1),
  // Optional: upstream can pass extracted claims to help consistency checks.
  claims: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().min(1),
        // Optional evidence pointer referenced by the candidate itself (not validated here)
        evidenceRef: z.string().optional(),
      })
    )
    .optional(),
  // Optional: upstream may include the model name, version, etc. (signals only)
  meta: z
    .object({
      model: z.string().optional(),
      createdAt: z.string().optional(),
    })
    .optional(),
});

export const Item5RequestSchema = z.object({
  requestId: z.string(),
  candidate: CandidateSchema,
  evidenceLinks: z.array(EvidenceLinkSchema).optional(),
  uncertainty: Item3ThinUncertaintySchema.optional(),
  context: z
    .object({
      domain: z.string().optional(),
      audience: z.enum(["general", "expert", "enterprise"]).optional(),
      stakes: z.enum(["low", "high"]).optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export type Item5Request = z.infer<typeof Item5RequestSchema>;
