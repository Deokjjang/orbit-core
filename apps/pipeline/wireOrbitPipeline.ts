/* ============================================================
 * ORBIT Pipeline Wiring
 * - Server(Sync) & Worker(Async) adaptor
 * - Injects concrete Item executors
 * - No business logic here
 * ============================================================ */

import { runOrbitPipeline } from "./runOrbitPipeline";
import {
  OrbitPipelineRunRequest,
  OrbitPipelineRunResponse,
} from "../contracts/pipeline_3_5_6";

/* ------------------------------------------------------------
 * Concrete Executors (Injected)
 * ------------------------------------------------------------
 * NOTE:
 * - These imports must point to EXISTING implementations
 * - Do NOT re-implement item logic here
 * ------------------------------------------------------------ */

// wireOrbitPipeline.ts
// wireOrbitPipeline.ts (?ÑÏû¨ ?åÏùº ?ÑÏπòÍ∞Ä apps/pipeline/ ?ºÍ≥† Í∞Ä??
import { execItem3 } from "../worker/src/items/item3";
import { execItem5 } from "../worker/src/items/item5";
import { execItem6 } from "../worker/src/items/item6";

/* ------------------------------------------------------------
 * Server (Sync) Entry
 * ------------------------------------------------------------ */

export async function runOrbitPipelineSync(
  req: OrbitPipelineRunRequest
): Promise<OrbitPipelineRunResponse> {
  return runOrbitPipeline(
    req,
    {
      execItem3,
      execItem5,
      execItem6,
    },
    { mode: "sync" }
  );
}

/* ------------------------------------------------------------
 * Worker (Async) Entry
 * ------------------------------------------------------------ */

export async function runOrbitPipelineAsync(
  job: {
    jobId: string;
    payload: OrbitPipelineRunRequest;
  }
): Promise<OrbitPipelineRunResponse> {
  return runOrbitPipeline(
    job.payload,
    {
      execItem3,
      execItem5,
      execItem6,
    },
    { mode: "async", jobId: job.jobId }
  );
}

/* ------------------------------------------------------------
 * SSOT NOTES
 * ------------------------------------------------------------
 * - HTTP handlers call runOrbitPipelineSync
 * - Worker job processors call runOrbitPipelineAsync
 * - Idempotency / lease / cancel handled OUTSIDE
 * - This file MUST stay thin
 * ------------------------------------------------------------ */
