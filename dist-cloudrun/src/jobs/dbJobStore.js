// src/jobs/dbJobStore.ts
import { getFirestore } from "../../apps/shared/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
export class DbJobStore {
    constructor() {
        this.db = getFirestore();
        this.jobs = this.db.collection("jobs");
        this.idem = this.db.collection("job_idem"); // idempotencyKey -> jobId
    }
    // ---------- helpers ----------
    toFs(job) {
        return {
            ...job,
            createdAt: Timestamp.fromDate(new Date(job.createdAt)),
            updatedAt: Timestamp.fromDate(new Date(job.updatedAt)),
            startedAt: job.startedAt ? Timestamp.fromDate(new Date(job.startedAt)) : null,
            finishedAt: job.finishedAt ? Timestamp.fromDate(new Date(job.finishedAt)) : null,
            leaseUntil: job.leaseUntil ? Timestamp.fromDate(new Date(job.leaseUntil)) : null,
        };
    }
    fromFs(d) {
        return {
            ...d,
            createdAt: d.createdAt?.toDate()?.toISOString(),
            updatedAt: d.updatedAt?.toDate()?.toISOString(),
            startedAt: d.startedAt?.toDate()?.toISOString(),
            finishedAt: d.finishedAt?.toDate()?.toISOString(),
            leaseUntil: d.leaseUntil?.toDate()?.toISOString(),
        };
    }
    // ---------- required ----------
    async createJob(job) {
        await this.db.runTransaction(async (tx) => {
            const jobRef = this.jobs.doc(job.jobId);
            const idemRef = job.idempotencyKey
                ? this.idem.doc(job.idempotencyKey)
                : null;
            // ??1) READ 먼�? ?��?
            const [jobSnap, idemSnap] = await Promise.all([
                tx.get(jobRef),
                idemRef ? tx.get(idemRef) : Promise.resolve(null),
            ]);
            // idempotency ?��? 존재 ???�사??
            if (idemSnap && idemSnap.exists)
                return;
            // job ?��? 존재 ??종료
            if (jobSnap.exists)
                return;
            // ??2) WRITE??�??�음
            if (idemRef) {
                tx.set(idemRef, {
                    jobId: job.jobId,
                    createdAt: FieldValue.serverTimestamp(),
                });
            }
            tx.set(jobRef, this.toFs(job));
        });
    }
    async getJob(jobId) {
        const snap = await this.jobs.doc(jobId).get();
        if (!snap.exists)
            return null;
        return this.fromFs(snap.data());
    }
    async findByIdempotencyKey(key) {
        const idemSnap = await this.idem.doc(key).get();
        if (!idemSnap.exists)
            return null;
        const jobId = idemSnap.data()?.jobId;
        if (!jobId)
            return null;
        return this.getJob(jobId);
    }
    // ---------- not yet ----------
    // inside DbJobStore
    async leaseNextQueuedJob(opts) {
        const now = opts.now;
        const leaseUntil = new Date(now.getTime() + opts.leaseMs);
        return await this.db.runTransaction(async (tx) => {
            // QUEUED �?가???�래??�?1�?
            const q = await tx.get(this.jobs
                .where("status", "==", "QUEUED")
                .orderBy("createdAt", "asc")
                .limit(1));
            if (q.empty)
                return null;
            const doc = q.docs[0];
            const data = doc.data();
            // ?�태 ?�확??
            if (data.status !== "QUEUED")
                return null;
            tx.update(doc.ref, {
                status: "RUNNING",
                attempts: (data.attempts ?? 0) + 1,
                startedAt: data.startedAt ?? Timestamp.fromDate(now),
                updatedAt: Timestamp.fromDate(now),
                leaseUntil: Timestamp.fromDate(leaseUntil),
            });
            return this.fromFs({
                ...data,
                status: "RUNNING",
                attempts: (data.attempts ?? 0) + 1,
                startedAt: data.startedAt ?? Timestamp.fromDate(now),
                updatedAt: Timestamp.fromDate(now),
                leaseUntil: Timestamp.fromDate(leaseUntil),
            });
        });
    }
    // inside DbJobStore
    async markSucceeded(jobId, okEnvelope, now) {
        const ref = this.jobs.doc(jobId);
        await this.db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists)
                return;
            const d = snap.data();
            if (["SUCCEEDED", "FAILED", "CANCELED"].includes(d.status))
                return;
            tx.update(ref, {
                status: "SUCCEEDED",
                updatedAt: Timestamp.fromDate(now),
                finishedAt: Timestamp.fromDate(now),
                leaseUntil: null,
                result: { okEnvelope },
            });
        });
    }
    async markFailed(jobId, errEnvelope, now) {
        const ref = this.jobs.doc(jobId);
        await this.db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists)
                return;
            const d = snap.data();
            if (["SUCCEEDED", "FAILED", "CANCELED"].includes(d.status))
                return;
            tx.update(ref, {
                status: "FAILED",
                updatedAt: Timestamp.fromDate(now),
                finishedAt: Timestamp.fromDate(now),
                leaseUntil: null,
                result: { errEnvelope },
            });
        });
    }
    // inside DbJobStore
    async cancelJob(jobId, now) {
        const ref = this.jobs.doc(jobId);
        return await this.db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists)
                return null;
            const d = snap.data();
            if (["SUCCEEDED", "FAILED", "CANCELED"].includes(d.status)) {
                // ?��? terminal ??그�?�?반환
                return this.fromFs(d);
            }
            tx.update(ref, {
                status: "CANCELED",
                updatedAt: Timestamp.fromDate(now),
                finishedAt: Timestamp.fromDate(now),
                leaseUntil: null,
                result: {
                    errEnvelope: {
                        ok: false,
                        error: { code: 409, message: "CANCELED" },
                    },
                },
            });
            return this.fromFs({
                ...d,
                status: "CANCELED",
                updatedAt: Timestamp.fromDate(now),
                finishedAt: Timestamp.fromDate(now),
                leaseUntil: null,
                result: {
                    errEnvelope: {
                        ok: false,
                        error: { code: 409, message: "CANCELED" },
                    },
                },
            });
        });
    }
}
