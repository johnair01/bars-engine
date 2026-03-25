# Tasks: Clothing swap hybrid fundraiser event

## Spec kit

- [x] `spec.md` (incl. six-face synthesis, API draft, verification quest)
- [x] `plan.md`
- [x] `tasks.md`
- [x] Register in [BACKLOG.md](../../backlog/BACKLOG.md) (row **CSHE**)
- [x] After BACKLOG edit: `npm run backlog:seed`
- [x] Backlog prompt: [clothing-swap-fundraiser-hybrid-event.md](../../backlog/prompts/clothing-swap-fundraiser-hybrid-event.md)

## Phase 0 — Decisions

- [x] **Locked:** Pre-prod campaign **produces** event (sub-campaign); **exportable event type** for other instances (`spec.md` § Event campaign model).
- [x] **Locked:** **Single listing pool** (hybrid one gallery).
- [x] **Locked:** **Fixed-time auction** — **`eventClosesAt`** (event-wide for MVP); settlement per listing; losing holds released.
- [x] **Locked:** **Bruised Banana Residency** surfaces swap in **available events**.
- [x] **Locked:** **BAR offers** — seller **accept** required to win; if not accepted by close, **vibeulon** wins; offers may be large / service-scale BARs.
- [x] **Locked:** **Co-hosts** = full **Players** only for MVP; email-only co-host **deferred**.
- [x] Vibeulon rules locked — § **MVP vibeulon auction parameters** in `spec.md` (opening min, +1 increment, hold lifecycle, retract before close).
- [x] BAR accept — **strict** at `eventClosesAt` (no grace); API + resolved table updated.
- [x] Legal — **host-owned** disclaimer + optional template; `FR-A4` intake fields.
- [x] Partiful copy — [docs/events/clothing-swap-bb-residency-partiful-copy.md](../../../docs/events/clothing-swap-bb-residency-partiful-copy.md) (replace placeholders before publish).

## Phase A — Container & roles

- [x] Schema + migration: `Instance.swapEventIntake`, `swapEventIntakePublishedAt`; migration `20260324200000_add_swap_event_intake_phase_a`
- [x] Organizer UI: `/swap-organizer/[slug]` + admin Instances **Swap intake** link; publish gate + team roles (`swap_event_*` on `InstanceMembership`)
- [x] Server actions + permissions: `src/actions/swap-event.ts`, `src/lib/swap-event-permissions.ts` (co-host edits intake, host/admin publish & assign roles)

## Phase B — Orientation & invites

- [x] Orientation adventure: branch new vs returning (document predicate in code + spec appendix)
- [x] Seed invitation BAR + document public URL pattern
- [x] RSVP-only path + storage; defer full onboarding flag
- [x] “Join full game” organizer invite (reuse GP-INV patterns where possible)

## Phase C — Listings & gallery

- [x] Listing create action: photos + BAR + brand/size/condition
- [x] Event-scoped gallery with pagination
- [x] Host/co-host moderation (hide/archive)

## Phase D — Bidding

- [ ] **`eventClosesAt`** on event; reject vibeulon bids at/after close; idempotent per-listing settlement
- [ ] Vibeulon hold + settle + release (transactional); **`retractVibeulonBid`** + bid history for next-highest; **BAR accepted** path releases holds without awarding item to high bidder
- [ ] BAR offer + **`acceptBarOfferForListing` / `rejectBarOfferForListing`** (listing owner only); seller UI for pending offers
- [ ] Document v1 fulfillment rule (pickup-only vs deferred shipping)

## Phase E — Fundraising & external

- [ ] Start + end donation CTAs (scheduled or manual trigger for MVP)
- [ ] “Not attending” donate + learn more block
- [ ] OG / share meta on event landing

## Phase F — Calendar

- [ ] `.ics` for swap event (+ optional reminder entries)
- [ ] User-facing “Add to calendar” on event page

## Phase G — Campaign surfacing

- [ ] Show event in campaign available-events list (`campaignRef` / instance wiring)

## Phase H — Pre-production subquests

- [ ] Event-scoped BAR/quest creation UI + list on event hub

## Verification quest

- [ ] `cert-clothing-swap-hybrid-event-v1` story + seed + npm script

## Final

- [x] `npm run check` / `npm run build` (after Phase B schema + routes)
- [x] Phase 0 / product open decisions closed in `spec.md` (future-only items remain under **Open decisions (optional later)**).
