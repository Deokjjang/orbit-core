import { runItem9 } from "../../../../packages/orbit-items/item9";

async function main() {
  const result = runItem9({
    requestId: "smoke_item9",
    feedbacks: [
      { id: "f1", text: "Fix typo", tags: ["typo"] },
      { id: "f2", text: "Another typo here", tags: ["typo"] },
      { id: "f3", text: "Clarify section 2", tags: ["clarification"] },
      { id: "f4", text: "General comment without tags" },
    ],
    meta: { audience: "general" },
  });

  console.log(
    "[ACCEPTED]",
    result.acceptedEdits.map(c => `${c.label}:${c.members.length}`)
  );
  console.log(
    "[OPEN]",
    result.openIssues.map(c => `${c.label}:${c.members.length}`)
  );
  console.log(
    "[SIGNALS]",
    result.signals.map(s => s.code)
  );
}

main();
