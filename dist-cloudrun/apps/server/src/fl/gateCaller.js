// apps/server/src/fl/gateCaller.ts
// Phase 5 Step 3: Default Gate caller (direct kernel call, runtime-resolved).
// SSOT: No ORBIT interpretation. This is only a thin adapter that forwards the envelope.
import { createRequire } from "module";
function isFn(x) {
    return typeof x === "function";
}
/**
 * Try to resolve FL Gate kernel without compile-time hard dependency.
 * You MUST keep this file thin; it is only for locating + calling Gate.
 *
 * Expected kernel API (any one of these):
 * - runFlGate(input: FlGateInputEnvelope): Promise<FlGateResult>
 * - runGate(input: FlGateInputEnvelope): Promise<FlGateResult>
 * - evaluate(input: FlGateInputEnvelope): Promise<FlGateResult>
 */
function resolveKernelEntry() {
    const req = createRequire(import.meta.url);
    // Add/adjust candidates as your repo evolves (runtime only; does not break tsc).
    const candidates = [
        // common guesses (keep list short, ordered by likelihood)
        "apps/server/src/fl/gateKernel",
        "apps/server/src/fl/gate",
        "apps/server/src/fl/flGate",
        "packages/fl-gate",
        "packages/fl-gate-kernel",
        "@dvem/fl-gate",
        "@dvem/fl-gate-kernel",
    ];
    const entryNames = ["runFlGate", "runGate", "evaluate"];
    const errors = [];
    for (const modPath of candidates) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const mod = req(modPath);
            if (!mod)
                continue;
            for (const name of entryNames) {
                const fn = mod[name];
                if (isFn(fn))
                    return fn;
            }
            errors.push(`Loaded "${modPath}" but no entry found. Exports: ${Object.keys(mod).join(", ")}`);
        }
        catch (e) {
            errors.push(`Failed "${modPath}": ${String(e?.message ?? e)}`);
        }
    }
    const msg = "FL Gate kernel not found.\n" +
        "Searched:\n" +
        candidates.map((x) => `- ${x}`).join("\n") +
        "\n\nDetails:\n" +
        errors.map((x) => `- ${x}`).join("\n") +
        "\n\nFix: add the real module path to candidates[] in gateCaller.ts, " +
        'and ensure it exports one of: "runFlGate" | "runGate" | "evaluate".';
    throw new Error(msg);
}
export function createDefaultGateCaller() {
    const kernelEntry = resolveKernelEntry();
    return async (input) => {
        // Forward only. No interpretation.
        const out = await kernelEntry(input);
        // Minimal shape guard (avoid silent bad returns)
        if (!out || typeof out !== "object")
            throw new Error("gate_invalid_return");
        const verdict = out.verdict;
        if (verdict !== "ALLOW" && verdict !== "REQUIRE_APPROVAL" && verdict !== "BLOCK") {
            throw new Error("gate_missing_or_invalid_verdict");
        }
        return out;
    };
}
