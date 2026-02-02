// src/api/getJobStatus.ts

import { JobStore } from "../jobs/jobStoreTypes";
const RESULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type HttpLikeReq = {
  params?: { jobId?: string };
};

type HttpLikeRes = {
  status: (code: number) => HttpLikeRes;
  json: (body: any) => void;
};

export function getJobStatusHandler(store: JobStore) {
  return async (req: HttpLikeReq, res: HttpLikeRes) => {
    const jobId = req.params?.jobId;
    if (!jobId) {
      return res.status(400).json({ ok: false, error: { code: 400, message: "BAD_REQUEST" } });
    }

    const job = await store.getJob(jobId);
    if (!job) {
      return res.status(404).json({ ok: false, error: { code: 404, message: "NOT_FOUND" } });
    }
    // TTL check for terminal states
if (
  (job.status === "SUCCEEDED" || job.status === "FAILED" || job.status === "CANCELED") &&
  job.finishedAt
) {
  const expired =
    Date.now() - new Date(job.finishedAt).getTime() > RESULT_TTL_MS;

  if (expired) {
    return res.status(410).json({
      ok: false,
      error: { code: 410, message: "GONE" },
    });
  }
}

    // non-terminal
    if (job.status === "QUEUED" || job.status === "RUNNING") {
      return res.json({
        ok: true,
        jobId,
        status: job.status,
      });
    }

    // terminal ??Step15 envelope only
    if (job.status === "SUCCEEDED" && job.result?.okEnvelope) {
      return res.json({
        ok: true,
        jobId,
        status: "SUCCEEDED",
        response: job.result.okEnvelope,
      });
    }

    if ((job.status === "FAILED" || job.status === "CANCELED") && job.result?.errEnvelope) {
      return res.json({
        ok: true,
        jobId,
        status: job.status,
        response: job.result.errEnvelope,
      });
    }

    // fallback (should not happen)
    return res.status(503).json({
      ok: false,
      error: { code: 503, message: "INTERNAL" },
    });
  };
}
