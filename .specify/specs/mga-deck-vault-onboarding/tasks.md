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

- [ ] **T3.1** `VaultMoveDashboard.tsx`: add **Open Up** room (`/vault/open-up`, "Felt sense", "Receive what's getting through"); render five rooms as a non-linear set; align move colors with `card-tokens`.
- [ ] **T3.2** `src/app/vault/page.tsx`: remove from personal lobby — `VaultSummaryStrip`, Scene Atlas, `VaultCampaignInviteBars`, accepted-invitations, Forge Invitation footer, Stalls link. Keep New BAR, Hand glance, five-move dashboard. **Do not delete** the removed components.
- [ ] **T3.3** Ensure Hand modal is openable from the Vault lobby.
- [ ] **T3.4** `npm run build && npm run check`. Manual: five navigable rooms; clutter gone; deck-seeded BARs visible; campaign components still compile.

## Slice 4 — Open Up room + deck nav + verification quest

- [ ] **T4.1** **Persistence decision**: confirm whether an existing note/journal field on `CustomBar`/collection-journal can hold the felt-sense note. Record the decision in `spec.md` § Persisted data.
- [ ] **T4.2** *(only if no field fits)* Add `FeltSenseNote` model → `npx prisma migrate dev --name felt_sense_note` → commit `prisma/migrations/…` with `schema.prisma` → `npm run db:sync` → `npm run db:record-schema-hash`.
- [ ] **T4.3** Add `src/app/vault/open-up/page.tsx`: list captured charges/BARs; felt-sense note editor (emotion/body/points-at); saving must **not** mutate BAR status/maturity.
- [ ] **T4.4** `src/app/deck/page.tsx`: add persistent Hand-modal affordance + link back to NOW (`/`).
- [ ] **T4.5** Verification quest: Twine passages (6 steps from spec) + `CustomBar` (`isSystem`, `visibility: 'public'`, id `cert-mga-deck-vault-onboarding-v1`); `scripts/seed-cert-mga-deck-vault-onboarding.ts` (idempotent) + npm script `seed:cert:mga-deck-vault-onboarding` (model on `scripts/seed-cyoa-certification-quests.ts`).
- [ ] **T4.6** Run seed; walk the verification quest end-to-end. `npm run build && npm run check`.

## Cross-cutting / done criteria
- [ ] No path ever shows "Not logged in" as a dead end on a deck card.
- [ ] Deck-card BARs skip the seed→plant→grow ceremony (created `active`, self-claimed).
- [ ] CYOA/spoke plant pipeline untouched and still building.
- [ ] `git commit` migration SQL (if any) **with** `schema.prisma`.
- [ ] Mark each task `[x]` as completed; final `npm run build` + `npm run check` green.
