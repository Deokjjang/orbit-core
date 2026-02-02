// src/api/handlers/itemRun.ts
import { RequestEnvelopeSchema, } from "../envelope";
import { err } from "../errors";
import { assertPresetId } from "../../core/presets";
import { runItem1 } from "../../items/item1/run";
import { runItem2 } from "../../items/item2/run";
import { runItem4 } from "../../items/item4/run";
import { Item1ResponseSchema, Item2ResponseSchema, Item4ResponseSchema, } from "../../items/schemas";
function ok(requestId, itemId, data) {
    return { requestId, itemId, ok: true, data };
}
function fail(requestId, itemId, code, message, details) {
    return { requestId, itemId, ok: false, error: err(code, message, details) };
}
function getResponseSchema(itemId) {
    switch (itemId) {
        case "item1":
            return Item1ResponseSchema;
        case "item2":
            return Item2ResponseSchema;
        case "item4":
            return Item4ResponseSchema;
    }
}
function isSupportedItemId(x) {
    return x === "item1" || x === "item2" || x === "item4";
}
function toItemRequestBase(req) {
    // preset: string -> PresetId
    assertPresetId(req.preset);
    const preset = req.preset;
    return Object.freeze({
        requestId: req.requestId,
        itemId: req.itemId,
        preset,
        seed: req.seed,
        init: req.init,
        constraints: req.constraints,
        input: req.input,
    });
}
export async function runItemEndpoint(payload, deps = {}) {
    if (payload === null || typeof payload !== "object") {
        return fail(undefined, undefined, "BAD_REQUEST", "Payload must be a JSON object.");
    }
    const parsed = RequestEnvelopeSchema.safeParse(payload);
    if (!parsed.success) {
        return fail(undefined, undefined, "VALIDATION_ERROR", "Request schema validation failed.", parsed.error.flatten());
    }
    const req0 = parsed.data;
    if (!isSupportedItemId(req0.itemId)) {
        return fail(req0.requestId, undefined, "ITEM_NOT_SUPPORTED", "Unsupported itemId.", { itemId: req0.itemId });
    }
    let req;
    try {
        req = toItemRequestBase(req0);
    }
    catch {
        return fail(req0.requestId, req0.itemId, "VALIDATION_ERROR", "Invalid preset.", { preset: req0.preset });
    }
    if (deps.rateLimiter && deps.rateLimiter(req) === false) {
        return fail(req.requestId, req.itemId, "RATE_LIMITED", "Rate limited.");
    }
    // ???�기??캐스?�이 ?�요?? runItemX??repo ?��???ItemRequestBase ?�?�을 ?�고,
    // ?�리??Step 15 브릿지 ?�?�을 ?�기 ?�문(구조 ?�일). ?��? 추�? ?�음.
    const runners = {
        item1: deps.runners?.item1 ?? runItem1,
        item2: deps.runners?.item2 ?? runItem2,
        item4: deps.runners?.item4 ?? runItem4,
    };
    try {
        const raw = await runners[req.itemId](req);
        if (!deps.skipResponseValidation) {
            const schema = getResponseSchema(req.itemId);
            const v = schema.safeParse(raw);
            if (!v.success) {
                return fail(req.requestId, req.itemId, "INTERNAL", "Response schema validation failed.", v.error.flatten());
            }
            return ok(req.requestId, req.itemId, v.data);
        }
        // bypass�?raw 그�?�?data�?감싸??ok
        return ok(req.requestId, req.itemId, raw);
    }
    catch (e) {
        return fail(req.requestId, req.itemId, "INTERNAL", "Internal failure.", {
            name: e instanceof Error ? e.name : "UnknownError",
            message: e instanceof Error ? e.message : String(e),
        });
    }
}
