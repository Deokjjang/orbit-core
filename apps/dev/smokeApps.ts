// apps/dev/smokeApps.ts

import { createServerApp } from "../server/src/main";
import { createWorkerApp } from "../worker/src/main";

// dummy sync runner
const runSync = async (_req: any, res: any) => {
  res.status(200).json({ ok: true, mode: "sync" });
};

// dummy worker runner
const runner = async (job: any) => {
  return { ok: true, echo: job.itemId };
};

async function main() {
  const server = createServerApp(runSync);
  createWorkerApp(runner);

  // call async handler directly (HttpLike)
  const req = {
    query: { mode: "async" },
    headers: { "idempotency-key": "k1" },
    body: {
      requestId: "req-1",
      itemId: "item1",
      preset: "FREE",
      seed: 1,
      init: {},
      constraints: {},
    },
  };

  const res = {
    _status: 200,
    status(code: number) {
      this._status = code;
      return this;
    },
    json(body: any) {
      console.log("status", this._status, "body", body);
      (globalThis as any).__last = body;
    },
  };

  await server.runItem(req as any, res as any);

  // poll result
  const jobId = (globalThis as any).__last?.job?.jobId;
  if (!jobId) throw new Error("no jobId");

  const pollReq = { params: { jobId } };
  await new Promise(r => setTimeout(r, 1000));
  await server.getJob(pollReq as any, res as any);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
