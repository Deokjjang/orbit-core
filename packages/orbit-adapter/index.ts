// packages/orbit-adapter/index.ts
//
// Adapter Public API v0.1 — SSOT
// 목적: T1 도메인 어댑터의 “공식 진입점” 고정
// - 내부 파일 경로 의존 차단
// - 이후 T2/T3에서 이 API만 사용
//
// 다음 단계(ㄱ): test/golden/cases/adapter_02_hard_block.json (또는 T1 종료 선언)

export { ingestV01 } from "./ingest";
export { normalizeToIrV01 } from "./normalizeToTr";
export { applyRulesV01 } from "./applyRules";
export { compileToOrbitV01 } from "./compileToOrbit";

// schemas / types
export * from "./ir.schema";
export * from "./ruleAtom";
export * from "./rulePack";
