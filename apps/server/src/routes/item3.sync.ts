import { Item3RequestSchema } from "../../../../packages/orbit-items/item3/schema.request";
import { Item3ResponseSchema } from "../../../../packages/orbit-items/item3/schema.response";
import { runItem3 } from "../../../../packages/orbit-items/item3/logic";

/**
 * Item3 Sync Runner (framework-agnostic)
 * - input: unknown (req.body)
 * - output: validated Item3Response
 * - throws on validation error
 */
export function runItem3Sync(raw: unknown) {
  const parsedReq = Item3RequestSchema.parse(raw);
  const out = runItem3(parsedReq);
  return Item3ResponseSchema.parse(out);
}
