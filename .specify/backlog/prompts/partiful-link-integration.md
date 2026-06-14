# Backlog Prompt — PARV: Partiful link integration (July 18 party invite)

**ID:** PARV · **Priority:** 1.00.1 · **Status:** Ready
**Parent:** [1.00 MLBR — MtGoA Launch + Barn Raising](../specs/mtgoa-launch-barn-raising-party/spec.md)
**Event:** July 18, 2026 · Bruised Banana venue

## Goal

Wire the **Partiful** event URL into the app so the July party's RSVP flow is
one tap from every public surface, reusing the existing event-invite plumbing
(no new schema).

## What exists to reuse

- `CustomBar.partifulUrl` + `eventSlug` — the EIP
  ([event-invite-party-initiation](../specs/event-invite-party-initiation/spec.md))
  invite-BAR fields. The Partiful URL already has a home; this item is about
  populating + surfacing it for the July event.
- `/event` hub + invite discovery (Vault section when host owns the active event).
- The public funnel: `/pricing`, `/game`, `/handbook`.

## Scope

1. **Capture the Partiful URL** for the July 18 event (host provides; store on the
   event invite BAR's `partifulUrl` + set `eventSlug`).
2. **Surface RSVP CTA** ("RSVP on Partiful →", opens in new tab, `rel="noopener"`)
   on: the invite BAR, `/event` for this Instance, and a compact mention in the
   `/pricing` event teaser.
3. **Deep-link safe**: external link, 44px+ target, honest label; no auth required
   to view the RSVP CTA.
4. **Non-AI**, dual-track: works as a plain link regardless of model availability.

## Acceptance

- [ ] Host's Partiful URL stored on the July invite BAR (`partifulUrl` + `eventSlug`).
- [ ] RSVP CTA visible on invite BAR, `/event` (this Instance), and `/pricing` teaser.
- [ ] Link opens Partiful in a new tab, `rel="noopener noreferrer"`, ≥44px target.
- [ ] No regression to existing EIP invite rendering; `npm run check` passes.

## Open input needed from host

- The **Partiful event URL** (and confirm `eventSlug`).

## Out of scope

- Pulling RSVP counts back from Partiful (no API integration in v1).
- Replacing the in-app RSVP/initiation flow — Partiful complements it.
