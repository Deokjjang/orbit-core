# ORBIT v0.2 — Deep Extensions (SSOT)

이 디렉터리는 **ORBIT v0.2 Anytime Execution**에 플러그인되는  
**Deep Extension 모듈의 계약(Contract)과 기준선**을 고정한다.

> ⚠️ 경계 원칙  
> - 결정 / 집행 / 정책 / 승인 / 감사 **금지**  
> - deep 모듈은 **계산·신호·분리 결과(analytics)**만 제공  
> - base / lite 결과를 **오염하지 않는다**

---

## 실행 순서 (SSOT)

Registry 순서 = 실행 후보 순서

```
1. diversity.dpp
2. robustness.perturb
3. smc.changepoint
```

- 실제 실행 여부는 **예산(preflight)** 으로만 제어
- 순서 변경은 **SSOT 변경**을 의미하므로 금지

---

## 모듈별 계약

### 1) diversity.dpp
- **moduleId:** `diversity.dpp`
- **estimateUnits:** `1`
- **목적:** 후보 다양성 확보 (v0.2 초기에는 stub)
- **output (INLINE):**
```json
{
  "kind": "DIVERSITY_STUB",
  "note": "stub result (no-op)"
}
```

---

### 2) robustness.perturb
- **moduleId:** `robustness.perturb`
- **estimateUnits:** `2`
- **목적:** 강건성/민감도 분석
- **output (INLINE → analytics):**
```json
{
  "analytics": {
    "stabilityTier": "UNKNOWN",
    "note": "stub analytics (no-op)"
  }
}
```

- `exposure=analytical`일 때 **analytics 블록 노출 가능**

---

### 3) smc.changepoint
- **moduleId:** `smc.changepoint`
- **estimateUnits:** `2`
- **목적:** 변화점/드리프트 탐지
- **output (INLINE → analytics):**
```json
{
  "analytics": {
    "changePoint": "UNKNOWN",
    "note": "stub analytics (no-op)"
  }
}
```

---

## 공통 계약

모든 deep 모듈은 아래 인터페이스를 따른다.

- `shouldRun(ctx)`  
  - 순수 함수, 상태 변경 금지
- `estimateUnits(ctx)`  
  - **보수적 추정 필수**
- `run(ctx)`  
  - 결과는 반드시 `DeepRunResultV02`
  - side-effect 금지

---

## Anytime v0.2와의 관계

- deep 결과는 **ExecutionEnvelope.deep.steps**에만 저장
- base/lite 결과와 **완전히 분리**
- 예산 초과 시:
  - `stoppedReason = BUDGET_EXHAUSTED`
  - `remainingPlan`은 메타 정보로만 사용

---

## 상태

- 현재 단계: **Stub / Contract FREEZE**
- 이후 단계:
  - 실제 계산 로직 추가
  - analytics 신호 정밀화
  - robustness / SMC 고도화

이 문서는 **v0.2 deep extension의 단일 기준선(SSOT)** 이다.
