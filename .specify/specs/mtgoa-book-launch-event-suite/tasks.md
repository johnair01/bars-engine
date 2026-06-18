# Tasks: MtGoA Book Launch — Event Suite Landing (`/event` revamp)

> Status: `[ ]` todo · `[x]` done · `[~]` superseded.

## Phase 0: Spec + brainstorm

- [x] Author this spec kit (spec.md / plan.md / tasks.md).
- [x] Brainstorm with Campaign Owner → resolved Q1–Q5 + ask reframe + public
      access (see spec § Resolved Decisions).
- [ ] Add a BACKLOG row for this spec and run `npm run backlog:seed`.
- [ ] **Follow-up (separate spec):** update the
      [coordinator](../mtgoa-launch-barn-raising-party/spec.md) so its #1 ask is
      **replace the car** (not "Wendell's move") and beneficiary is the
      non-profit; note folding `/event/barn` into the donate wizard.

## Phase 1: Suite landing structure (hardcoded, behind resolved decisions)

- [ ] Repoint `EventHero` to the Book Launch umbrella (title/subtitle/tagline/
      anchor date/place + primary CTA). Read `UI_COVENANT.md` first.
- [ ] Replace the April "Weekend" section with **The Events**: July 18 virtual
      launch anchor + two cards — **Dance Party Fundraiser** (Jul 20, 8 PM) +
      **Integral Emergence Game** (Jul 21, 2 PM) at the Bruised Banana
      (NightCard pattern).
- [ ] Rename support section header + CTA to **"Support the mission"**; name the
      ask (replace car #1, launch products #2, for the non-profit); route to
      `/event/donate/wizard`.
- [ ] Remove Bruised-Banana-specific blocks: `PartyMiniGameInModal` bingo,
      Fri/Sat/Sun split, "Birthday Quest Weekend" subtitle.
- [ ] Update footer deep-links to the events; preserve logged-in/out states.
- [ ] Update page `metadata` (title/description) to the Book Launch.
- [ ] **Public, no-login:** verify `/event` + linked surfaces render logged-out;
      gate login only at in-app RSVP / goodies (framed as upgrade). Dance Party
      card exposes a logged-out on-page RSVP path.

## Phase 2: Fill finalized content (from brainstorm)

- [ ] Drop in Partiful URL for the Dance Party when live.
- [ ] Final hero tagline/subtitle.
- [ ] Final one-line "what is the Integral Emergence Game" description.
- [ ] Emergence Game capacity/invite cap if any.

## Verification

- [ ] `npm run build` passes.
- [ ] `npm run check` (lint + type-check) passes.
- [ ] Logged-out `/event` renders the suite; both event CTAs and "Support the
      mission" resolve (no dead links).
- [ ] Author + seed `cert-mtgoa-book-launch-event-suite-v1`.
