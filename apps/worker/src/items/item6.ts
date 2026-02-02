import { runItem6, Item6RequestSchema, Item6ResponseSchema } from "../../../../packages/orbit-items/item6";

/**
 * Worker Adapter — Item 6
 * - validates input/output
 * - pure compute (no side effects)
 */

export async function execItem6(raw: unknown) {
  const patched =
  raw && typeof raw === "object"
    ? (() => {
        const o: any = { ...(raw as any) };
        // normalize chain step ids to canonical item id if present
        if (o.itemId === "item6_pre" || o.itemId === "item6_post") o.itemId = "item6";
        return o;
      })()
    : raw;

  const req = Item6RequestSchema.parse(patched);
  const out = runItem6(req);
  return Item6ResponseSchema.parse(out);
}
