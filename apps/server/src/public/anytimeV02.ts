// apps/server/src/public/anytimeV02.ts
//
// ORBIT Anytime v0.2 — Server Public Entry (SSOT)
//
// 외부 런타임(Express/Functions/Cloud Run/Dev harness)은
// 이 파일만 import 해서 HTTP 결선/테스트를 구성한다.
//
// ✅ Express를 써도 됨: anytimeV02Router 마운트
// ✅ Express가 아니어도 됨: handlers(순수 함수) 직접 호출

export { anytimeV02Router } from "../routes/anytimeV02";
export * as anytimeV02Handlers from "../handlers/anytimeV02";
