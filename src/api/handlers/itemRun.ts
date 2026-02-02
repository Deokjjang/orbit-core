// src/api/handlers/itemRun.ts

import {
  ErrorEnvelope,
  RequestEnvelopeSchema,
  ResponseEnvelope,
  SuccessEnvelope,
  RequestEnvelope,
} from "../envelope";
import { err } from "../errors";

import type { PresetId } from "../../core/presets";
import { assertPresetId } from "../../core/presets";

import { runItem1 } from "../../items/item1/run";
import { runItem2 } from "../../items/item2/run";
import { runItem4 } from "../../items/item4/run";

import {
  Item1ResponseSchema,
  Item2ResponseSchema,
  Item4ResponseSchema,
} from "../../items/schemas";

type SupportedItemId = "item1" | "item2" | "item4";

/**
 * ??Step 15 ë¸Œë¦¿ì§€ ?€??(runItemXê°€ ?”êµ¬?˜ëŠ” ìµœì†Œ shape)
 * - preset?€ PresetIdë¡?ì¢í????„ë‹¬
 */
export type ItemRequestBase = Readonly<{
  requestId: string;
  itemId: SupportedItemId;
  preset: PresetId;
  seed: number;
  init: unknown;
  constraints: unknown;
  input?: unknown;
}>;

type Runner = (req: ItemRequestBase) => Promise<unknown> | unknown;

export type RunItemDeps = {
  rateLimiter?: (req: ItemRequestBase) => boolean;
  runners?: Partial<Record<SupportedItemId, Runner>>;
  skipResponseValidation?: boolean;
};

function ok(
  requestId: string,
  itemId: SupportedItemId,
  data: unknown
): SuccessEnvelope {
  return { requestId, itemId, ok: true, data };
}

function fail(
  requestId: string | undefined,
  itemId: SupportedItemId | undefined,
  code:
    | "BAD_REQUEST"
    | "VALIDATION_ERROR"
    | "IDEMPOTENCY_CONFLICT"
    | "RATE_LIMITED"
    | "INTERNAL"
    | "ITEM_NOT_SUPPORTED",
  message: string,
  details?: unknown
): ErrorEnvelope {
  return { requestId, itemId, ok: false, error: err(code as any, message, details) };
}

function getResponseSchema(itemId: SupportedItemId) {
  switch (itemId) {
    case "item1":
      return Item1ResponseSchema;
    case "item2":
      return Item2ResponseSchema;
    case "item4":
      return Item4ResponseSchema;
  }
}

function isSupportedItemId(x: unknown): x is SupportedItemId {
  return x === "item1" || x === "item2" || x === "item4";
}

function toItemRequestBase(req: RequestEnvelope): ItemRequestBase {
  // preset: string -> PresetId
  assertPresetId(req.preset);
  const preset: PresetId = req.preset;

  return Object.freeze({
    requestId: req.requestId,
    itemId: req.itemId as SupportedItemId,
    preset,
    seed: req.seed,
    init: req.init,
    constraints: req.constraints,
    input: req.input,
  });
}

export async function runItemEndpoint(
  payload: unknown,
  deps: RunItemDeps = {}
): Promise<ResponseEnvelope> {
  if (payload === null || typeof payload !== "object") {
    return fail(undefined, undefined, "BAD_REQUEST", "Payload must be a JSON object.");
  }

  const parsed = RequestEnvelopeSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(
      undefined,
      undefined,
      "VALIDATION_ERROR",
      "Request schema validation failed.",
      parsed.error.flatten()
    );
  }

  const req0 = parsed.data;

  if (!isSupportedItemId(req0.itemId)) {
    return fail(req0.requestId, undefined, "ITEM_NOT_SUPPORTED", "Unsupported itemId.", { itemId: req0.itemId });
  }

  let req: ItemRequestBase;
  try {
    req = toItemRequestBase(req0);
  } catch {
    return fail(req0.requestId, req0.itemId, "VALIDATION_ERROR", "Invalid preset.", { preset: req0.preset });
  }

  if (deps.rateLimiter && deps.rateLimiter(req) === false) {
    return fail(req.requestId, req.itemId, "RATE_LIMITED", "Rate limited.");
  }

  // ???¬ê¸°??ìºìŠ¤?…ì´ ?„ìš”?? runItemX??repo ?´ë???ItemRequestBase ?€?…ì„ ?°ê³ ,
  // ?°ë¦¬??Step 15 ë¸Œë¦¿ì§€ ?€?…ì„ ?°ê¸° ?Œë¬¸(êµ¬ì¡° ?™ì¼). ?˜ë? ì¶”ê? ?†ìŒ.
  const runners: Record<SupportedItemId, Runner> = {
    item1: deps.runners?.item1 ?? ((runItem1 as unknown) as Runner),
    item2: deps.runners?.item2 ?? ((runItem2 as unknown) as Runner),
    item4: deps.runners?.item4 ?? ((runItem4 as unknown) as Runner),
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

    // bypassë©?raw ê·¸ë?ë¡?dataë¡?ê°ì‹¸??ok
    return ok(req.requestId, req.itemId, raw);

  } catch (e: unknown) {
    return fail(req.requestId, req.itemId, "INTERNAL", "Internal failure.", {
      name: e instanceof Error ? e.name : "UnknownError",
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
