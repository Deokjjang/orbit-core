# Item 3 — Uncertainty Mapper
Adapter I/O Checklist v0.1 (FREEZE)

## 1) Required Inputs (must exist)
- requestId: string
- scenarioSet: Scenario[] (len >= 1)
  - scenario.id: string
  - scenario.label: string
- state.core: { v,r,u,i } in [-1,1]

## 2) Optional Inputs (may be absent, must still run)
- state.optional: { p,c,t,... } (plugin axes)
- constraints:
  - hard?: HardConstraint[]
  - soft?: SoftConstraint[]
- evidenceLinks?: EvidenceLink[] (docHash+sectionId+span)
- context?: { locale?, domain?, notes? }

## 3) Must-NOT Touch (strict boundaries)
- DO NOT mutate state, constraints, scenarioSet
- DO NOT call Gate (no PROCEED/HOLD/STOP)
- DO NOT output numeric scores/probabilities/percentiles
- DO NOT change Core equations / energy / ranking
- DO NOT claim truth or validation

## 4) Output Guarantees (always present)
- uncertainty.overallTier: LOW|MEDIUM|HIGH
- uncertainty.density.byAxis: tiers for u,r,i,v (even if derived coarse)
- uncertainty.density.byScenario: tier per scenarioId
- questions: 0..6 (default cap 3; allow 6 when needed)
- signals: 0..N
- meta.noDecision=true, meta.noGate=true, meta.version=v0.1

## 5) Tiering Rule (coarse, non-numeric)
- Tier labels only.
- Primary driver: |u| high => HIGH, mid => MEDIUM, low => LOW
- If evidenceLinks missing OR constraints missing => add sources[MISSING] and raise tier at least 1 level (cap HIGH)
- If conflicts detected in constraints (hard vs soft overlap same ref) => sources[CONFLICT] + overallTier HIGH

## 6) Question Policy (minimal trigger set)
- Ask only what reduces uncertainty most.
- Priority order:
  1) Missing critical evidence reference
  2) Ambiguous constraint trigger
  3) Conflicting obligations/rights in scenario assumptions
- question.target:
  - user: requires human choice/clarification
  - evidence: requires document/section
  - system: requires upstream adapter fill

## 7) Signals Catalog (allowed names)
- u_spike
- evidence_gap
- constraint_conflict
- assumption_heavy
- stale_evidence
- axis_missing_optional
- scenario_underdefined

## 8) Edge Cases
- scenarioSet len=1: still returns byScenario tier list (len=1)
- state.optional absent: emit signal axis_missing_optional (LOW)
- constraints absent: sources[MISSING where=constraint], signal evidence_gap (MEDIUM+)
- evidenceLinks present but stale flag upstream: sources[STALE]

## 9) Compliance Checklist (must pass before merge)
- [ ] No numeric outputs anywhere
- [ ] No Gate call
- [ ] No state mutation
- [ ] Questions <= 6
- [ ] Works with missing optional inputs
- [ ] Produces all Output Guarantees
