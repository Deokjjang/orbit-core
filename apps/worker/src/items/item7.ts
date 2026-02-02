import { runItem7, Item7RequestSchema, Item7ResultSchema } from "../../../../packages/orbit-items/item7";

/**
 * Worker Adapter — Item 7
 * - validates input/output
 * - pure compute (no side effects)
 */
export async function execItem7(raw: unknown) {
  const req = Item7RequestSchema.parse(raw);
  const out = runItem7(req);
  return Item7ResultSchema.parse(out);
}
