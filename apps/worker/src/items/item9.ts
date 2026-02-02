import { runItem9, Item9RequestSchema, Item9ResultSchema } from "../../../../packages/orbit-items/item9";

/**
 * Worker Adapter — Item 9
 * - validates input/output
 * - pure compute (no side effects)
 */
export async function execItem9(raw: unknown) {
  const req = Item9RequestSchema.parse(raw);
  const out = runItem9(req);
  return Item9ResultSchema.parse(out);
}
