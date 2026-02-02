// src/jobs/enqueueJob.ts

import { JobStore, OrbitJob } from "./jobStoreTypes";

function stableHash(obj: any): string {
  // Í∞ÑÎã®¬∑?àÏ†ï ?¥Ïãú (?úÏÑú Î¨¥Í?)
  return JSON.stringify(obj, Object.keys(obj).sort());
}

type EnqueueInput = {
  requestId: string;
  itemId: "item1" | "item2" | "item4";
  preset: "FREE" | "PLUS" | "PRO" | "ENTERPRISE_ANALYTICAL";
  seed: number;
  init: unknown;
  constraints: unknown;
  input?: unknown;
  idempotencyKey?: string;
};

export async function enqueueJob(
  store: JobStore,
  input: {
    requestId: string;
    itemId: "item1" | "item2" | "item4";
    preset: "FREE" | "PLUS" | "PRO" | "ENTERPRISE_ANALYTICAL";
    seed: number;
    init: unknown;
    constraints: unknown;
    input?: unknown;
    idempotencyKey?: string;
  },
  now: Date = new Date()
): Promise<{ jobId: string; reused: boolean }> {

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
        const err: any = new Error("IDEMPOTENCY_CONFLICT");
        err.code = 409;
        throw err; // API ?àÏù¥?¥Ïóê??409Î°?Î≥Ä??
      }

      return { jobId: existing.jobId, reused: true };
    }
  }

  const iso = now.toISOString();
  const jobId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  const job: OrbitJob = {
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