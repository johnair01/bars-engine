# Spec: Allyship Deck Literacy

## Purpose

Make the Allyship Deck **legible and actionable without a guidebook**: every card
points to one concrete next action, shows how the move applies to real life,
links its vocabulary to a deep-linkable glossary, and greets new players with an
orientation that explains how and when to use the deck.

**Problem**: Cards today give an abstract move + question + "practice." Players
can't tell what specific action to take, how a vague move applies to *their*
situation, what the recurring terms mean, or which draw mode fits which moment.

**Practice**: Deftness Development — spec kit first, API-first (the AI step's
contract before its UI), deterministic over AI. Authored/deterministic content is
the always-on baseline; AI is strictly additive and degrades gracefully (the
Portland community is AI-allergic — the non-AI path is first-class).

## Design Decisions

| Topic | Decision |
|-------|----------|
| Glossary term ids | One canonical slug per term via `*TermId` helpers in `glossary.ts`. Both the glossary anchors and the card links use these helpers, so a link and its anchor can never drift. Anchor = `/deck/glossary#<id>`. |
| "Your move" storage | Add optional `action?: string` to `MoveCard`, populated in `assemble.ts` from `SUBMOVES[move][operation].action` for all 120 cards (AUTHORED may override). No 120 hand-authored fields — it surfaces existing content. |
| Applications storage | Add optional `applications?: { context: string; example: string }[]` to `MoveCard`, populated only via `AUTHORED`. Render is optional with a deterministic fallback when absent. |
| AI dual-track | Authored applications are the always-on baseline. The "apply to my situation" AI step is a separate, opt-in action that degrades to the authored list on any error or when flagged off. |
| Aesthetic | New deck UI uses the deck's inline-style system (`SURFACE_TOKENS`, `DECK_FONTS`, `DECK_GOLD`, `themeForMove`), never `CultivationCard` (UI_COVENANT: the deck is its own surface). |
| Runtime source | The client reads the committed `public/allyship-deck/allyship-deck.json`. P2/P3 require `npm run deck:assemble` and committing the JSON diff. |
| No schema change | The deck stays DB-free; the AI result is returned, never persisted. Prisma section N/A. |

## Conceptual Model

- **WHO**: an ally consulting the deck (for self or for a campaign/others).
- **WHAT**: a move card carrying its definitions (terms), one concrete action ("Your move"), and real-life applications.
- **WHERE**: `/deck` (draw/browse/path) and `/deck/glossary` (reference).
- **Energy**: a card turns a charge into a BAR; "Your move" is the smallest rep that moves it.

## API Contracts (API-First)

### `applyCardToSituation` (Phase 4)

**Input**: `{ cardId: string; subject: 'self' | 'campaign'; situation: string }`
**Output**: `{ applications: { context: string; example: string }[] } | { error: string }`

```ts
// src/actions/deck-applications.ts — 'use server'
export async function applyCardToSituation(input: {
  cardId: string
  subject: 'self' | 'campaign'
  situation: string
}): Promise<{ applications: { context: string; example: string }[] } | { error: string }>
```

- **Server Action** (`'use server'`): called from the card via `useTransition`; returns `{ ... } | { error }` (never throws).
- Resolves the card with `getMoveCardById` (`assemble.ts`). Guards on `OPENAI_API_KEY` + `DECK_AI_APPLICATIONS_ENABLED`; returns `{ error: 'ai_off' }` so the client shows the authored baseline (no error UI). Uses `generateObjectWithCache` (`src/lib/ai-with-cache.ts`).

## User Stories

### P1: Understand the terms (Glossary + inline deep links)
**As a** player reading a card, I want to tap any term (move, face, domain, output BAR) and see its plain definition, **so** I learn the system in context.
**Acceptance**: Card (full view) terms link to `/deck/glossary#<id>`; the page scrolls to and highlights the term; alchemy terms (transcend/translate/neutralize) are defined.

### P2: Know the one action (Your move)
**As a** player who drew a card, I want a clearly labeled concrete action, **so** I know exactly what to do now.
**Acceptance**: Full view shows a distinct "Your move · Do this" element; the action flows into the BAR seed.

### P3: See real-life applications (authored)
**As a** player, I want example real-life applications of the move, **so** it stops feeling vague.
**Acceptance**: Cards with authored applications show a "How this shows up in real life" disclosure; cards without show a deterministic fallback (never blank, no AI).

### P4: Apply to my situation (optional AI)
**As a** player, I want to optionally describe my situation and get the move tailored to it, **so** it's personal.
**Acceptance**: With AI on, 2–3 tailored items render above the authored baseline, badged AI; with AI off/erroring, it silently shows the authored baseline.

### P5: Know how to use the deck (Orientation)
**As a** new visitor, I want a first-run orientation explaining single draw vs spread vs find-your-path vs browse, **so** I know which to use when.
**Acceptance**: Orientation opens once (localStorage `deck-orientation-seen`), each option routes to the right view, and a top-bar button re-opens it.

## Functional Requirements

### Phase 1: Glossary + inline deep links
- **FR1**: A pure `glossary.ts` builds `GLOSSARY` from `MOVES/OPERATIONS/DOMAINS/CAPABILITIES` + a small authored set (output BARs, transcend/translate/neutralize, altitude, stage, charge, BAR, capability) and exports the `*TermId` helpers + `glossaryHref`.
- **FR2**: `/deck/glossary` renders `GlossaryReader` (deck aesthetic), grouped by category, each term in `<section id={term.id}>`, with hash-scroll + transient highlight and a category jump-nav.
- **FR3**: `AllyshipCard` `variant="full"` links the move pip, face badge, domain label, and output-BAR mark to `glossaryHref(...)`. The grid variant (a `<button>`) is not linked.

### Phase 2: "Your move" surfacing
- **FR4**: `MoveCard.action?: string`, set in `assemble.ts` from the submove action (AUTHORED may override).
- **FR5**: Full view shows a distinct "Your move · Do this" element.
- **FR6**: `buildDeckSeed` folds the action into the BAR description (guarded; provenance unchanged).

### Phase 3: Applications (authored baseline)
- **FR7**: `MoveCard.applications?: { context, example }[]`, populated via `AUTHORED`.
- **FR8**: A `CardApplications` component renders a collapsible "How this shows up in real life"; deterministic fallback line when a card has none.

### Phase 4: Applications (optional AI)
- **FR9**: `applyCardToSituation` server action per the API contract, cached + flagged, degrading to authored.
- **FR10**: `CardApplications` gains an opt-in situation input; AI items render above the authored baseline, clearly badged.

### Phase 5: Orientation
- **FR11**: `DeckOrientation` modal teaches the four uses, each routing to its view.
- **FR12**: Opens once via localStorage; re-openable from a top-bar button.

## Non-Functional Requirements
- Backward compatible: new `MoveCard` fields are optional; existing JSON/assemble/seed tests update in the same phase.
- Deterministic baseline everywhere; AI additive and opt-in only.
- Each phase independently shippable behind its own build gate.

## Persisted data & Prisma
N/A — the deck is DB-free and the AI result is returned, not persisted. No schema change.

## Scaling Checklist (Phase 4 — AI)

| Touchpoint | Mitigation |
|------------|------------|
| Filesystem | None — no `public/` writes; AI result returned, not stored |
| AI calls | `generateObjectWithCache` (cache by input); `DECK_AI_APPLICATIONS_MODEL` + `DECK_AI_APPLICATIONS_ENABLED` flags |
| Request body | `situation` is short free text; default `serverActions.bodySizeLimit` suffices |
| Env | Document `OPENAI_API_KEY`, `DECK_AI_APPLICATIONS_MODEL`, `DECK_AI_APPLICATIONS_ENABLED` in `docs/ENV_AND_VERCEL.md`; key read server-side only |

## Verification Quest (required for UX features)

- **ID**: `cert-allyship-deck-literacy-v1` (`scripts/seed-cert-allyship-deck-literacy.ts`, modeled on `scripts/seed-cert-go-deeper.ts`; TwineStory + `CustomBar` `isSystem:true`, `visibility:'public'`, deterministic id, idempotent; `npm run seed:cert:allyship-deck-literacy`).
- **Steps** (one per phase):
  1. Card detail → tap move pip / face badge / domain / output-BAR → lands on `/deck/glossary#<id>` scrolled to that term; `#transcend` exists.
  2. Full view shows distinct "Your move · Do this"; Send to BARS → seeded description contains the action line.
  3. Authored card shows context→example pairs; a card without shows the deterministic fallback.
  4. AI on → 2–3 tailored items badged AI above the baseline; `DECK_AI_APPLICATIONS_ENABLED=false` → silent degrade to authored.
  5. Clear `deck-orientation-seen`; reload `/deck` → orientation opens once; options route correctly; top-bar button re-opens it.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/)

## Dependencies
- `.specify/specs/allyship-deck/` (canonical move grammar — 5×6×4, do not invent moves)
- `.specify/specs/allyship-deck-experience/` (the deck app surface)
- `.specify/specs/go-deeper/` (superpower lens / disclosure patterns reused by P4)

## References
- Data/assembly: `src/lib/allyship-deck/{types,move-library,assemble,seed,card-visuals,glossary}.ts`; `scripts/assemble-allyship-deck.ts` (`npm run deck:assemble`); `public/allyship-deck/allyship-deck.json`
- UI: `src/components/deck/{AllyshipCard,AllyshipDeckReader,GlossaryReader,CardApplications,DeckOrientation,MovePip,FaceBadge}.tsx`; `src/app/deck/glossary/page.tsx`
- AI: `src/lib/ai-with-cache.ts` (`generateObjectWithCache`), `src/lib/openai.ts` (`getOpenAI`)
- Patterns reused: `src/app/event/EventDotNav.tsx` (scroll), `src/components/deck/GoDeeper.tsx` (disclosure)
- Prisma workflow: N/A (no schema change)
