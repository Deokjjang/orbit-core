import { runItem10, Item10RequestSchema, Item10ResultSchema } from "../../../../packages/orbit-items/item10";

/**
 * Worker Adapter — Item 10
 * - validates input/output
 * - pure compute (no side effects)
 */
export async function execItem10(raw: unknown) {
  const req = Item10RequestSchema.parse(raw);
  const out = runItem10(req);
  return Item10ResultSchema.parse(out);
}
