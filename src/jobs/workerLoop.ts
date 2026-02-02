// src/jobs/workerLoop.ts

import { workerRunOnce } from "./workerRunOnce";
import { JobStore } from "./jobStoreTypes";

export async function startWorkerLoop(opts: {
  store: JobStore;
  runner: (job: any) => Promise<any>;
  intervalMs?: number;
}) {
  const intervalMs = opts.intervalMs ?? 500;

  setInterval(async () => {
    await workerRunOnce({
      store: opts.store,
      runner: opts.runner,
    });
  }, intervalMs);
}
