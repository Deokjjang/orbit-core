import { execItem3 } from "./items/item3";
import { execItem5 } from "./items/item5";
import { execItem6 } from "./items/item6";
import { execItem10 } from "./items/item10";
import { execItem8 } from "./items/item8";
import { execItem7 } from "./items/item7";
import { execItem9 } from "./items/item9";
import { execChain } from "./chain/execChain";

export async function dispatchJob(job: { itemId: string; payload: unknown }) {
  switch (job.itemId) {
    case "item3":
      return execItem3(job.payload);
    case "item5":
      return execItem5(job.payload);
    case "item6_pre":
    case "item6_post":
      return execItem6(job.payload);
    case "item10":
      return execItem10(job.payload);
    case "item8" :
      return execItem8(job.payload);
    case "item7":
      return execItem7(job.payload);
    case "item9":
      return execItem9(job.payload);
    case "chain": {
  const payload = job.payload as {
    input: any;
    options: any;
  };
  return execChain(payload.input, payload.options);
}


    default:
      throw new Error(`Unknown itemId: ${job.itemId}`);
  }
}
