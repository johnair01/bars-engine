# Tasks: Goodbye Yellow Brick Road — Oracle party one-shot

**Spec:** [spec.md](./spec.md) · **Plan:** [plan.md](./plan.md)

## Phase 0 — Preserve the Valkyrie donor body

- [ ] Identify the exact Valkyrie route/service/component files to fork or parameterize.
- [ ] Confirm the new party instance uses its own slug/config and cannot overwrite Valkyrie party data.
- [ ] Preserve canonical Oracle art, suit/rank/title identity, E/M/H card interaction patterns, guest join, admin auth, and dynamic override support.
- [ ] Hide/defer player-authored card UI for this one-shot without deleting underlying Valkyrie capability.

## Phase 1 — Party config + theme

- [ ] Add Goodbye Yellow Brick Road party metadata/config using Partiful only as external event logistics source.
- [ ] Set party start to **2026-08-15 8:00 PM America/Los_Angeles (PDT)**.
- [ ] Set Spicy unlock threshold to **2026-08-16 12:00 AM America/Los_Angeles (PDT)**.
- [ ] Apply visual palette: deep emerald, road gold, warm cream, midnight plum.
- [ ] Keep existing Oracle art unchanged.

## Phase 2 — Party interpretation data

- [ ] Add party-specific interpretation JSON keyed by base Oracle card ID.
- [ ] Support `goodbye.easy|medium|hard` and `spicy.easy|medium|hard`.
- [ ] Add structured Emotional Alchemy metadata where generated.
- [ ] Add structured achievement object with enum family: `invocation|challenge|stewardship|coordination|interface|legacy`.
- [ ] Add Hard metadata (`requiresBar`).
- [ ] Generate broad first-pass readings for the full playable corpus.
- [ ] Define 12 curated Oracle GM slots for 8:00–11:40 PM at 20-minute cadence.
- [ ] Ensure host live-edit flow can patch poor readings during actual play.

## Phase 3 — Append-only game record

- [ ] Add minimal `PartyGameEvent` Prisma model following existing schema conventions.
- [ ] Add indexes for party chronology and party/player chronology.
- [ ] Add event helpers/actions for `hand_dealt`, `card_drawn`, `card_discarded`, `card_played`, `card_completed`, `gm_card_unlocked`, `gm_card_featured`, `achievement_unlocked`, `bar_donated`, `bar_capture_pending`, `spicy_unlocked`, and `host_override` as needed.
- [ ] Keep payload JSON sufficient to reconstruct selected lens/depth and reference originating play events.
- [ ] Do **not** add separate Hand/Board/Achievement tables unless projection proves insufficient.

## Phase 4 — Three-card personal hand

- [ ] Before 8 PM: browse is available but no hand exists.
- [ ] At/after 8 PM: ensure joined player has exactly 3 active hand cards.
- [ ] Draw only from base Oracle cards not already active/resolved in the player's current cycle.
- [ ] Make browsing unrelated to hand-cycle resolution.
- [ ] `Discard` resolves card for current cycle and immediately draws replacement.
- [ ] `Play` resolves card for current cycle, emits board play, and immediately draws replacement.
- [ ] Prevent same base Oracle card from reappearing before full player cycle exhaustion.
- [ ] Reset/increment player cycle only after the full corpus has been resolved for that cycle.
- [ ] Use transactions/idempotency protection to prevent rapid taps from creating duplicate resolutions or >3-card hands.

## Phase 5 — Card interaction lenses

- [ ] Add `Goodbye` / `Spicy` lens toggle to reused Valkyrie card surface.
- [ ] Preserve/free-toggle Easy / Medium / Hard after draw.
- [ ] Before midnight, allow Spicy browsing/readings but prevent Spicy random play/draw affordance.
- [ ] At/after midnight, enable Spicy random play/draw without creating a second hand.
- [ ] Enforce midnight rule server-side as well as in client UI.

## Phase 6 — Shared Game Board

- [ ] Add minimal board projection from game events.
- [ ] Display featured GM card at top.
- [ ] Display Active player plays.
- [ ] Display recently Completed / `I did this` plays.
- [ ] Keep multiple plays of the same base Oracle card distinct by play event/player.
- [ ] Do not build draggable/spatial board UI.

## Phase 7 — Completion + achievements

- [ ] Add optional `I did this` action for an Active play.
- [ ] Completion emits `card_completed` referencing the original play event.
- [ ] Read selected interpretation's achievement configuration.
- [ ] Validate legal achievement family enum.
- [ ] Emit `achievement_unlocked` once per completed play/achievement outcome.
- [ ] Display achievement title/description/affordance to the player.
- [ ] Communicate that active affordance is party-scoped.
- [ ] Do not penalize cards left Active forever.

## Phase 8 — Timed GM Party Deck

- [ ] Implement wall-clock unlock derivation from 8:00 PM PDT at 20-minute intervals through 11:40 PM.
- [ ] Do not use cron/background scheduler.
- [ ] Newly unlocked GM cards remain available; nothing expires/relocks.
- [ ] Current featured GM card appears at board top.
- [ ] Host can feature any unlocked card.
- [ ] Host can unlock next GM card early.
- [ ] Persist host exceptions as events so refreshes preserve them.
- [ ] Do not implement pauseable timer in v1.

## Phase 9 — Hard → BAR adapter

- [ ] Inspect `src/actions/bars.ts` and `src/actions/capture-bar.ts` for auth/player assumptions.
- [ ] Verify whether Valkyrie-style `party_guest` Player can use an existing BAR create path without meaningful auth refactor.
- [ ] If compatible, create BAR with provenance: `source`, party slug, base card ID, lens, depth, play event ID.
- [ ] If incompatible or brittle, stop integration work and emit `bar_capture_pending` with intended BAR payload/provenance.
- [ ] Hard completion must never fail solely because BAR creation failed.

## Phase 10 — Live edit propagation

- [ ] Identify current admin mutation route/component for `PartyOracleCardOverride`.
- [ ] Confirm edited party reading is returned by deck rebuild.
- [ ] Confirm/implement active-party refetch (roughly 15–30 sec is acceptable) and/or immediate refetch after meaningful local mutations.
- [ ] Verify a host edit becomes visible to a second client without redeploying.
- [ ] Do not add websockets/realtime infrastructure.

## Phase 11 — Host controls

- [ ] Reuse existing Valkyrie admin token / host authorization pattern.
- [ ] Host can edit reading/copy.
- [ ] Host can hide/delete inappropriate board play if needed.
- [ ] Host can feature unlocked GM card.
- [ ] Host can unlock next GM card early.
- [ ] No generalized role/permissions UI.

## Phase 12 — Verification

- [ ] Pre-party browse does not affect hand cycle.
- [ ] At 7:59 PM no hand; at 8:00 PM hand has exactly 3 unique cards.
- [ ] Repeated Play/Discard keeps hand at exactly 3 while drawable cards remain.
- [ ] No base-card repeat within a personal cycle.
- [ ] Two different players can play the same Oracle card independently.
- [ ] `I did this` only completes the selected play and unlocks its configured achievement.
- [ ] GM unlock simulation passes at 8:00, 8:20, 11:40.
- [ ] 11:59 PM: Spicy browse yes, random Spicy play/draw no.
- [ ] 12:00 AM: random Spicy play/draw yes; current hand preserved.
- [ ] Hard BAR success path works when compatible.
- [ ] Hard BAR fallback path works when BAR creation fails.
- [ ] Live host edit propagates to second client.
- [ ] Mobile layout works on common iPhone viewport with no horizontal scroll.
- [ ] Project-standard checks pass (`npm run check` and current targeted tests/build equivalent).

## Launch stop conditions

- [ ] If BAR integration requires broad auth changes, ship fallback instead.
- [ ] If full event projection becomes complex, reduce event types before adding new tables.
- [ ] If Valkyrie UI reuse is blocked by one tightly coupled surface, fork only that surface rather than rebuilding PartyApp wholesale.
- [ ] Do not expand scope into bounty economy, Vibeulon economy, player-authored cards, new art, realtime infra, or generalized party framework before live play validates the one-shot.
