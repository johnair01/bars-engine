# Tasks: MtGoA Book Launch — Event Suite Landing (`/event` revamp)

> Status: `[ ]` todo · `[x]` done · `[~]` superseded.

## Phase 0: Spec + brainstorm

- [x] Author this spec kit (spec.md / plan.md / tasks.md).
- [ ] Brainstorm with Campaign Owner → resolve Open Questions Q1–Q5 (event
      details, umbrella tagline, mission destination, barn-raising framing).
- [ ] Add a BACKLOG row for this spec and run `npm run backlog:seed`.

## Phase 1: Suite landing structure (hardcoded, behind resolved decisions)

- [ ] Repoint `EventHero` to the Book Launch umbrella (title/subtitle/tagline/
      anchor date/place + primary CTA). Read `UI_COVENANT.md` first.
- [ ] Replace the April "Weekend" section with **The Events**: two cards —
      **Dance Party Fundraiser** + **Integral Emergence Game** (NightCard pattern).
- [ ] Rename support section header + CTA to **"Support the mission"**; point to
      the MTGOA non-profit destination (Q4).
- [ ] Remove Bruised-Banana-specific blocks: `PartyMiniGameInModal` bingo,
      Fri/Sat/Sun split, "Birthday Quest Weekend" subtitle.
- [ ] Update footer deep-links to the two events; preserve logged-in/out states.
- [ ] Update page `metadata` (title/description) to the Book Launch.

## Phase 2: Fill finalized content (from brainstorm)

- [ ] Dance Party: date/time/venue/price-or-donation/CTA → into the card.
- [ ] Integral Emergence Game: date/time/venue/capacity/one-line description/CTA.
- [ ] Final umbrella tagline + confirmed anchor date(s).
- [ ] "Support the mission" destination wired (Q4).
- [ ] Barn-raising teaser kept or removed per Q5.

## Verification

- [ ] `npm run build` passes.
- [ ] `npm run check` (lint + type-check) passes.
- [ ] Logged-out `/event` renders the suite; both event CTAs and "Support the
      mission" resolve (no dead links).
- [ ] Author + seed `cert-mtgoa-book-launch-event-suite-v1`.
