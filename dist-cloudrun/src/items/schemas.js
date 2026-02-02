import { z } from 'zod';
export const ItemIdSchema = z.enum(['item1', 'item2', 'item4']);
export const MembersHintSchema = z.enum(['SMALL', 'MEDIUM', 'LARGE']);
export const Item1ResponseSchema = z.object({
    requestId: z.string(),
    itemId: z.literal('item1'),
    map: z.array(z.object({
        attractorId: z.string(),
        summary: z.object({
            topAxes: z.array(z.string()),
            riskDirection: z.enum(['UP', 'DOWN', 'FLAT']),
            uncertaintyDensity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        }),
        membersHint: MembersHintSchema,
    })),
    outcome: z.object({
        label: z.string(),
        scale: z.number().int(),
    }),
    traceKinds: z.array(z.string()),
});
export const RiskTierSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const Item2ResponseSchema = z.object({
    requestId: z.string(),
    itemId: z.literal('item2'),
    risk: z.array(z.object({
        attractorId: z.string(),
        tier: RiskTierSchema,
        direction: z.enum(['UP', 'DOWN', 'FLAT']),
    })),
});
export const HoldLabelSchema = z.enum(['PROCEED', 'HOLD', 'STOP']);
export const Item4ResponseSchema = z.object({
    requestId: z.string(),
    itemId: z.literal('item4'),
    label: HoldLabelSchema,
    basis: z.object({
        coreLabel: HoldLabelSchema,
        hysteresisApplied: z.boolean(),
    }),
});
