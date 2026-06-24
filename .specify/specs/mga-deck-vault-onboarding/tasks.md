# Tasks: MGA — Deck → Hand → Vault → Onboarding

> Implement per [plan.md](./plan.md) / [spec.md](./spec.md). API-first within each slice. End every slice with `npm run build` + `npm run check` green.

## Slice 1 — Intake fix + pending capture

- [x] **T1.1** Add `src/lib/deck-pending-intent.ts`: `signPendingIntent({cardId,subject})` + `verifyPendingIntent(token)` (HMAC, short TTL, cookie `bars_deck_pending`). Document any new env var in `docs/ENV_AND_VERCEL.md`. _(env: `DECK_PENDING_SECRET`; unit test `test:deck-pending-intent`)_
- [x] **T1.2** Extract `materializeDeckBar(player, cardId, subject)` in `send-deck-card-to-bars.ts`: rebuild card from `assembleDeck()`, create `CustomBar` (`claimedById = player.id`, `status: 'active'`), attempt hand placement, return `{ barId, placedInHand }`.
- [x] **T1.3** Rewrite `sendDeckCardToBars`: logged-out → `{ needsAuth, pendingToken }` (sign intent, no DB write); logged-in → call `materializeDeckBar`, return `{ success, barId, placedInHand }`.
- [x] **T1.4** Update `SendToBarsButton.tsx`: `success` → `router.push('/')`; `needsAuth` → `/signup?returnTo=/deck`; `error` → inline (real failures only). Removed the "Not logged in" dead-end. _(token carried by httpOnly cookie, not URL)_
- [x] **T1.5** `npm run check` (lint 0 errors, `tsc` exit 0) + `test:deck-pending-intent` pass. `npm run build` blocked **only** by Google-Fonts fetch in the sandbox (unrelated to this slice); no compile/type errors. Manual run deferred to Slice 2 (`/signup` route lands there).

## Slice 2 — Plain MGA auth + claim pending

- [x] **T2.1** `claimPendingDeckBar()` action + shared `claimPendingDeckBarForPlayer(playerId)` in `src/lib/deck-bar.ts` (reads signed cookie → `materializeDeckBar` → clears cookie, single-use). _Refactor: moved `materializeDeckBar` into the plain lib so the auth action and deck action don't 'use server'→'use server' cross-import (Turbopack restriction)._
- [x] **T2.2** Add `src/actions/mga-auth.ts`: `signupMga`/`loginMga` reusing `Account`+password+`bars_player_id` cookie, **no** `/conclave/guided` redirect; claim pending on success. New accounts are game-ready (`onboardingComplete: true` + auto-invite + orientation threads) so they reach the Vault/NOW without Conclave. A claimed deck card pulls the player to NOW home.
- [x] **T2.3** Add `src/app/signup/page.tsx`; shared `src/components/auth/MgaAuthForm.tsx` (signup+login); re-skin `/login` to the MGA form (deleted old `LoginForm.tsx`). Pending token rides the httpOnly cookie, not the URL.
- [x] **T2.4** `/vault` unauthenticated redirect `/conclave/guided` → `/login`; `/login` "Create account" now → `/signup` (was Conclave). _Scoped narrowly: other pages still use `/conclave/guided` as their auth redirect; a global sweep is a separate follow-up to avoid destabilizing many flows in one slice. The deck→signup→vault flow no longer shows Conclave._
- [x] **T2.5** `tsc` exit 0, lint 0 errors, `verify:server-action-type-reexports` ✓, `test:deck-pending-intent` ✓. `npm run build` still blocked only by sandbox Google-Fonts fetch (unrelated). DB-backed manual walkthrough deferred (no `DATABASE_URL` in sandbox); signup mirrors the proven `createGuidedPlayer` open-signup path.

## Slice 3 — Vault five-move redesign + declutter

- [x] **T3.1** `VaultMoveDashboard.tsx`: added **Open Up** room (`/vault/open-up`, "Felt sense", "Receive what's getting through"); five rooms render as a non-linear set (Wake · Open · Clean · Grow · Show). Show Up room de-campaigned to "Quests" (dropped "& Invitations" + invitation count). Minimal `/vault/open-up` placeholder room ships now (read-only "what's alive" list); the felt-sense note editor is Slice 4 / FR11.
- [x] **T3.2** `src/app/vault/page.tsx`: removed from personal lobby — `VaultSummaryStrip`, Scene Atlas, `VaultCampaignInviteBars`, accepted-invitations, Forge Invitation footer, Stalls link/header copy. Kept New BAR, Capture charge, compost nudge, five-move dashboard. Removed components left in the codebase (preserved for campaign contexts).
- [x] **T3.3** Added `VaultHandButton` (opens `HandModal` in place) to the Vault lobby header.
- [x] **T3.4** FR10: deck-seeded BARs (`rootId` `deck_*`, self-claimed active `vibe`) now surface in the **Wake Up / Charges** room via shared `chargeRoomWhere`. `npm run check` → 0 errors. Manual verification pending in Slice 4's verification quest.

## Slice 4 — deck nav + verification quest

> **Open Up interaction is parked.** Per the 2026-06-24 design conversation we move at the speed of understanding; the Open Up room ships as a viewing space (already built in Slice 3) until the aperture / density→volume mechanic settles. T4.1–T4.3 below are **superseded** by the design work in `spec.md` § *Open Up / Felt Sense — Design In Progress* and are **not** to be built yet. The buildable Slice 4 work is the deck nav (T4.4) and the verification quest (T4.5–T4.6, with the Open Up step softened to "viewing").

- [ ] ~~**T4.1** Persistence decision for the felt-sense note~~ — **withdrawn**; the interaction is not a freeform note. Persisted shape (structured charge read) decided after the mechanic clicks.
- [ ] ~~**T4.2** `FeltSenseNote` model + migration~~ — **withdrawn**; likely no migration (fits `CustomBar` metadata).
- [ ] ~~**T4.3** Felt-sense note editor in `/vault/open-up`~~ — **parked**; room stays a contemplative viewing space (lists live charges, mutates nothing) until the Open Up mechanic is designed.
- [ ] **T4.0 (new)** **Design Open Up**: resolve the five open questions in `spec.md` § *Open Up / Felt Sense — Design In Progress* (gate vs amplifier, aperture derivation, density↔volume, residue, persistence shape) in conversation with the creator **before** any build.
- [ ] **T4.4** `src/app/deck/page.tsx`: add persistent Hand-modal affordance + link back to NOW (`/`).
- [ ] **T4.5** Verification quest: Twine passages (6 steps from spec) + `CustomBar` (`isSystem`, `visibility: 'public'`, id `cert-mga-deck-vault-onboarding-v1`); `scripts/seed-cert-mga-deck-vault-onboarding.ts` (idempotent) + npm script `seed:cert:mga-deck-vault-onboarding` (model on `scripts/seed-cyoa-certification-quests.ts`).
- [ ] **T4.6** Run seed; walk the verification quest end-to-end. `npm run build && npm run check`.

## Cross-cutting / done criteria
- [ ] No path ever shows "Not logged in" as a dead end on a deck card.
- [ ] Deck-card BARs skip the seed→plant→grow ceremony (created `active`, self-claimed).
- [ ] CYOA/spoke plant pipeline untouched and still building.
- [ ] `git commit` migration SQL (if any) **with** `schema.prisma`.
- [ ] Mark each task `[x]` as completed; final `npm run build` + `npm run check` green.
