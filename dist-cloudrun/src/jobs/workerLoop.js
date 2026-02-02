// src/jobs/workerLoop.ts
import { workerRunOnce } from "./workerRunOnce";
export async function startWorkerLoop(opts) {
    const intervalMs = opts.intervalMs ?? 500;
    setInterval(async () => {
        await workerRunOnce({
            store: opts.store,
            runner: opts.runner,
        });
    }, intervalMs);
}
