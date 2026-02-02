import { runItem8, Item8RequestSchema, Item8ResultSchema } from "../../../../packages/orbit-items/item8";

/**
 * Worker Adapter — Item 8
 * - validates input/output
 * - pure compute (no side effects)
 */
export async function execItem8(raw: unknown) {
  const req = Item8RequestSchema.parse(raw);
  const out = runItem8(req);
  return Item8ResultSchema.parse(out);
}
