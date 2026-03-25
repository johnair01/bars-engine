# Backlog prompt: Clothing swap hybrid fundraiser event (CSHE)

**Spec kit:** [.specify/specs/clothing-swap-fundraiser-hybrid-event/](../specs/clothing-swap-fundraiser-hybrid-event/)  
**Backlog ID:** CSHE (see BACKLOG.md)

## Objective

Implement a **hybrid (IRL + virtual) clothing swap fundraiser**: listings (photo + BAR + metadata), **single gallery**, **event-wide `eventClosesAt`**, vibeulon bids + **BAR offers** (seller **accept/reject**; if no accept by close, **highest vibeulon wins** per listing), dual orientation, invitation BAR, RSVP-light path, Partiful-first comms, calendar export, **Bruised Banana Residency → available events** — per **spec → plan → tasks** order.

## API-first order

1. Resolve **Phase 0** open decisions in `spec.md`.
2. Implement **server actions** from spec **API Contracts** (listings, bids, intake, RSVP).
3. Wire **UI** + **seeds** (invite BAR, CYOA, verification quest).
4. Add **docs/events/** Partiful copy.

## Prompt (paste for implementation agent)

> Implement per [.specify/specs/clothing-swap-fundraiser-hybrid-event/spec.md](../specs/clothing-swap-fundraiser-hybrid-event/spec.md). **API-first:** `createSwapListing`, `listSwapListings`, `placeVibeulonBid` (opening min + **+1** increment; reject at/after **`eventClosesAt`**), **`retractVibeulonBid`** (before close), `offerBarForListing`, **`acceptBarOfferForListing` / `rejectBarOfferForListing`** (owner only; **strict** cutoff), settlement at close (accepted BAR vs vibeulon per listing), `recordCampaignIntake` (include **`minOpeningBidVibeulons`** + optional disclaimer). Wire **available events** on **Bruised Banana Residency**. Follow [tasks.md](../specs/clothing-swap-fundraiser-hybrid-event/tasks.md) in order. Add verification quest `cert-clothing-swap-hybrid-event-v1`. Run `npm run build` and `npm run check` before marking phases done.

## Checklist

- [x] Phase 0 decisions recorded in spec (vibeulon MVP table, strict BAR accept, disclaimer; Partiful: `docs/events/clothing-swap-bb-residency-partiful-copy.md`)
- [ ] Migrations reviewed (bid holds, RSVP, roles)
- [ ] Partiful copy doc committed
- [ ] Verification quest seeded
- [ ] Build + check green
