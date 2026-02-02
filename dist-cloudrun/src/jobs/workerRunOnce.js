// src/jobs/workerRunOnce.ts
export async function workerRunOnce(deps, now = new Date()) {
    const { store, runner } = deps;
    const leaseMs = deps.leaseMs ?? 60000;
    // 1) lease next job
    const job = await store.leaseNextQueuedJob({ now, leaseMs });
    if (!job)
        return false;
    try {
        // 2) run
        const result = await runner({
            requestId: job.requestId,
            itemId: job.itemId,
            preset: job.preset,
            seed: job.envelope.seed,
            init: job.envelope.init,
            constraints: job.envelope.constraints,
            input: job.envelope.input,
        });
        // 3) success
        await store.markSucceeded(job.jobId, result, new Date());
    }
    catch (err) {
        // 4) failure
        await store.markFailed(job.jobId, {
            ok: false,
            error: {
                code: "503",
                message: err?.message ?? "INTERNAL",
            },
        }, new Date());
    }
    return true;
}
