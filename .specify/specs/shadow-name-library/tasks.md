# Tasks: Shadow Name Library

## Phase 1: Expand vocab

- [x] Vocab expanded in `src/lib/shadow-name-grammar.ts` (exported as `SHADOW_NAME_VOCAB`)
- [x] Expanded to 8 roles × 8 descriptors per face (6 faces = 48 roles, 48 descriptors)
- [x] 3 grammar patterns: "The {D} {R}", "{D} {R}", "The {R} of {D}"
- [x] `deriveShadowName` refactored to use SHADOW_NAME_VOCAB config
- [x] Python port (`backend/app/shadow_name_grammar.py`) synced — identical output verified

## Phase 2: Feedback (optional)

- [x] `ShadowNameFeedback` Prisma model + migration `20260317000001_add_shadow_name_feedback`
- [x] `src/actions/shadow-name-feedback.ts` — `logShadowNameFeedback` server action
- [x] Shadow321Runner `face_3`: tracks `lastSuggestedNameRef`, emits feedback on Next (fire-and-forget)

## Phase 3: Batch refinement (optional)

- [x] `scripts/shadow-name-feedback-report.ts` — `npm run snl:report`
  - accept rate per (face, descriptor, role), sorted worst-first
  - pattern breakdown
  - markdown report → `.specify/specs/shadow-name-library/FEEDBACK_REPORT.md`
  - `--min-count N` flag to filter low-sample pairs
- [ ] AI batch: propose replacement words for low-acceptance pairs; human approves (deferred — needs data)

## Verification

- [x] npm run check (0 errors)
- [x] Same input = same name (deterministic preserved — verified same output across 5 test cases)
- [x] Vocab inline in .ts — well under 50KB
