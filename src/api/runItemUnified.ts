// src/api/runItemUnified.ts

import { JobStore } from "../jobs/jobStoreTypes";
import { runItemAsyncHandler } from "./runItemAsync";

// Step 15?êÏÑú ?¥Î? ?àÎäî sync handlerÎ•?import
// import { runItemEndpoint } from "./runItemSync"; // ??Í∏∞Ï°¥ Í≤?

type HttpLikeReq = {
  body: any;
  query?: { mode?: string };
  headers?: Record<string, string | undefined>;
};

type HttpLikeRes = {
  status: (code: number) => HttpLikeRes;
  json: (body: any) => void;
};

export function runItemUnifiedHandler(deps: {
  store: JobStore;
  runSync: (req: any, res: any) => Promise<void>;
}) {
  const asyncHandler = runItemAsyncHandler(deps.store);

  return async (req: HttpLikeReq, res: HttpLikeRes) => {
    const mode = req.query?.mode;

    if (mode === "async") {
      return asyncHandler(req, res);
    }

    // default = sync (Step 15)
    return deps.runSync(req, res);
  };
}
