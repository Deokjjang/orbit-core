import { runItem3, Item3RequestSchema, Item3ResponseSchema }
  from "../../../../packages/orbit-items/item3";


/**
 * Worker Adapter — Item 3
 * - validates input/output
 * - no side effects beyond pure compute
 */
export async function execItem3(raw: unknown) {
  // 1) Validate input
  const req = Item3RequestSchema.parse(raw);

  // 2) Run (pure)
  const out = runItem3(req);

  // 3) Validate output (hard guarantee)
  return Item3ResponseSchema.parse(out);
}
