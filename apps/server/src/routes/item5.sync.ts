import { Item5RequestSchema } from "../../../../packages/orbit-items/item5/schema.request";
import { Item5ResponseSchema } from "../../../../packages/orbit-items/item5/schema.response";
import { runItem5 } from "../../../../packages/orbit-items/item5/logic";

/**
 * Item5 Sync Runner (framework-agnostic)
 * - input: unknown (req.body.payload | req.body.input | req.body)
 * - output: validated Item5Response
 * - throws on validation error
 */
export function runItem5Sync(raw: unknown) {
  const parsedReq = Item5RequestSchema.parse(raw);
  const out = runItem5(parsedReq);
  return Item5ResponseSchema.parse(out);
}
