import { z } from "zod";
/* ============================================================
 * Item9 — Human-in-the-Loop Optimizer (Schema v0.1)
 * ============================================================ */
export const Item9FeedbackSchema = z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    tags: z.array(z.string().min(1)).optional(),
});
export const Item9RequestSchema = z.object({
    requestId: z.string().min(1),
    feedbacks: z.array(Item9FeedbackSchema).min(1),
    meta: z
        .object({
        audience: z.enum(["general", "expert", "enterprise"]).optional(),
        exposure: z.enum(["minimal", "analytical"]).optional(),
    })
        .strict()
        .optional(),
});
export const Item9ClusterSchema = z.object({
    clusterId: z.string().min(1),
    label: z.string().min(1),
    members: z.array(z.string().min(1)).min(1),
});
export const Item9ResultSchema = z.object({
    acceptedEdits: z.array(Item9ClusterSchema).default([]),
    openIssues: z.array(Item9ClusterSchema).default([]),
    signals: z
        .array(z
        .object({
        code: z.string().min(1),
        severity: z.enum(["LOW", "MED", "HIGH"]),
        note: z.string().min(1).optional(),
    })
        .strict())
        .default([]),
});
