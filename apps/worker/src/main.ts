// apps/worker/src/main.ts

import { createJobStore } from "../../../src/jobs/jobStoreFactory";
import { startWorkerLoop } from "../../../src/jobs/workerLoop";

export function createWorkerApp(runner: any) {
  const jobStore = createJobStore();

  startWorkerLoop({
    store: jobStore,
    runner,
  });
}
