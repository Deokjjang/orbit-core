// src/jobs/jobStoreFactory.ts
import { MemoryJobStore } from "./memoryJobStore";
import { DbJobStore } from "./dbJobStore";
export function createJobStore() {
    const kind = process.env.JOB_STORE ?? "memory";
    if (kind === "db") {
        // ?�직 DB 미구?????��??�에??명시?�으�?막음
        return new DbJobStore();
    }
    // default
    return new MemoryJobStore();
}
