# Tasks: Go Deeper (Superpower Funnel)

API-first, five slices. Reuse auth/entitlements/deck-UI/technique-library. Only schema change = three additive `Player` fields. Spec: [spec.md](spec.md).

## Slice 1 — Loadout foundation (server/data, no UI)
- [ ] **T1** Prisma: add `Player.superpowerInner String?`, `superpowerOuter String?`, `quizCompletedAt DateTime?`.
- [ ] **T2** `npx prisma migrate dev --name player_superpower_loadout`; commit migration + schema; `npm run db:generate` + `db:record-schema-hash`.
- [ ] **T3** `src/lib/technique-library/index.ts`: export `BASE_POOL` (canonical base techniques; excludes `sp-*` pack cards).
- [ ] **T4** `src/lib/player-entitlements/loadout.ts`: `getPlayerLoadout(playerId)`, `getOwnedSuperpowers(playerId)` (capability → Superpower map).
- [ ] **T5** `src/actions/superpower.ts`: `saveSuperpowerLoadout(inner, outer)` — requires login; persists; deferred inner-pack grant when `deck-digital` held (idempotent).
- [ ] **T6** Tests: loadout round-trip; deck-owner save grants `superpower-<inner>-pack`; non-owner grants nothing; `getOwnedSuperpowers` mapping.

## Slice 2 — The quiz
- [ ] **T7** `src/lib/superpowers/quiz.ts`: `QUIZ_QUESTIONS` (inner-axis + outer-axis) + pure `scoreQuiz(answers) → {inner, outer}` (two sub-scales; deterministic tie-break).
- [ ] **T8** Tests for `scoreQuiz` (each axis resolves; ties deterministic).
- [ ] **T9** `src/components/superpowers/SuperpowerQuiz.tsx`: anon-capable quiz + result (inner/outer + one taste card) + "log in to save" → `saveSuperpowerLoadout`.
- [ ] **T10** Entry points: landing hook, onboarding step, lazy prompt at Go Deeper.

## Slice 3 — SKUs & entitlements
- [ ] **T11** `src/lib/launch/offers.ts`: add `superpower-<x>-pack` (×6) + `loadout-bundle` OfferKeys (Gumroad links).
- [ ] **T12** `src/lib/launch/grants.ts`: SKU→capability + a `capability → Superpower` map consumed by `getOwnedSuperpowers`; confirm `deck-digital` path.
- [ ] **T13** Helper `superpowerPackSku(sp)` + reverse; unit test the round-trip.

## Slice 4 — Go Deeper
- [ ] **T14** `src/actions/deck-techniques.ts`: `getCardGoDeeper(cardId, subject)` → owned content (published, highest level) | citation + `upsellSku` | `needsQuiz`/`needsLogin`; `available:false` when no published card.
- [ ] **T15** `src/components/deck/GoDeeper.tsx`: overlay affordance — render move (owner) / inline Paywall upsell (non-owner) / quiz prompt (no loadout); shown only when `available`.
- [ ] **T16** Wire `GoDeeper` into `AllyshipDeckReader` card overlay, reading the active subject.
- [ ] **T17** Tests: `getCardGoDeeper` for owned / locked / needsQuiz / unavailable.

## Slice 5 — Verification & polish
- [ ] **T18** Verification quest `cert-go-deeper-v1` (Twine passages: quiz → result → draw → inner Go Deeper → outer upsell → mint) + idempotent seed; tie to Bruised Banana Fundraiser.
- [ ] **T19** `npm run check` + `npm run build` green.

## Housekeeping
- [ ] **T20** `BACKLOG.md` entry + `npm run backlog:seed`.
- [ ] **T21** Coordinate with `superpower-deck-quality` Phase 5: publish inner hero cells for the six superpowers (or accept L2 floor) so Go Deeper content is worth owning.

## Verification (every slice)
- `vitest run`; `tsc --noEmit`; `eslint` — fail-fix.
- Base deck stays 120; base pool free of `sp-*` cards; gates never leak content to non-owners.
- `npm run build` before merge to main.
