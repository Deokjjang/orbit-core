export type JobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED";

export type OrbitJob = {
  jobId: string;

  requestId: string;
  itemId: "item1" | "item2" | "item4";
  preset: "FREE" | "PLUS" | "PRO" | "ENTERPRISE_ANALYTICAL";

  status: JobStatus;

  envelope: {
    seed: number;
    init: unknown;
    constraints: unknown;
    input?: unknown;
  };

  idempotencyKey?: string;

  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;

  result?: {
    okEnvelope?: any;
    errEnvelope?: any;
  };

  attempts: number;
  maxAttempts: number; // v0.1 = 2
  leaseUntil?: string; // ISO
};

export type LeaseOpts = {
  now: Date;
  leaseMs: number; // e.g. 60_000
};

export type JobStore = {
  createJob(job: OrbitJob): Promise<void>;
  getJob(jobId: string): Promise<OrbitJob | null>;

  findByIdempotencyKey(key: string): Promise<OrbitJob | null>;

  leaseNextQueuedJob(opts: LeaseOpts): Promise<OrbitJob | null>;

  markSucceeded(jobId: string, okEnvelope: any, now: Date): Promise<void>;
  markFailed(jobId: string, errEnvelope: any, now: Date): Promise<void>;

  cancelJob(jobId: string, now: Date): Promise<OrbitJob | null>;
};
