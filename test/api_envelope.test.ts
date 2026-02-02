// test/api_envelope.test.ts
// ✅ 통교체. 이 파일 전체를 아래로 교체해서 붙여넣어.

import { describe, it, expect } from "vitest";
import { runItemEndpoint } from "../src/api/handlers/itemRun";

const baseReq = {
  requestId: "req_test_1",
  itemId: "item1",
  preset: "FREE",
  seed: 123,
  init: { core: { v: 0, r: 0, u: 0, i: 0 } },
  constraints: { hard: [], soft: [] },
};

const item1OkDummy = {
  requestId: baseReq.requestId,
  itemId: "item1",
  map: [],
  outcome: { label: "HOLD" },
  traceKinds: [],
};

describe("API Envelope v0.1", () => {
  it("ok: true 정상 요청", async () => {
    const res = await runItemEndpoint(baseReq, {
      skipResponseValidation: true,
      runners: {
        item1: async () => item1OkDummy as any,
      },
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.requestId).toBe(baseReq.requestId);
      expect(res.itemId).toBe("item1");
      expect(res.data).toBeTruthy();
    }
  });

  it("422: invalid payload(schema fail)", async () => {
    const res = await runItemEndpoint({ ...baseReq, seed: "nope" } as any, {
      runners: { item1: async () => item1OkDummy as any },
    });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("VALIDATION_ERROR");
  });

  it("404-like: itemId invalid → 422(ITEM_NOT_SUPPORTED 또는 VALIDATION_ERROR)", async () => {
    const res = await runItemEndpoint({ ...baseReq, itemId: "item999" } as any);

    expect(res.ok).toBe(false);
    if (!res.ok) expect(["VALIDATION_ERROR", "ITEM_NOT_SUPPORTED"]).toContain(res.error.code);
  });

  it("429: rate mock/placeholder", async () => {
    const res = await runItemEndpoint(baseReq, {
      rateLimiter: () => false,
      runners: { item1: async () => item1OkDummy as any },
    });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("RATE_LIMITED");
  });

  it("503: internal failure mock(throw)", async () => {
    const res = await runItemEndpoint(baseReq, {
      runners: {
        item1: async () => {
          throw new Error("boom");
        },
      },
    });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INTERNAL");
  });
});
