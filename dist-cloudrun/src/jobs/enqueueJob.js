// src/jobs/enqueueJob.ts
function stableHash(obj) {
    // 간단·?�정 ?�시 (?�서 무�?)
    return JSON.stringify(obj, Object.keys(obj).sort());
}
export async function enqueueJob(store, input, now = new Date()) {
    const payloadSig = stableHash({
        requestId: input.requestId,
        itemId: input.itemId,
        preset: input.preset,
        seed: input.seed,
        init: input.init,
        constraints: input.constraints,
        input: input.input,
    });
    if (input.idempotencyKey) {
        const existing = await store.findByIdempotencyKey(input.idempotencyKey);
        if (existing) {
            const existingSig = stableHash({
                requestId: existing.requestId,
                itemId: existing.itemId,
                preset: existing.preset,
                seed: existing.envelope.seed,
                init: existing.envelope.init,
                constraints: existing.envelope.constraints,
                input: existing.envelope.input,
            });
            if (existingSig !== payloadSig) {
                const err = new Error("IDEMPOTENCY_CONFLICT");
                err.code = 409;
                throw err; // API ?�이?�에??409�?변??
            }
            return { jobId: existing.jobId, reused: true };
        }
    }
    const iso = now.toISOString();
    const jobId = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const job = {
        jobId,
        requestId: input.requestId,
        itemId: input.itemId,
        preset: input.preset,
        status: "QUEUED",
        envelope: {
            seed: input.seed,
            init: input.init,
            constraints: input.constraints,
            input: input.input,
        },
        idempotencyKey: input.idempotencyKey,
        createdAt: iso,
        updatedAt: iso,
        attempts: 0,
        maxAttempts: 2,
    };
    await store.createJob(job);
    return { jobId, reused: false };
}
