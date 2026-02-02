import { routerV01 } from "./router";
export async function runOrbitChain(input, options, runner, env) {
    const traces = [];
    const steps = env === "server"
        ? ["item1", "item2", "item4"]
        : [
            "item1",
            "item2",
            "item3",
            "item6_pre",
            "item4",
            "item7",
            "item8",
            "item9",
            "item10",
            "item5",
            "item6_post",
        ];
    const outputs = {};
    for (const step of steps) {
        // Phase1 items are server/core-only
        const isPhase1 = step === "item1" || step === "item2" || step === "item4";
        if (env === "worker" && isPhase1) {
            traces.push({
                step,
                status: "SKIPPED",
                notes: ["skip:phase1_server_only"],
            });
            continue;
        }
        const ctx = {
            input,
            options,
            outputs,
            signals: input.signals,
        };
        const can = routerV01.canBuild?.(step, ctx);
        if (options?.branching?.allowSkip && can && !can.ok) {
            traces.push({
                step,
                status: "SKIPPED",
                notes: can.reasons?.map((r) => `skip:${r}`),
            });
            continue;
        }
        const payload = routerV01.build(step, ctx);
        try {
            const out = await runner(step, payload);
            outputs[step] = out;
            let signalShape = "none";
            let signals = undefined;
            if (out && typeof out === "object" && "signals" in out) {
                signals = out.signals;
                signalShape = Array.isArray(signals)
                    ? "array"
                    : typeof signals === "object"
                        ? "object"
                        : "other";
            }
            traces.push({
                step,
                status: "SUCCEEDED",
                signals,
                signalShape,
            });
        }
        catch (e) {
            traces.push({
                step,
                status: "FAILED",
                notes: ["execution_failed", String(e?.message ?? e)],
            });
            if (!options?.branching?.allowRetry)
                break;
        }
    }
    return {
        summary: { disposition: "CONTINUE" },
        optionsMap: [],
        traces,
    };
}
