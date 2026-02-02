// src/api/runItemAsync.ts

import { enqueueJob } from "../jobs/enqueueJob";
import { JobStore } from "../jobs/jobStoreTypes";

type HttpLikeReq = {
  body: any;
  headers?: Record<string, string | undefined>;
};

type HttpLikeRes = {
  status: (code: number) => HttpLikeRes;
  json: (body: any) => void;
};

export function runItemAsyncHandler(store: JobStore) {
  return async (req: HttpLikeReq, res: HttpLikeRes) => {
    if (typeof req.body !== "object" || req.body === null) {
      return res.status(400).json({ ok: false, error: { code: 400, message: "BAD_REQUEST" } });
    }

    const {
      requestId,
      itemId,
      preset,
      seed,
      init,
      constraints,
      input,
    } = req.body;

    const idem = req.headers?.["idempotency-key"];

    try {
      const { jobId } = await enqueueJob(store, {
        requestId,
        itemId,
        preset,
        seed,
        init,
        constraints,
        input,
        idempotencyKey: idem,
      });

      return res.status(202).json({
        requestId,
        itemId,
        ok: true,
        accepted: true,
        job: {
          jobId,
          status: "QUEUED",
          createdAt: new Date().toISOString(),
          pollUrl: `/orbit/jobs/${jobId}`,
        },
      });
    } catch (e: any) {
      return res.status(503).json({
        ok: false,
        error: { code: 503, message: e?.message ?? "INTERNAL" },
      });
    }
  };
}
