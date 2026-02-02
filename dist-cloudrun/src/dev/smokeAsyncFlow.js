// src/dev/smokeAsyncFlow.ts
import { MemoryJobStore } from "../jobs/memoryJobStore";
import { enqueueJob } from "../jobs/enqueueJob";
import { startWorkerLoop } from "../jobs/workerLoop";
async function main() {
    const store = new MemoryJobStore();
    // dummy runner (??�� ?�공)
    startWorkerLoop({
        store,
        runner: async (job) => {
            return { ok: true, echo: job.itemId };
        },
        intervalMs: 100,
    });
    const { jobId } = await enqueueJob(store, {
        requestId: "req-1",
        itemId: "item1",
        preset: "FREE",
        seed: 1,
        init: {},
        constraints: {},
    });
    console.log("enqueued:", jobId);
    // poll
    const timer = setInterval(async () => {
        const job = await store.getJob(jobId);
        if (!job)
            return;
        console.log("status:", job.status);
        if (job.status === "SUCCEEDED" || job.status === "FAILED") {
            console.log("result:", job.result);
            clearInterval(timer);
        }
    }, 200);
}
main();
