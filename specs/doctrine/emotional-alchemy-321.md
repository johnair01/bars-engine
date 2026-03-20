# Emotional Alchemy 3-2-1 — Canonical Specification

Status: Canonical (implemented)
Implementation: `/src/app/shadow/321/Shadow321Runner.tsx`

---

## Core Invariant

3rd person → 2nd person → 1st person

This perspective shift converts projection into dialogue and dialogue into integration.
If this sequence collapses, the practice becomes journaling rather than psychotechnology.

---

## The Four Moves

1. Encounter a charged experience
2. Describe the experience as a mask (3rd person) — Face It
3. Speak to the mask (2nd person) — Talk to It
4. Allow the mask to speak from within (1st person) — Be It

---

## Tension Vector

The structural output of the 321 dialogue:

```typescript
type TensionVector = {
  maskName: string          // "The Cynic", "The Protector"
  desire: string            // what the mask wants
  desireOutcome: string     // what it gets from that
  lifeState: string         // what its life is like
  rootCause: string         // what would have to be true
  fear: string              // what it fears
  interiorVoice: string     // speaking as the mask from within
  integrationShift: string  // what shifts when held consciously
}
```

The tension vector IS the dissatisfied emotional state made explicit.

---

## Emotional Alchemy States

**Dissatisfied**: mask + desire + fear (what was being carried)
**Transformation**: the perspective shift itself (the 321 process)
**Satisfied**: aligned action + artifact (what the charge is alchemized into)

Aligned actions: Wake Up | Clean Up | Grow Up | Show Up

---

## Artifact Types

| Artifact | When |
|---|---|
| BAR | Charge crystallized as shareable inspiration |
| Daemon | Recurring pattern named and made workable |
| Quest | Charge routed into playable action |
| Vibeulon (Fuel System) | Energy channeled to collective field |
| Witness Note | Session saved without dispatch |

---

## Privacy Model

What is captured: tension vector structure (mask, desire, fear, aligned action)
What is NOT captured: raw journal text (answers stay in client session, not transmitted as literal text)
See: `/privacy` (Sage-authored, teal frame) — page pending

---

## GM Voice Sequence

| Phase | Voice | Function |
|---|---|---|
| Face It | Shaman | Hold the space, sense the shape |
| Talk to It | Challenger | Name what's being avoided, push into stakes |
| Be It | Sage | Witness the turn, hold paradox |
| Alchemy Reveal | Integrator | Show the transformation, offer the satisfied state |

---

## Session Depth Signal (future)

Deep sessions: long answers, specific fear-naming, genuine mask identification
→ richer artifact suggestions, more specific BAR titles, stronger quest hooks

Surface sessions: short answers, generic mask name
→ standard artifact options

This is a future deftness evaluation hook. Not yet implemented.

---

## Routes

- Primary: `/shadow/321`
- Accepts: `?chargeBarId=` (prefills opening charge from a BAR), `?returnTo=` (return path)
- Former daemon route `/daemons/321-wake-up` → redirects to `/shadow/321`

---

## Backend Pipeline

Scene card answers map to existing `Metadata321` via `deriveMetadata321()`:
- `q1` ← chargeDescription
- `q3` ← lifeState
- `q5` ← rootCause
- `alignedAction` ← chosen at alchemy reveal
- `phase3.identityFreeText` ← `${maskShape} — ${maskName}`
- `phase1.identification` ← maskName
- `phase1.integration` ← integrationShift

Server actions:
- `createQuestFrom321Metadata()` — turns session into quest
- `fuelSystemFrom321()` — routes charge to collective field
- `persist321Session()` — saves session without dispatch
- `awakenDaemonFrom321()` — full 321 completion → daemon with `Shadow321Session` lineage (`source: '321_wake_up'`)
- `discoverDaemon()` — school/bar paths (optional session metadata); not the primary 321 daemon path
- BAR creation: sessionStorage handoff → `/create-bar?from321=1`
