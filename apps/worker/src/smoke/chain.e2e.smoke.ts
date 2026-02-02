import { execChain } from "../chain/execChain";

async function main() {
  const res = await execChain(
    {
      requestId: "smoke_chain_e2e",
      scenarioSet: [{ id: "s1", label: "option A" }],
      state: { core: { u: 0.4, r: 0.2, i: 0.3, v: 0.1 } },
      feedbacks: [{ id: "f1", text: "minor typo", tags: ["typo"] }],
    },
    {
      loop: 1,
      branching: { allowSkip: true, allowRetry: false },
    }
  );

  console.log(
    "[STEPS]",
    res.traces.map(t => `${t.step}:${t.status}`)
  );

  console.log("[SHAPES]", res.traces.map((t: any) => t.signalShape ?? "none"));

  console.log("[SUMMARY]", res.summary.disposition);
}

main();
