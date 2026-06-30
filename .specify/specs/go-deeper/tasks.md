# Tasks: Go Deeper (Superpower Funnel)

API-first, five slices. Reuse auth/entitlements/deck-UI/technique-library. Only schema change = three additive `Player` fields. Spec: [spec.md](spec.md).

> **Status (2026-06-20):** Slice 1 implemented on `claude/admiring-shannon-wlddtw`. 100 tests pass; tsc + eslint clean. Ownership is derived from the `Entitlement.sku` pattern `superpower-<sp>-pack` (pure `superpower-skus.ts`), so Slice 1 is **fully decoupled from `offers.ts`** (which is being reworked on the quiz branch) — Slice 3 SKUs land at merge.
>
> **Slice 2 (quiz) is OWNED by `claude/determined-ramanujan-rfq6a4`** (full `superpower-quiz-design` + `scoreQuiz`). Do not rebuild here — consume its output and map to `{inner,outer}` per the reconciliation doc (M1). See `.specify/specs/superpower-system-reconciliation/reconciliation.md`.

## Slice 1 — Loadout foundation (server/data, no UI)
- [x] **T1** Prisma: add `Player.superpowerInner String?`, `superpowerOuter String?`, `quizCompletedAt DateTime?`.
- [x] **T2** Migration `20260620120000_player_superpower_loadout` (additive `ALTER TABLE "players" ADD COLUMN …`; hand-written since no DB in this env — `migrate deploy` applies it). `prisma generate` + `record-schema-hash` run.
- [x] **T3** `src/lib/technique-library/base-pool.ts` → `BASE_POOL` (excludes `sp-*` pack cards); re-exported from index.
- [x] **T4** `src/lib/player-entitlements/{superpower-skus.ts (pure), loadout.ts (server)}`: `getPlayerLoadout`, `getOwnedSuperpowers` (sku-pattern → Superpower).
- [x] **T5** `src/actions/superpower.ts`: `saveSuperpowerLoadout(inner, outer)` — login-required; persists; deferred inner-pack grant when `deck-digital` held (guarded against double-grant).
- [x] **T6** Tests: sku round-trip (incl. coach), `superpowersFromEntitlements` (dedupe/ignore unknown), `loadoutFromPlayer` (valid/null/invalid). *(DB-bound wrappers + action are integration-tested when a DB is available.)*

## Slice 2 — The quiz — DEFERRED to Branch B (see status note)
- [ ] **T7** `src/lib/superpowers/quiz.ts`: `QUIZ_QUESTIONS` (inner-axis + outer-axis) + pure `scoreQuiz(answers) → {inner, outer}` (two sub-scales; deterministic tie-break).
- [ ] **T8** Tests for `scoreQuiz` (each axis resolves; ties deterministic).
- [ ] **T9** `src/components/superpowers/SuperpowerQuiz.tsx`: anon-capable quiz + result (inner/outer + one taste card) + "log in to save" → `saveSuperpowerLoadout`.
- [ ] **T10** Entry points: landing hook, onboarding step, lazy prompt at Go Deeper.

## Slice 3 — SKUs & entitlements
> **Status (2026-06-24):** Implemented. `OfferKey` widened with a template-literal
> `superpower-${Superpower}-pack` type + `loadout-bundle`; the 7 packs are generated
> from `SUPERPOWER_DEFS` (Coach included — no second-class slot). Pack OfferKey is
> byte-identical to `superpowerPackSku`. `grants.ts` keeps core records keyed to the
> new `CoreOfferKey`; packs/bundle resolve via `skuToSuperpower` fallback (perpetual,
> single-charge/idempotent). Go Deeper upsell now resolves a real `upsellHref`
> (`offerHref` → live Gumroad or `/launch#<sku>` anchor); `/launch` renders the packs
> + loadout bundle. 8 catalog tests; tsc + eslint clean.
- [x] **T11** `src/lib/launch/offers.ts`: `superpower-<x>-pack` (×7) + `loadout-bundle` OfferKeys (Gumroad env links, "setup pending" when unset).
- [x] **T12** `src/lib/launch/grants.ts`: pack confers itself (`skuToSuperpower` = the capability→Superpower bridge `getOwnedSuperpowers` uses); bundle confers `deck-digital`; single-charge invariant documented.
- [x] **T13** Helper `superpowerPackOfferKey(sp)` (= `superpowerPackSku`) + reverse; round-trip + catalog tests in `superpower-offers.test.ts`.

## Slice 4 — Go Deeper
> **Status (2026-06-20):** Implemented. Pure `buildGoDeeper` (technique-library/superpowers/go-deeper.ts) decides ok/locked/unavailable, gated to published L3+ cells; `getCardGoDeeper` server action (auth → loadout → owned, +needs_login/needs_quiz/not_found); `GoDeeper.tsx` wired into the deck detail overlay. 105 tests pass; tsc + eslint clean. Locked path never leaks content (citation only).
> **Update (2026-06-24, Slice 3):** the upsell is now real — `getCardGoDeeper` adds `upsellHref` (`offerHref(upsellSku)` → live Gumroad or `/launch#<sku>`); the locked state links to the specific pack (not the `/launch` placeholder); `needs_quiz` now points at `/superpower` (the merged quiz).
- [x] **T14** `src/actions/deck-techniques.ts`: `getCardGoDeeper(cardId, subject)` → owned content (published, highest level) | citation + `upsellSku` | `needsQuiz`/`needsLogin`; `available:false` when no published card.
- [x] **T15** `src/components/deck/GoDeeper.tsx`: overlay affordance — render move (owner) / inline Paywall upsell (non-owner) / quiz prompt (no loadout); shown only when `available`.
- [x] **T16** Wire `GoDeeper` into `AllyshipDeckReader` card overlay, reading the active subject.
- [x] **T17** Tests: `getCardGoDeeper` for owned / locked / needsQuiz / unavailable.

## Slice 5 — Verification & polish
> **Status (2026-06-24):** Implemented. `scripts/seed-cert-go-deeper.ts` seeds the
> `cert-go-deeper-v1` Twine cert (CustomBar, `isSystem`+public, deterministic id,
> idempotent upsert) with the 6-step flow: quiz → result → draw → inner Go Deeper
> (pays off) → outer Go Deeper (upsell, locked, no leak) → gates-honest → mint;
> framed to the Bruised Banana Fundraiser. Wired as `npm run seed:cert:go-deeper`.
- [x] **T18** Verification quest `cert-go-deeper-v1` (Twine passages: quiz → result → draw → inner Go Deeper → outer upsell → mint) + idempotent seed; tie to Bruised Banana Fundraiser.
- [x] **T19** `npm run check` green (exit 0, 0 errors). `npm run build` compiles clean; in this sandboxed env it stops only at Google-Fonts fetch (network egress blocked) — not a code error. Builds green where outbound font fetch is allowed.

## Housekeeping
- [ ] **T20** `BACKLOG.md` entry + `npm run backlog:seed`.
- [ ] **T21** Coordinate with `superpower-deck-quality` Phase 5: publish inner hero cells for the six superpowers (or accept L2 floor) so Go Deeper content is worth owning.

## Verification (every slice)
- `vitest run`; `tsc --noEmit`; `eslint` — fail-fix.
- Base deck stays 120; base pool free of `sp-*` cards; gates never leak content to non-owners.
- `npm run build` before merge to main.
