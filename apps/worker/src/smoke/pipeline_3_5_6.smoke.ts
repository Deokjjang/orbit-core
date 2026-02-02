import { PIPELINE_ID_3_5_6, PIPELINE_CONTRACT_VERSION_V0_1 } from "../../../contracts/pipeline_3_5_6";
import { runOrbitPipelineSync, runOrbitPipelineAsync } from "../../../pipeline/wireOrbitPipeline";

function mkReq() {
  return {
    requestId: `smoke_${Date.now()}`,
    pipelineId: PIPELINE_ID_3_5_6,
    contractVersion: PIPELINE_CONTRACT_VERSION_V0_1,
    input: {
  // Item3RequestSchemaê°€ ?”êµ¬?˜ëŠ” ìµœì†Œ 2ê°?
  scenarioSet: [{ id: "s1", label: "smoke" }],
  state: {
    core: { u: 0, r: 0, i: 0, v: 0 },
  },
},
    options: {
      execution: { mode: "sync" },
      exposure: "minimal",
      audience: "general",
      stakes: "low",
      branching: { allowSkip: true, allowRetry: true, allowEscalate: true },
      retry: { maxRetriesPerItem: 1, retryOn: ["TRANSIENT", "WORKER_TIMEOUT"] },
    },
  } as const;
}

async function main() {
  // ---- Sync smoke ----
  const req1 = mkReq();
  const r1 = await runOrbitPipelineSync(req1 as any);
  console.log("[SYNC]", r1.status, r1.result?.summary?.disposition, (r1.errors ?? []).length);
  console.log("[SYNC ERR]", r1.errors);
  // ---- Async smoke (job wrapper) ----
  const req2 = mkReq();
  const r2 = await runOrbitPipelineAsync({ jobId: `job_${Date.now()}`, payload: req2 as any });
  console.log("[ASYNC]", r2.status, r2.result?.summary?.disposition, (r2.errors ?? []).length);
  console.log("[ASYNC ERR]", r2.errors);
  // hard fail on totally broken pipeline
  if (r1.status === "FAILED" || r2.status === "FAILED") {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
