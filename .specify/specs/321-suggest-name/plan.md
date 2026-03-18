# Plan: 321 Suggest Name Deterministic Grammar

## Phase 1: Name grammar module

- Create `src/lib/shadow-name-grammar.ts`
- 6-face vocab (roles + descriptors per sect)
- `deriveShadowName(charge: string, mask: string): string`
- Hash input (djb2 or char-code sum) to pick indices
- Pattern: `The {Descriptor} {Role}`

## Phase 2: Backend

- In `shaman_suggest_shadow_name`: call grammar directly; remove AI path (or gate behind flag)
- Ensure route returns quickly
- Keep `_fallback_name()` as grammar call

## Phase 3: Frontend

- Add `AbortSignal.timeout(15000)` to suggestShadowName fetch in agents.ts
- Log `res.status`, `res.url` on error in Shadow321Runner
- No UI changes to button; already wired

## Phase 4: Verification

- Same input → same name
- Suggest Name returns in <1s
- Timeout shows error after 15s
