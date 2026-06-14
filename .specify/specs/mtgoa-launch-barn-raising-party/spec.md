# Spec: MtGoA Launch + Barn Raising — July Fundraiser Party (coordinator)

> **Status: ACTIVE coordinator.** Reframes the cancelled *Bruised Banana
> Residency* into the real upcoming event. The Bruised Banana is now a **venue**,
> not a residency campaign. See reframed source specs:
> [bruised-banana-residency-ship](../bruised-banana-residency-ship/spec.md) (go-live
> loop readiness substance) and
> [bruised-banana-launch-specbar](../bruised-banana-launch-specbar/spec.md)
> (interactive onboarding kernel). This SpecBAR coordinates them — plus the public
> funnel and the playable game — toward one event.

## What This Is (Game Language)

An **emergent SpecBAR** — a kernel compressing the launch thread for a single
real-world event. **WHO** (Wendell / the Campaign Owner) hosts. **WHAT** (a
fundraiser party) is the QuestPacket made real. **WHERE** (the Bruised Banana
**venue**, Portland). **Energy** (vibeulons + real money/time/space) flows when
guests contribute. **Personal throughput** (the four moves) is taught by the
party itself: the game *is* the fundraiser.

## Purpose

Run a **July 2026 fundraiser party at the Bruised Banana** that is **two things at
once**:

1. **Mastering the Game of Allyship — Launch Party.** Public debut of the game
   (playable now at `/game`), the book (`/handbook`), and the deck — the funnel
   front door is `/pricing`.
2. **Wendell's Leaving Portland — Barn Raising.** A community send-off where
   guests contribute to help Wendell relocate.

**The ask (what the fundraiser raises for), in priority order:**
1. **Wendell's move** out of Portland (barn-raising: money / time / space / host).
2. **Launching the MtGoA game/product** (book, deck, game).
3. **Ongoing BARS Engine / allyship work** continuing after the move.

**Dual-track / Portland-facing:** the party works with **no AI** and the
community's AI allergy is respected (Core Principle: non-AI is first-class).

## Conceptual Model (WHO / WHAT / WHERE / Energy)

| Dimension | This event |
|-----------|-----------|
| WHO | Host: Wendell (Campaign Owner). Guests: Portland community, allies, backers. Segments: **player** (plays/learns) and **sponsor** (contributes). |
| WHAT | A fundraiser party = a live QuestPacket: invitation BARs → arrival → play the game → contribute → barn-raising send-off. |
| WHERE | The **Bruised Banana venue**, Portland. In-app context: an `Instance` in **event mode** (NOT the retired residency campaign). |
| Energy | Real money / time / space / host pledges (via the donation wizard) + vibeulons for in-game participation. |

## User Stories

### P1: One clear invitation
**As a** prospective guest, **I want** a single shareable invite that explains the
party is both a game launch and Wendell's send-off, **so** I know why to come and
what the ask is.
**Acceptance**: An event **invite BAR** (per [EIP](../event-invite-party-initiation/spec.md))
with a **Partiful** CTA, dated July 2026, names both framings and links to
`/pricing` (understand the offering) and `/event` (RSVP/contribute).

### P2: Understand-before-login funnel
**As a** curious visitor from the invite, **I want** to browse the book, deck, and
game before making an account, **so** I get it before I dig in.
**Acceptance**: `/pricing` (public) presents Book/Deck/Game with cross-sell;
`/game` is playable with no account; `/handbook` is readable. (Shipped — see the
public-funnel work on this branch; this story formalizes it under the event.)

### P3: Contribute three ways (the barn raising)
**As a** guest, **I want** to give money, time, space, or host help toward
Wendell's move and the launch, **so** the send-off is a community lift.
**Acceptance**: `/event/donate/wizard` (DSW) money/time/space/host branches are
live and tagged to this event's `Instance`; a fundraising milestone reflects
**completed money** contributions. In-kind (time/space) creates offer BARs
([OBT](../offer-bar-timebank-wizard-modal/spec.md)).

### P4: The party teaches the game
**As a** guest at the venue, **I want** a light, in-person way to play, **so** I
experience the loop without a lecture.
**Acceptance**: The party mini-game ([PMEL](../party-mini-game-event-layer/spec.md)
bingo) and/or the `/game` browser build are available on-site; completing either
stamps a BAR.

### P5: Go-live readiness before invites go out
**As the** host, **I want** a GO/NO-GO gate before sending invitations, **so** the
core loop is verified.
**Acceptance**: `npm run loop:ready` passes (substance from
[bruised-banana-residency-ship](../bruised-banana-residency-ship/spec.md)); prod
login/signup verified; pre-launch seeds applied.

## Functional Requirements

- **FR1 — Event identity.** An `Instance` (event mode) represents the July party
  with both framings in its copy; it is NOT the retired residency campaign.
  Branding/dates configurable (date **TBD — confirm July 2026 day**).
- **FR2 — Invite.** One invite BAR (EIP) with Partiful + both framings + funnel
  links; discoverable in Vault when the host owns the active event.
- **FR3 — Funnel linkage.** Invite + `/event` link to `/pricing`, `/game`,
  `/handbook` so guests can understand the offering pre-login.
- **FR4 — Contribution.** DSW wizard (money/time/space/host) tagged to the event;
  fundraising milestone updates on completed money donations; the "ask" copy names
  all three goals (move / launch / ongoing work).
- **FR5 — On-site play.** PMEL bingo and/or `/game` available at the venue; either
  stamps a participation BAR.
- **FR6 — Go-live gate.** `loop:ready` GO + prod auth verified + seeds applied
  before invitations are sent (manual checklist in `docs/LOOP_READINESS_CHECKLIST.md`).

## Non-goals (v1)

- The retired multi-week **residency** programming (cancelled).
- New donation/payment rails — reuse the existing DSW/honor system.
- LLM-authored invite copy (optional enhancer only; non-AI path is canonical).

## Verification Quest

`cert-mtgoa-launch-party-v1` (seed via `npm run seed:cert:cyoa` when authored):
1. Open the invite BAR → confirm both framings + Partiful CTA + July date.
2. From the invite, reach `/pricing` and `/game` logged-out (funnel works).
3. Run `/event/donate/wizard` money path → confirm fundraising milestone moves.
4. Run `npm run loop:ready` → GO.
Final passage: no link; completing mints the reward. Narrative: raising the barn
for Wendell while launching the game.

## Cross-links

- Reframed sources: [bruised-banana-residency-ship](../bruised-banana-residency-ship/spec.md),
  [bruised-banana-launch-specbar](../bruised-banana-launch-specbar/spec.md).
- Funnel: [play-public-teaser-loop](../play-public-teaser-loop/spec.md),
  `/pricing`, `/game`, `src/lib/marketing/products.ts`.
- Event mechanics: [EIP](../event-invite-party-initiation/spec.md),
  [PMEL](../party-mini-game-event-layer/spec.md),
  [DSW](../donation-self-service-wizard/spec.md),
  [OBT](../offer-bar-timebank-wizard-modal/spec.md).
- Go-live: [go-live-integration](../go-live-integration/spec.md),
  `docs/LOOP_READINESS_CHECKLIST.md`.
- [`UI_COVENANT.md`](../../../UI_COVENANT.md).
