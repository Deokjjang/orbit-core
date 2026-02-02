// test/adapter.golden.test.ts

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

import { ingestV01 } from "../packages/orbit-adapter/ingest";
import { normalizeToIrV01 } from "../packages/orbit-adapter/normalizeToTr";
import { applyRulesV01 } from "../packages/orbit-adapter/applyRules";
import { compileToOrbitV01 } from "../packages/orbit-adapter/compileToOrbit";
import { RulePackSet } from "../packages/orbit-adapter/rulePack";

function readJson<T = any>(p: string): T {
  const abs = path.resolve(process.cwd(), p);
  return JSON.parse(fs.readFileSync(abs, "utf-8")) as T;
}

function pickTextFixture(j: any): { docHash: string; text?: string; sections?: any[] } {
  const docHash = j.docHash ?? j.meta?.docHash ?? "golden_doc";

  // 1) 우리가 기대한 형태
  if (typeof j.text === "string") return { docHash, text: j.text };
  if (Array.isArray(j.sections)) return { docHash, sections: j.sections };

  // 2) 흔한 래핑 케이스들(기존 golden/cases 구조 대응)
  if (typeof j.input?.text === "string") return { docHash, text: j.input.text };
  if (Array.isArray(j.input?.sections)) return { docHash, sections: j.input.sections };

  // 3) 최후: 단일 문자열 후보들
  const candidates = [
    j.documentText,
    j.rawText,
    j.payload?.text,
    j.case?.text,
  ].filter((v) => typeof v === "string") as string[];
  if (candidates[0]) return { docHash, text: candidates[0] };

  return { docHash };
}

describe("adapter golden v0.1", () => {
  it("01_basic", () => {
    const basic = readJson<any>("test/golden/cases/adapter_01_basic.json");

    const fx = pickTextFixture(basic);
    if (!fx.text && !fx.sections) {
      throw new Error(
        "golden case missing text/sections. Provide `text` or `input.text` (or `sections` / `input.sections`)."
      );
    }

    const raw = fx.text
      ? ingestV01({ kind: "text", docHash: fx.docHash, text: fx.text })
      : ingestV01({ kind: "sections", docHash: fx.docHash, sections: fx.sections! });

    const ir = normalizeToIrV01(raw);

    const rules = RulePackSet.parse(basic.rulePackSet ?? basic.rules ?? basic.input?.rulePackSet);
    const applied = applyRulesV01({ ir, rulePackSet: rules });

    const out = compileToOrbitV01({ ir, applied });

    expect(out).toMatchObject(basic.expected);
  });
});
