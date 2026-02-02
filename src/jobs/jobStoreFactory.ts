// src/jobs/jobStoreFactory.ts

import { JobStore } from "./jobStoreTypes";
import { MemoryJobStore } from "./memoryJobStore";
import { DbJobStore } from "./dbJobStore";

export function createJobStore(): JobStore {
  const kind = process.env.JOB_STORE ?? "memory";

  if (kind === "db") {
    // ?„ì§ DB ë¯¸êµ¬?????°í??„ì—??ëª…ì‹œ?ìœ¼ë¡?ë§‰ìŒ
    return new DbJobStore();
  }

  // default
  return new MemoryJobStore();
}
