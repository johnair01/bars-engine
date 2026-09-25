# Spec: Emotional Alchemy Practice Card

## Purpose

The **post-card** half of the arc: render the composer's `Recommendation` as a formed, element-coded practice, and wire `The Read → "Form the practice →"` end-to-end so a player goes charge → diagnosis → **playable rep**. This is the "formation" moment — the neutral read resolves into a `CultivationCard` with an element, an altitude, and a move.

**Problem**: Practice Atlas §10 (target 3's UX half). The composer (`recommendPractice`) is built and tested but has no surface; the diagnostic's "Form the practice →" is a disabled placeholder.

**Practice**: Deftness Development — deterministic over AI. Client-only, DB-free (deck precedent); the composer is pure and already the always-on baseline.

**Canon sources**: `docs/MTGOA_PRACTICE_ATLAS.md` v3 (§5 render, §1.5 re-rate, §1.7 Show Up), `.specify/specs/emotional-alchemy-diagnostic/DESIGN_HANDOFF.md` (post-card contract + "formation" transition), `UI_COVENANT.md` (CultivationCard, three-channel encoding). Depends on targets 1–3.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Post-card surface | `CultivationCard` (UI_COVENANT law 10 — element-coded, distinct from the pre-card diagnostic). `element = EMOTION_TO_ELEMENT[vector.channel]`, `altitude = vector.altitude`, `stage = 'growing'` |
| Submove seam (interim) | No Allyship-Deck draw is wired yet, so the player picks the WAVE move at "Form the practice" (the 5 phases, default Clean Up). This supplies the composer's `submove` + a **canonical** stance question from `MOVES` (not invented). New gap **G13**: the deck draw replaces this picker later and will also fix domain/stance |
| Re-rate (§1.5) | Client-only close: re-rate 0–10 → show the delta + the honest branch message (moved / flat / worse). No persistence (that's target 5) |
| Show Up | Render the composer's internal + external templates; external shows its gated/received-harm state per the recommendation. Selection is client-only |
| Reasoning surfaced (§8) | A "Why this tool?" disclosure shows `candidatesConsidered`, `guardsApplied`, `rolePath`, `notes` |
| No schema change | Pure client render; Prisma N/A |

## Conceptual Model

- **WHAT**: the practice card — a drawn charge, formed into an element-coded move.
- **Energy**: the pre-card→post-card threshold; the altitude channel is the honest progress meter (re-rate can lift it).
- **Personal throughput**: the picked WAVE move + the composer's tool = one playable rep.

## API Contracts

Pure helper + presentational components (no route/action):

```ts
// src/lib/emotional-alchemy/interim-card.ts
export const SUBMOVE_META: { key: WaveLens; label: string; purpose: string }[]
export function interimComposerCard(submove: WaveLens): ComposerCard   // stance question from MOVES

// src/components/practice/PracticeCard.tsx
export function PracticeCard(props: { rec: PracticeRecommendation; channel: EmotionChannel; altitude: Altitude }): JSX.Element
```

## User Stories

### P1: The charge becomes a practice
**As** a player at The Read, I want "Form the practice →" to give me a concrete tool with steps and a timebox, **so** I have something to actually do.
**Acceptance**: picking a move → an element-coded card with the tool, timebox, stance question, protocol steps + spirit step, and Show Up options.

### P2: The card is formed, not raw
**As** a player, I want the practice to visibly differ from the diagnostic — element frame/glow/color.
**Acceptance**: `CultivationCard` element = the vector channel's element; a hot charge shows the T07 grounding prepend first.

### P3: I close the loop honestly (§1.5)
**As** a player, I want to re-rate after the practice and be told the truth about the delta.
**Acceptance**: re-rate → moved/flat/worse message; nothing persisted; a worse delta suggests grounding + a different tool.

### P4: Verification quest
`cert-emotional-alchemy-practice-card-v1` walks diagnose → form → pick move → formed card → Show Up → re-rate.

## Functional Requirements

- **FR1**: `interim-card.ts` — `SUBMOVE_META` from `MOVES`; `interimComposerCard(submove)` returns `{ submove, stanceQuestion: MOVES[submove].question }`.
- **FR2**: `PracticeCard` renders a `PracticeRecommendation` in a `CultivationCard` (element/altitude/stage), tool name via `getToolById`, the T07 prepend when present, the bridged/banked note, stance question, protocol steps (spirit step distinct), Show Up internal/external with gated state, and the "Why this tool?" disclosure.
- **FR3**: `DiagnoseClient` gains `forming` (submove picker) and `practice` states; "Form the practice →" → compose → route crisis/capture kinds to their end states, else render `PracticeCard`.
- **FR4**: Re-rate close (client-only) with the §1.5 branch message.
- **FR5**: Covenant compliance — element via `ELEMENT_TOKENS`/`EMOTION_TO_ELEMENT` (no hex in components), 44px targets, AA, `prefers-reduced-motion`.
- **FR6**: pure test for `interimComposerCard`; added to `vitest.config.ts`.

## Non-Functional Requirements
- Client-only, DB-free; additive. `npm run check` + vitest green; route builds + serves.

## Persisted data & Prisma
N/A. (Session/Show-Up persistence is target 5.)

## Verification Quest (required — UX)
- **ID**: `cert-emotional-alchemy-practice-card-v1` (`scripts/seed-cert-emotional-alchemy-practice-card.ts`, go-deeper pattern; deterministic id; idempotent; `npm run seed:cert:emotional-alchemy-practice-card`). Framed toward the Bruised Banana Fundraiser.
- **Steps**: diagnose a charge → The Read → Form the practice → pick a move → the card forms (element frame/glow) → protocol + spirit step present → pick a Show Up option → re-rate shows a delta → confirm nothing persisted.

## Dependencies
- targets 1–3 (`src/lib/emotional-alchemy/`), `src/components/ui/CultivationCard.tsx`, `src/lib/ui/card-tokens.ts`, `src/lib/allyship-deck/move-library.ts` (`MOVES`)

## References
- `.specify/specs/emotional-alchemy-diagnostic/DESIGN_HANDOFF.md` (post-card contract), `UI_COVENANT.md`
