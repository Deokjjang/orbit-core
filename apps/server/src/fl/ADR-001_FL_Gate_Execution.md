# ADR-001: FL Gate Execution & Safety Model

## Status
Accepted

## Context
FL Gate는 ORBIT 결과를 해석하지 않고 집행/승인/증적을 전담한다.
운영 사고를 방지하기 위해 다중 가드와 관측을 단계적으로 도입했다.

## Decisions
1. **Transport-only Envelope**: ORBIT 결과는 opaque로 운반.
2. **Env Guard**: EXECUTE는 production에서만 허용.
3. **Kill Switch**: `FL_EXECUTE_ENABLED=true` 없으면 EXECUTE 금지.
4. **Preflight**: wsId/requestId/approverUid 필수 검증.
5. **RBAC**: EXECUTE/APPROVE는 admin만 허용.
6. **Idempotency**: 서버측 선점 + Gate 내부 이중 가드.
7. **Rollback**: Gate 실패 시 선점 롤백.
8. **Retry Policy**: GATE_FAILURE만 제한 재시도(백오프).
9. **Observability**:
   - Events: RESULT/RETRY/PREFLIGHT/ALERT
   - Daily Rollup, SLO, Alerts
10. **No Express Assumption**: 기존 handler 패턴 유지.

## Consequences
- 안전성 ↑, 운영 비용/복잡성 관리 가능
- EXECUTE는 명시적 승인과 환경 설정이 필요

## References
- src/fl/runGate.ts
- src/fl/preflightCheck.ts
- src/fl/authorizeGate.ts
- src/fl/retryPolicy.ts
- src/fl/gateEventLog.ts
