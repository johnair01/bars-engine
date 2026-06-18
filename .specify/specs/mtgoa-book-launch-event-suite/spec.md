# Spec: MtGoA Book Launch — Event Suite Landing (`/event` revamp)

> **Scope.** This is the focused **public landing** spec for the `/event` page. It
> sits under the active coordinator
> [mtgoa-launch-barn-raising-party](../mtgoa-launch-barn-raising-party/spec.md)
> and **evolves** its framing in two ways the Campaign Owner has decided:
> 1. The umbrella is **"Mastering the Game of Allyship Book Launch"** (a *suite*
>    of events), not a single party.
> 2. The fundraiser **mission** is the **MTGOA non-profit** (Mastering the Game
>    of Allyship, currently in **pre-production**). The ask, in priority order,
>    is **(1) replace the car that exploded**, **(2) launch the products
>    (book/deck/game)** — both **in support of the non-profit**. This reframes
>    the coordinator's earlier "Wendell's move out of Portland" as the #1 ask.
>    The barn-raising send-off survives only as a **secondary teaser**.
>
> The current `/event` page is the **Bruised Banana — Birthday Quest Weekend**
> (April 3–5, 2026). This spec **replaces** that content.

## Purpose

Revamp `/event` from the April "Birthday Quest Weekend" into the public landing
page for the **Mastering the Game of Allyship Book Launch** — a suite anchored on
the **July 18, 2026 virtual book launch** and hosting two in-person events at the
Bruised Banana: a **Dance Party Fundraiser** (July 20) and an **Integral
Emergence Game** (July 21). All contributions support the **MTGOA non-profit**
(in pre-production) — the headline ask is **replacing the car that exploded**,
then **launching the products**.

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
| **Mission + ask** | Beneficiary is the **MTGOA non-profit** (pre-production). Ask priority: **(1) replace the exploded car**, **(2) launch the products** — both in support of the non-profit. "Support the mission" routes to **`/event/donate/wizard`**. |
| **Events in the suite** | **July 18** — virtual book launch (anchor). **July 20, 8 PM @ Bruised Banana** — Dance Party Fundraiser (public; suggested donation; on-page RSVP + donate wizard; Partiful page incoming). **July 21, 2 PM @ Bruised Banana** — Integral Emergence Game. |
| **Anchor date** | **July 18, 2026** is the **virtual book launch**; the two in-person events follow on July 20 & 21. |
| **Public access (no login)** | **All suite/event pages are fully readable logged-out.** Login is required only to **RSVP in-app** and unlock goodies. "Find out about stuff" never requires an account. |
| **Barn-raising** | Survives as a **secondary, well-stewarded teaser** only — not the headline. |
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
   anchor (**July 18 virtual launch**) + primary CTA.
2. **The Events** — three moments, two of them `NightCard`-style cards:
   - **July 18 · Virtual Book Launch** (anchor moment).
   - **July 20 · 8 PM · Dance Party Fundraiser** — Bruised Banana; public;
     suggested donation; **on-page RSVP + donate wizard**; Partiful (incoming).
   - **July 21 · 2 PM · Integral Emergence Game** — Bruised Banana.
3. **Support the mission** — MTGOA non-profit ask (renamed from "Support the
   Quest"); names the car-replacement (#1) + product launch (#2); routes to
   `/event/donate/wizard`.
4. **(Secondary) Barn-raising teaser** — well-stewarded send-off framing,
   subordinate to the mission ask.
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
- **FR3** — Rename the support section + CTA to **"Support the mission"**, name
  the two-part ask (replace the car #1, launch the products #2, in support of the
  non-profit), and route the CTA to **`/event/donate/wizard`**.
- **FR4** — Remove Bruised-Banana-specific blocks (bingo mini-games, April
  Fri/Sat/Sun split, "Birthday Quest Weekend") from the public view.
- **FR5** — Footer deep-links updated to the events; logged-in/out states
  preserved.
- **FR6** — Page metadata (`title`, `description`) updated to the Book Launch.
- **FR7 — Public, no-login access.** `/event` and the suite/event pages render
  fully **logged-out**; nothing about "finding out" is gated. Login is requested
  **only** at the point of in-app RSVP / unlocking goodies, and that prompt is
  framed as an upgrade, not a wall. The Dance Party card offers a logged-out
  **on-page RSVP** path in addition to in-app RSVP.

### Phase 2 (brainstorm output → fill content)
- **FR8** — Drop in the Partiful URL for the Dance Party when available; finalize
  hero tagline and the Emergence Game one-line description.

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
  3. Confirm the support section + CTA read **"Support the mission"**, name the
     car-replacement + product-launch ask, and route to `/event/donate/wizard`.
  4. **Logged-out**: confirm `/event` and each linked event surface render fully
     without an account; the only login prompt is at in-app RSVP / goodies, and
     it reads as an upgrade, not a wall.
  5. `npm run build` and `npm run check` pass.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/)

## Resolved Decisions (from brainstorm 2026-06-18)

- **Q1 (Dance Party)** ✓ — **July 20, 8 PM, Bruised Banana. Public; suggested
  donation. On-page RSVP + donate wizard. Partiful page incoming.**
- **Q2 (Emergence Game)** ✓ — **July 21, 2 PM, Bruised Banana.** One-line
  description pending final wording (see Still Open).
- **Q3 (Umbrella)** ✓ — **July 18 is the virtual book launch** (the anchor); the
  in-person events are July 20 & 21. Hero tagline pending (see Still Open).
- **Q4 (Mission destination)** ✓ — **`/event/donate/wizard`.** Note: folding the
  `/event/barn` milestone into the wizard is desired **but out of scope for now**
  (future spec).
- **Q5 (Barn-raising)** ✓ — **Secondary, well-stewarded teaser**, not the
  headline.
- **Ask reframe** ✓ — #1 **replace the exploded car**, #2 **launch the
  products**, both **for the MTGOA non-profit (pre-production)**. (Supersedes the
  coordinator's "Wendell's move" as #1.)
- **Public access** ✓ — **All pages readable logged-out**; login only gates
  in-app RSVP + goodies.

### Still Open (content polish, non-blocking)

- Final **hero tagline/subtitle**.
- One-line **"what is the Integral Emergence Game"** description (newcomer-safe,
  voice-appropriate).
- **Partiful URL** for the Dance Party (drop in when live).
- Emergence Game **capacity / invite cap**, if any.

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
