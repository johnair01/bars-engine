# Plan: MtGoA Book Launch — Event Suite Landing (`/event` revamp)

## Approach

This is a **focused UI replacement** of the `/event` index page, scoped under the
[mtgoa-launch-barn-raising-party](../mtgoa-launch-barn-raising-party/spec.md)
coordinator. The event mechanics (donation wizard, barn, instance) already exist;
this work swaps the **public landing content** from the April "Birthday Quest
Weekend" to the **Book Launch suite** with two event cards and a renamed support
CTA. Content is **hardcoded** for v1 — no admin-data or AI dependency.

## Design decisions

- **Replace, don't preserve.** The Bruised Banana April content is composted; the
  page becomes the Book Launch suite. `/event/donate/wizard` and `/event/barn`
  routes are untouched.
- **Reuse the design system.** Keep `event-page` tokens, `EventHero`, and the
  `NightCard` pattern; only content/copy changes. Tailwind for layout only.
- **Hardcoded content.** Launch copy lives in the page/components, not in
  `Instance` admin fields. The admin toolbar may remain but does not drive the
  public copy.
- **Mission reframe.** "Support the Quest" → **"Support the mission"** (MTGOA
  non-profit). The barn-raising send-off is demoted to an optional teaser
  (pending Q5).
- **Brainstorm-gated content.** Structure ships first with clearly-marked
  placeholders; finalized event details (dates/venues/CTAs) fill in after the
  brainstorm resolves Q1–Q5 in the spec.

## Sequencing

1. **Spec kit + brainstorm** *(this kit)* — capture locked decisions; resolve the
   five Open Questions with the Campaign Owner. ← we are here.
2. Build the suite landing structure (hero + two event cards + "Support the
   mission" + footer) with placeholder content behind the resolved decisions.
3. Fill finalized event copy/dates/venues/CTA destinations from the brainstorm.
4. Remove Bruised-Banana-specific blocks (bingo, Fri/Sat/Sun split, subtitle).
5. Update metadata; verify `npm run build` + `npm run check`; run the cert quest.

## Open questions for the host

See **Open Questions Q1–Q5** in [spec.md](./spec.md). Summary:
- Q1/Q2: concrete details + CTA destinations for the Dance Party and the Integral
  Emergence Game.
- Q3: final umbrella tagline; is July 18 the anchor for both events?
- Q4: where "Support the mission" lands (donate wizard / on-page / external
  non-profit page).
- Q5: keep or retire the barn-raising send-off framing.
