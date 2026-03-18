# Tasks: 321 Suggest Name Deterministic Grammar

## Phase 1: Name grammar

- [x] Create `src/lib/shadow-name-grammar.ts` with 6-face vocab
- [x] Implement `deriveShadowName(chargeDescription, maskShape): string`
- [x] Use hash of normalized input to pick role + descriptor indices

## Phase 2: Backend

- [x] Port grammar to Python (`backend/app/shadow_name_grammar.py`); use as primary in suggest-shadow-name
- [x] Remove Shaman AI path; deterministic only

## Phase 3: Frontend

- [x] Frontend uses `deriveShadowName` directly (no backend call); instant
- [x] Add 15s timeout to suggestShadowName in agents.ts (for API consumers)

## Phase 4: Verification

- [x] npm run build (clean) and npm run check (0 errors)
- [ ] Manual: Suggest Name returns quickly; same input = same name
- [x] FR4: Log status/url on fetch failure for debugging (agents.ts)
