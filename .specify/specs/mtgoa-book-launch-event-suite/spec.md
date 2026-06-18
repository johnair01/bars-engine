# Spec: MtGoA Book Launch — Event Suite Landing (`/event` revamp)

> **Scope.** This is the focused **public landing** spec for the `/event` page. It
> sits under the active coordinator
> [mtgoa-launch-barn-raising-party](../mtgoa-launch-barn-raising-party/spec.md)
> and **evolves** its framing in two ways the Campaign Owner has decided:
> 1. The umbrella is **"Mastering the Game of Allyship Book Launch"** (a *suite*
>    of events), not a single party.
> 2. The fundraiser **mission** is the **MTGOA non-profit** (Mastering the Game
>    of Allyship as a non-profit), reframed from the earlier "Wendell's move /
>    barn-raising" ask. The barn-raising send-off may still appear as a teaser,
>    but the headline ask is the non-profit mission.
>
> The current `/event` page is the **Bruised Banana — Birthday Quest Weekend**
> (April 3–5, 2026). This spec **replaces** that content.

## Purpose

Revamp `/event` from the April "Birthday Quest Weekend" into the public landing
page for the **Mastering the Game of Allyship Book Launch** — a suite that hosts
two events: a **Dance Party Fundraiser** and an **Integral Emergence Game** (for
the MTGOA non-profit). All proceeds/contributions support the **MTGOA
non-profit mission**.

**Problem.** The live `/event` page advertises a past/retired April weekend with
Bruised-Banana-specific copy and mini-games. It does not represent the upcoming
Book Launch suite, and its support CTA ("Support the Quest" / "Donate") does not
name the non-profit mission.

**Practice** (UI): Deftness Development — spec kit first; reuse the existing
`event-page` design system and `NightCard`/`EventHero` components; deterministic
hardcoded content for v1 (no admin-data dependency, no AI). Read
[`UI_COVENANT.md`](../../../UI_COVENANT.md) before writing UI.

## Design Decisions (locked with Campaign Owner)

| Topic | Decision |
|-------|----------|
| **Content source (v1)** | **Hardcoded** content in the page/components. No dependency on `Instance` admin fields or AI generation for the launch copy. (Admin toolbar may remain for power users but is not the source of the public copy.) |
| **Page identity** | **Replace** the existing `/event` (Bruised Banana Birthday Quest Weekend) with the **Book Launch suite** landing. The April content is composted, not preserved as a fallback. |
| **Umbrella framing** | **"Mastering the Game of Allyship Book Launch"** — a *suite* hosting multiple events. |
| **Support CTA copy** | User-facing support copy becomes **"Support the mission"** (replaces "Support the Quest" / generic "Donate" labels on the public page). |
| **Mission** | The **MTGOA non-profit** (Mastering the Game of Allyship). "Support the mission" routes to the non-profit ask. *(Exact destination — donate wizard vs. external page — pending brainstorm; see Open Questions.)* |
| **Events in the suite** | (1) **Dance Party Fundraiser**, (2) **Integral Emergence Game** (for the MTGOA non-profit). Rendered as event cards in the suite. |
| **Anchor date** | Book launch anchored to **July 18, 2026** per the coordinator (`/launch`, `/event/barn` already reference it). *(Confirm whether both sub-events are that day or spread — see Open Questions.)* |
| **Dual-track / Portland** | Non-AI path is canonical; copy respects the community's AI allergy. |

## Conceptual Model (WHO / WHAT / WHERE / Energy)

| Dimension | This page |
|-----------|-----------|
| WHO | Visitor (logged-out prospective guest), guest, supporter/sponsor. Host: Wendell / Campaign Owner. |
| WHAT | A **suite landing**: umbrella hero → two event cards (Dance Party, Emergence Game) → "Support the mission" (MTGOA non-profit) → optional barn-raising teaser → footer. |
| WHERE | `/event` route. Portland venue(s) named per event. The MTGOA non-profit is the beneficiary. |
| Energy | Real money/time/space contributions toward the non-profit mission; RSVPs/attendance per event. |

## Page Structure (replaces current section order)

1. **Hero** — umbrella: "Mastering the Game of Allyship Book Launch" + tagline +
   anchor date/place + primary CTA.
2. **The Events** — two `NightCard`-style cards:
   - **Dance Party Fundraiser**
   - **Integral Emergence Game** (for the MTGOA non-profit)
3. **Support the mission** — MTGOA non-profit ask (renamed from "Support the
   Quest"); progress/goal optional.
4. **(Optional) Barn-raising teaser** — send-off framing, secondary to the
   mission ask.
5. **Footer** — deep links to each event, log in / play.

> Removed for v1: Bruised Banana party mini-game bingo blocks
> (`PartyMiniGameInModal`), April day-split (Fri/Sat/Sun) copy, "Birthday Quest
> Weekend" subtitle. The admin toolbar may be retained but is out of scope for
> the public copy.

## User Stories

### P1: Understand the suite at a glance
**As a** prospective guest, **I want** the `/event` page to clearly present the
Book Launch and its two events, **so** I know what's happening and why.
**Acceptance**: Hero reads "Mastering the Game of Allyship Book Launch"; two
event cards (Dance Party Fundraiser, Integral Emergence Game) are visible with
date/place/description and a primary CTA each.

### P2: Support the mission
**As a** supporter, **I want** a clear **"Support the mission"** action, **so** I
can contribute to the MTGOA non-profit.
**Acceptance**: The support section header and CTA read "Support the mission" (no
"Quest"/bare "Donate" on the public page); the CTA routes to the agreed
destination (Open Question Q4).

### P3: Pick an event and act
**As a** guest, **I want** each event card to have a clear next step, **so** I can
RSVP/learn more.
**Acceptance**: Each card's primary CTA links to its agreed destination
(RSVP/invite story/donate); no dead links; degrades gracefully with no account.

## Functional Requirements

### Phase 1: Replace `/event` with the suite landing (hardcoded)
- **FR1** — Hero shows umbrella title, tagline, anchor date/place, primary CTA.
- **FR2** — Render two hardcoded event cards (Dance Party Fundraiser; Integral
  Emergence Game) using the existing `event-page` design tokens / `NightCard`
  pattern.
- **FR3** — Rename the support section + CTA to **"Support the mission"** and
  point it at the MTGOA non-profit destination (Q4).
- **FR4** — Remove Bruised-Banana-specific blocks (bingo mini-games, April
  Fri/Sat/Sun split, "Birthday Quest Weekend") from the public view.
- **FR5** — Footer deep-links updated to the two events; logged-in/out states
  preserved.
- **FR6** — Page metadata (`title`, `description`) updated to the Book Launch.

### Phase 2 (brainstorm output → fill content)
- **FR7** — Replace placeholder content with finalized event copy, dates,
  venues, and CTA destinations decided in brainstorming.

## Non-Functional Requirements

- Reuse existing `src/styles` event-page tokens; Tailwind for layout only
  (UI_COVENANT three-channel system).
- No new env, no AI calls, no schema changes (hardcoded content).
- Logged-out renders fully (public funnel); no account required to read.
- Backward compatibility: keep the `/event/donate/wizard` and `/event/barn`
  routes working; only the `/event` index content changes.

## Persisted data & Prisma

**No schema changes.** Content is hardcoded. (If a later phase wants
admin-editable suite content, that becomes a separate spec.)

## Verification Quest (UX feature)

- **ID**: `cert-mtgoa-book-launch-event-suite-v1`
- **Steps**:
  1. Visit `/event` logged-out → hero reads "Mastering the Game of Allyship Book
     Launch"; no "Birthday Quest Weekend" copy remains.
  2. Confirm two event cards (Dance Party Fundraiser, Integral Emergence Game)
     render with date/place/description + a working primary CTA each.
  3. Confirm the support section + CTA read **"Support the mission"** and route
     to the MTGOA non-profit destination.
  4. `npm run build` and `npm run check` pass.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/)

## Open Questions (to resolve in brainstorming)

- **Q1 (Dance Party)** — date / time / venue / public-or-invite / price-or-
  donation / primary CTA destination.
- **Q2 (Emergence Game)** — date / time / venue / capacity / one-sentence "what
  is the integral emergence game" / primary CTA destination.
- **Q3 (Umbrella)** — final hero tagline/subtitle; is July 18 the anchor for
  both events or just the launch?
- **Q4 (Mission destination)** — where does "Support the mission" land:
  `/event/donate/wizard`, the revamped `/event` itself, or an external MTGOA
  non-profit page?
- **Q5 (Barn-raising)** — keep the "Wendell's send-off" framing as a secondary
  teaser, or fully retire it in favor of the non-profit mission?

## Dependencies

- Coordinator: [mtgoa-launch-barn-raising-party](../mtgoa-launch-barn-raising-party/spec.md)
- Donation: [donation-self-service-wizard](../donation-self-service-wizard/spec.md),
  [event-donation-honor-system](../event-donation-honor-system/spec.md)
- Funnel: [play-public-teaser-loop](../play-public-teaser-loop/spec.md)

## References

- Page: `src/app/event/page.tsx`, `src/app/event/EventHero.tsx`,
  `src/app/event/NightCard.tsx`, `src/app/event/WhatToExpect.tsx`,
  `src/app/event/HowItWorks.tsx`
- Routes preserved: `src/app/event/donate/wizard/page.tsx`, `src/app/event/barn/page.tsx`
- [`UI_COVENANT.md`](../../../UI_COVENANT.md), `src/styles/` event-page tokens
