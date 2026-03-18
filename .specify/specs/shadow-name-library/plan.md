# Plan: Shadow Name Library

## Phase 1: Expand vocab (zero tokens)

- Extract vocab from `shadow-name-grammar.ts` to `shadow-name-vocab.json` or typed config
- Expand to 8 roles × 8 descriptors per face
- Add patterns: "The {D} {R}", "{D} {R}", "The {R} of {N}" (abstract nouns)
- Update `deriveShadowName` to read from config and support patterns
- Add compound descriptor option (pick 2, join with hyphen)

## Phase 2: Feedback (optional)

- Add `ShadowNameFeedback` model or append log
- In Shadow321Runner: when user continues past face_3, emit event (accepted vs edited)
- Store: input_hash, suggested_name, accepted, edited_to
- No PII; minimal schema

## Phase 3: Batch refinement (optional)

- Script: analyze feedback, compute accept rate per (role, descriptor)
- Output: report or suggested vocab changes
- Optional: weekly AI batch to propose new words; human curates; add to vocab

## File impacts

- `src/lib/shadow-name-grammar.ts` — refactor to use external vocab
- `src/lib/shadow-name-vocab.json` — new (or .ts config)
- `src/app/shadow/321/Shadow321Runner.tsx` — emit feedback on continue
- `prisma/schema.prisma` — optional ShadowNameFeedback table
- `scripts/analyze-shadow-name-feedback.ts` — optional batch script
