import { JobStore, LeaseOpts, OrbitJob } from "./jobStoreTypes";

export class MemoryJobStore implements JobStore {
  private byId = new Map<string, OrbitJob>();
  private byIdem = new Map<string, string>(); // idemKey -> jobId

  async createJob(job: OrbitJob): Promise<void> {
    if (this.byId.has(job.jobId)) return;

    this.byId.set(job.jobId, structuredClone(job));
    if (job.idempotencyKey) this.byIdem.set(job.idempotencyKey, job.jobId);
  }

  async getJob(jobId: string): Promise<OrbitJob | null> {
    const j = this.byId.get(jobId);
    return j ? structuredClone(j) : null;
  }

  async findByIdempotencyKey(key: string): Promise<OrbitJob | null> {
    const jobId = this.byIdem.get(key);
    if (!jobId) return null;
    return this.getJob(jobId);
  }

  async leaseNextQueuedJob(opts: LeaseOpts): Promise<OrbitJob | null> {
    const nowIso = opts.now.toISOString();
    const leaseUntilIso = new Date(opts.now.getTime() + opts.leaseMs).toISOString();

    // deterministic order: earliest createdAt first
    const candidates = Array.from(this.byId.values())
      .filter(j => j.status === "QUEUED")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    for (const j of candidates) {
      // re-read current
      const cur = this.byId.get(j.jobId);
      if (!cur) continue;
      if (cur.status !== "QUEUED") continue;

      // lease it
      const next: OrbitJob = {
        ...cur,
        status: "RUNNING",
        attempts: cur.attempts + 1,
        startedAt: cur.startedAt ?? nowIso,
        updatedAt: nowIso,
        leaseUntil: leaseUntilIso,
      };

      this.byId.set(cur.jobId, next);
      return structuredClone(next);
    }

    return null;
  }

  async markSucceeded(jobId: string, okEnvelope: any, now: Date): Promise<void> {
    const cur = this.byId.get(jobId);
    if (!cur) return;
    if (cur.status === "SUCCEEDED" || cur.status === "FAILED" || cur.status === "CANCELED") return;

    const nowIso = now.toISOString();
    this.byId.set(jobId, {
      ...cur,
      status: "SUCCEEDED",
      updatedAt: nowIso,
      finishedAt: nowIso,
      leaseUntil: undefined,
      result: { okEnvelope },
    });
  }

  async markFailed(jobId: string, errEnvelope: any, now: Date): Promise<void> {
    const cur = this.byId.get(jobId);
    if (!cur) return;
    if (cur.status === "SUCCEEDED" || cur.status === "FAILED" || cur.status === "CANCELED") return;

    const nowIso = now.toISOString();
    this.byId.set(jobId, {
      ...cur,
      status: "FAILED",
      updatedAt: nowIso,
      finishedAt: nowIso,
      leaseUntil: undefined,
      result: { errEnvelope },
    });
  }

  async cancelJob(jobId: string, now: Date): Promise<OrbitJob | null> {
    const cur = this.byId.get(jobId);
    if (!cur) return null;

    // already terminal
    if (cur.status === "SUCCEEDED" || cur.status === "FAILED" || cur.status === "CANCELED") {
      return structuredClone(cur);
    }

    const nowIso = now.toISOString();
    const next: OrbitJob = {
      ...cur,
      status: "CANCELED",
      updatedAt: nowIso,
      finishedAt: nowIso,
      leaseUntil: undefined,
    };

    this.byId.set(jobId, next);
    return structuredClone(next);
  }
}
