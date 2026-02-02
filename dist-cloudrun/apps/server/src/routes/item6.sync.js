import { Item6RequestSchema } from "../../../../packages/orbit-items/item6/schema.request";
import { Item6ResponseSchema } from "../../../../packages/orbit-items/item6/schema.response";
import { runItem6 } from "../../../../packages/orbit-items/item6/logic";
/**
 * Item6 Sync Runner (framework-agnostic)
 * - input: unknown (req.body.payload | req.body.input | req.body)
 * - output: validated Item6Response
 * - throws on validation error
 */
export function runItem6Sync(raw) {
    const parsedReq = Item6RequestSchema.parse(raw);
    const out = runItem6(parsedReq);
    return Item6ResponseSchema.parse(out);
}
