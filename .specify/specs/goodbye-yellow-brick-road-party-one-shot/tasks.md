# Tasks: Goodbye Yellow Brick Road — Oracle party one-shot

**Spec:** [spec.md](./spec.md) · **Plan:** [plan.md](./plan.md)

## Phase 0 — Preserve the Valkyrie donor body

- [x] Identify the exact Valkyrie route/service/component files to fork or parameterize.
- [x] Confirm the new party instance uses its own slug/config and cannot overwrite Valkyrie party data.
- [x] Preserve canonical Oracle art, suit/rank/title identity, E/M/H card interaction patterns, guest join, admin auth, and dynamic override support.
- [x] Hide/defer player-authored card UI for this one-shot without deleting underlying Valkyrie capability.

## Phase 1 — Party config + theme

- [x] Add Goodbye Yellow Brick Road party metadata/config using Partiful only as external event logistics source.
- [x] Set party start to **2026-08-15 8:00 PM America/Los_Angeles (PDT)**.
- [x] Set Spicy unlock threshold to **2026-08-16 12:00 AM America/Los_Angeles (PDT)**.
- [x] Apply visual palette: deep emerald, road gold, warm cream, midnight plum.
- [x] Keep existing Oracle art unchanged.

## Phase 2 — Party interpretation data

- [x] Add party-specific interpretation JSON keyed by base Oracle card ID.
- [x] Support `goodbye.easy|medium|hard` and `spicy.easy|medium|hard`.
- [x] Add structured Emotional Alchemy metadata where generated.
- [x] Add structured achievement object with enum family: `invocation|challenge|stewardship|coordination|interface|legacy`.
- [x] Add Hard metadata (`requiresBar`).
- [x] Generate broad first-pass readings for the full playable corpus.
- [x] Define 12 curated Oracle GM slots for 8:00–11:40 PM at 20-minute cadence.
- [x] Ensure host live-edit flow can patch poor readings during actual play.

## Phase 3 — Append-only game record

- [x] Add minimal `PartyGameEvent` Prisma model following existing schema conventions.
- [x] Add indexes for party chronology and party/player chronology.
- [x] Add event helpers/actions for `hand_dealt`, `card_drawn`, `card_discarded`, `card_played`, `card_completed`, `gm_card_unlocked`, `gm_card_featured`, `achievement_unlocked`, `bar_donated`, `bar_capture_pending`, `spicy_unlocked`, and `host_override` as needed.
- [x] Keep payload JSON sufficient to reconstruct selected lens/depth and reference originating play events.
- [x] Do **not** add separate Hand/Board/Achievement tables unless projection proves insufficient.

## Phase 4 — Three-card personal hand

- [x] Before 8 PM: browse is available but no hand exists.
- [x] At/after 8 PM: ensure joined player has exactly 3 active hand cards.
- [x] Draw only from base Oracle cards not already active/resolved in the player's current cycle.
- [x] Make browsing unrelated to hand-cycle resolution.
- [x] `Discard` resolves card for current cycle and immediately draws replacement.
- [x] `Play` resolves card for current cycle, emits board play, and immediately draws replacement.
- [x] Prevent same base Oracle card from reappearing before full player cycle exhaustion.
- [x] Reset/increment player cycle only after the full corpus has been resolved for that cycle.
- [x] Use transactions/idempotency protection to prevent rapid taps from creating duplicate resolutions or >3-card hands.

## Phase 5 — Card interaction lenses

- [x] Add `Goodbye` / `Spicy` lens toggle to reused Valkyrie card surface.
- [x] Preserve/free-toggle Easy / Medium / Hard after draw.
- [x] Before midnight, allow Spicy browsing/readings but prevent Spicy random play/draw affordance.
- [x] At/after midnight, enable Spicy random play/draw without creating a second hand.
- [x] Enforce midnight rule server-side as well as in client UI.

## Phase 6 — Shared Game Board

- [x] Add minimal board projection from game events.
- [x] Display featured GM card at top.
- [x] Display Active player plays.
- [x] Display recently Completed / `I did this` plays.
- [x] Keep multiple plays of the same base Oracle card distinct by play event/player.
- [x] Do not build draggable/spatial board UI.

## Phase 7 — Completion + achievements

- [x] Add optional `I did this` action for an Active play.
- [x] Completion emits `card_completed` referencing the original play event.
- [x] Read selected interpretation's achievement configuration.
- [x] Validate legal achievement family enum.
- [x] Emit `achievement_unlocked` once per completed play/achievement outcome.
- [x] Display achievement title/description/affordance to the player.
- [x] Communicate that active affordance is party-scoped.
- [x] Do not penalize cards left Active forever.

## Phase 8 — Timed GM Party Deck

- [x] Implement wall-clock unlock derivation from 8:00 PM PDT at 20-minute intervals through 11:40 PM.
- [x] Do not use cron/background scheduler.
- [x] Newly unlocked GM cards remain available; nothing expires/relocks.
- [x] Current featured GM card appears at board top.
- [x] Host can feature any unlocked card.
- [x] Host can unlock next GM card early.
- [x] Persist host exceptions as events so refreshes preserve them.
- [x] Do not implement pauseable timer in v1.

## Phase 9 — Hard → BAR adapter

- [x] Inspect `src/actions/bars.ts` and `src/actions/capture-bar.ts` for auth/player assumptions.
- [x] Verify whether Valkyrie-style `party_guest` Player can use an existing BAR create path without meaningful auth refactor.
- [x] If compatible, create BAR with provenance: `source`, party slug, base card ID, lens, depth, play event ID.
- [x] If incompatible or brittle, stop integration work and emit `bar_capture_pending` with intended BAR payload/provenance.
- [x] Hard completion must never fail solely because BAR creation failed.

## Phase 10 — Live edit propagation

- [x] Identify current admin mutation route/component for `PartyOracleCardOverride`.
- [x] Confirm edited party reading is returned by deck rebuild.
- [x] Confirm/implement active-party refetch (roughly 15–30 sec is acceptable) and/or immediate refetch after meaningful local mutations.
- [x] Verify a host edit becomes visible to a second client without redeploying.
- [x] Do not add websockets/realtime infrastructure.

## Phase 11 — Host controls

- [x] Reuse existing Valkyrie admin token / host authorization pattern.
- [x] Host can edit reading/copy.
- [x] Host can hide/delete inappropriate board play if needed.
- [x] Host can feature unlocked GM card.
- [x] Host can unlock next GM card early.
- [x] No generalized role/permissions UI.

## Phase 12 — Verification

- [x] Pre-party browse does not affect hand cycle.
- [x] At 7:59 PM no hand; at 8:00 PM hand has exactly 3 unique cards.
- [x] Repeated Play/Discard keeps hand at exactly 3 while drawable cards remain.
- [x] No base-card repeat within a personal cycle.
- [x] Two different players can play the same Oracle card independently.
- [x] `I did this` only completes the selected play and unlocks its configured achievement.
- [x] GM unlock simulation passes at 8:00, 8:20, 11:40.
- [x] 11:59 PM: Spicy browse yes, random Spicy play/draw no.
- [x] 12:00 AM: random Spicy play/draw yes; current hand preserved.
- [x] Hard BAR success path works when compatible.
- [x] Hard BAR fallback path works when BAR creation fails.
- [x] Live host edit propagates to second client.
- [x] Mobile layout works on common iPhone viewport with no horizontal scroll.
- [x] Project-standard checks pass (`npm run check` and current targeted tests/build equivalent).

## Launch stop conditions

- [x] If BAR integration requires broad auth changes, ship fallback instead.
- [x] If full event projection becomes complex, reduce event types before adding new tables.
- [x] If Valkyrie UI reuse is blocked by one tightly coupled surface, fork only that surface rather than rebuilding PartyApp wholesale.
- [x] Do not expand scope into bounty economy, Vibeulon economy, player-authored cards, new art, realtime infra, or generalized party framework before live play validates the one-shot.

---

## Implementation record

Shipped in one pass as a surgical extension of the Valkyrie party. Route
`/goodbye-party`, API under `/api/party/goodbye`, slug `goodbye-yellow-brick-road`.

**Reused unchanged:** canonical `public/oracle/deck.json` (art, suit, rank,
title), `PartyExperience`, `PartyParticipant` + `party_guest` `Player` identity,
`PartyOracleDiscovery`, `PartyOracleCardOverride`, the admin-token/host pattern,
and the Oracle card renderer — extracted to
`src/components/oracle/PartyCardFace.tsx` and now shared by both parties, with
Valkyrie's palette passed in so its UI is visually unchanged.

**New persistence:** one additive model, `PartyGameEvent`. No Hand, Board, or
Achievement tables — all four are projections in `src/lib/goodbye-party/events.ts`.

**Stop conditions — what actually happened:**

- BAR integration needed no auth work. A `party_guest` `Player` is already a real
  `Player`, and `getCurrentPlayer()` reads the same `bars_player_id` cookie the
  join flow sets, so a thin adapter creates the BAR directly with provenance.
  The `bar_capture_pending` fallback is implemented and tested anyway.
- Event projection stayed tractable; no event types were dropped and no tables added.
- Valkyrie UI reuse was not blocked; only the card face was extracted.
- No scope taken on bounty/Vibeulon economy, player-authored cards, new art,
  realtime infra, or a generalized party framework.

**Verification actually run** (not merely designed for):

- `npm run check` — exit 0 (prisma generate, build-reliability verifiers, eslint, tsc).
- `npm run test:goodbye-party` — 21 projection + time-gate assertions.
- `npx tsx scripts/smoke-goodbye-party.ts` against a real Postgres — 32
  assertions covering the 8 PM deal, play/discard replenishment, a full 52-card
  no-repeat cycle with the deck coming back around, concurrent double-tap
  (exactly one resolution, hand stays at 3), the server-side midnight gate at
  11:59 and 12:00, completion → achievement, Hard → BAR with provenance, the
  forced BAR-failure fallback, GM unlock at 8:00/8:40/11:40, host feature and
  early unlock, host hide, and per-lens live card edits that merge rather than
  clobber.
- HTTP layer against `next dev` + Postgres: guest join with no signup, cookie
  identity, pre-8 PM play refused, host token required, live host edit visible to
  a second client with no redeploy, page renders 200.
- Mobile: Chromium at 375 / 390 / 430 px — no horizontal scroll at any width, no
  undersized touch targets in this UI (the only sub-40px control is the global
  dev identity switcher, which is not present in production).

**Not verified here:** the post-8 PM path *over HTTP* with the real wall clock —
the sandbox would not permit changing the system time. The same service
functions are exercised at every time boundary by the smoke test with injected
clocks, and the routes are thin delegations proven on the pre-party path.
