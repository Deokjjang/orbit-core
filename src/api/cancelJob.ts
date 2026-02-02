// src/api/cancelJob.ts

import { JobStore } from "../jobs/jobStoreTypes";

type HttpLikeReq = {
  params?: { jobId?: string };
};

type HttpLikeRes = {
  status: (code: number) => HttpLikeRes;
  json: (body: any) => void;
};

export function cancelJobHandler(store: JobStore) {
  return async (req: HttpLikeReq, res: HttpLikeRes) => {
    const jobId = req.params?.jobId;
    if (!jobId) {
      return res.status(400).json({ ok: false, error: { code: 400, message: "BAD_REQUEST" } });
    }

    const job = await store.cancelJob(jobId, new Date());
    if (!job) {
      return res.status(404).json({ ok: false, error: { code: 404, message: "NOT_FOUND" } });
    }

    return res.json({
      ok: true,
      jobId,
      status: job.status,
      response: {
        ok: false,
        error: { code: 409, message: "CANCELED" },
      },
    });
  };
}
