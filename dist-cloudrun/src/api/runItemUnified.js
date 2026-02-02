// src/api/runItemUnified.ts
import { runItemAsyncHandler } from "./runItemAsync";
export function runItemUnifiedHandler(deps) {
    const asyncHandler = runItemAsyncHandler(deps.store);
    return async (req, res) => {
        const mode = req.query?.mode;
        if (mode === "async") {
            return asyncHandler(req, res);
        }
        // default = sync (Step 15)
        return deps.runSync(req, res);
    };
}
