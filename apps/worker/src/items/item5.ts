import { runItem5, Item5RequestSchema, Item5ResponseSchema } from "../../../../packages/orbit-items/item5";

/**
 * Worker Adapter — Item 5
 * - validates input/output
 * - pure compute (no side effects)
 */
export async function execItem5(raw: unknown) {
  const req = Item5RequestSchema.parse(raw);
  const out = runItem5(req);
  return Item5ResponseSchema.parse(out);
}
