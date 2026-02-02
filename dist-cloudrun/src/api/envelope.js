import { z } from "zod";
/**
 * NOTE
 * - init/constraints는 "운반"만 한다 (의미 추가 금지).
 * - item별 추가 입력은 input에 들어간다.
 * - itemId는 화이트리스트(지원 아이템만).
 */
export const ItemIdSchema = z.enum(["item1", "item2", "item4"]);
// preset은 core/presets.ts의 PresetId를 import해서 쓰는 게 정석.
// 여기서는 의존 분리 위해 string으로 받고, 핸들러에서 assertPreset로 강제한다.
export const PresetIdSchema = z.string().min(1);
export const RequestIdSchema = z.string().min(1);
export const RequestEnvelopeSchema = z.object({
    requestId: RequestIdSchema,
    itemId: ItemIdSchema,
    preset: PresetIdSchema,
    seed: z.number().int(),
    init: z.unknown(),
    constraints: z.unknown(),
    input: z.unknown().optional(), // item별 추가 필드(예: item4 prevLabel)
});
/** Success envelope */
export const SuccessEnvelopeSchema = z.object({
    requestId: RequestIdSchema,
    itemId: ItemIdSchema,
    ok: z.literal(true),
    data: z.unknown(), // itemRun handler에서 ItemXResponseSchema로 2차 검증
});
/** Error envelope (requestId/itemId는 실패 케이스에서 optional 허용) */
export const ApiErrorSchema = z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional(),
});
export const ErrorEnvelopeSchema = z.object({
    requestId: RequestIdSchema.optional(),
    itemId: ItemIdSchema.optional(),
    ok: z.literal(false),
    error: ApiErrorSchema,
});
