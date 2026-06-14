# Spec: BARS v1 — BAR Intake (Capture → Keep → Tune) + Open Up, Stories Composer, Decks/Print/QR

## Purpose

Ship the front door to the game's core loop: capture an emotional *charge* as a **BAR**, keep it
with zero friction, and later *tune* it through three channels (element / altitude / move) so it
becomes playable game data. A capture that feels good is the only thing that drives dogfooding, and
dogfooding is the only fuel that moves the milestones.

**Problem**: Today's `/bars/create` is plain black/zinc/purple chrome; new captures never stamp
maturity (so they fall out of the garden/gate logic); there is no Tune screen and nothing writes the
channel columns that already exist. The engine has the spine but not the front door.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic
over AI. Reskin + wire over new infrastructure; the core loop needs **no migration**.

Source of truth: [`design/design_handoff_bars_v1_intake/README.md`](../../../design/design_handoff_bars_v1_intake/README.md)
(the contract) and [`RECONCILIATION.md`](../../../design/design_handoff_bars_v1_intake/RECONCILIATION.md)
(corrections C1–C3 applied below).

## Design Decisions

| Topic | Decision |
|-------|----------|
| Tuning required? | Optional to keep; **required before a BAR graduates to a quest**. `growQuestFromBar()` refuses an untuned BAR. |
| After Keep, land where? | Brief "a seed is on the board" confirmation, then back to `/bars`. Tune is an optional affordance, never forced. |
| Altitude storage | Reuse existing `intensity` column. Values `dissatisfied \| neutral \| satisfied`. **No migration.** |
| Where does Open Up sit? | **Before Clean Up**: Wake · Open · Clean · Grow · Show. An aperture you pass through before correcting. |
| Move type to edit (C2) | Add `openUp` to **`PersonalMoveType`** (`src/lib/quest-grammar/types.ts:129`) — **not** `MovementType` (that's `translate \| transcend`). Thread through all enumerations + the duplicate `packages/bars-core` tree. |
| Maturity advance helper (C1) | `updateBarSeedMaturity()` is a server action at `src/actions/bar-seed-metabolization.ts:63` — import from there, not `@/lib`. |
| Stories composer | **In v1 scope.** Needs the single migration: nullable `captureDesign` JSON column on `CustomBar`. |
| Deck publishing | Vetted/allow-listed authors only at launch. |
| Print | MakePlayingCards.com poker size 2.5×3.5 in / 822×1122 px @ 300 dpi (bleed; safe area ~2.42×3.42 in). |
| Graduate seeding | Onboarding/dev seed must guarantee `player.nationId` + `player.archetypeId` so the graduate path never dead-ends. |

## Conceptual Model

| Dimension | Channel | Column |
|-----------|---------|--------|
| WHAT (the charge) | captured text / photo | `title`/`description`, `assets[]` |
| WHO / element | element nation pick | `nation` |
| altitude | dissatisfied/neutral/satisfied | `intensity` |
| Personal throughput | the move (incl. new Open Up) | `moveType` |
| charge name | emotional alchemy tag | `emotionalAlchemyTag` |
| maturity | BSM state machine | `seedMetabolization` (JSON) |
| composer layout | Stories canvas | `captureDesign` (JSON, **new**) |

Maturity advances: `captured → context_named → elaborated → shared_or_acted` (`integrated` reserved
for graduation). **Clamp forward — never regress.**

## API Contracts (API-First)

### `tuneBar(barId, patch)` — Server Action (new)

**Input**: `barId: string`, `patch: { nation?, intensity?, emotionalAlchemyTag?, moveType? }`
**Output**: `{ success: boolean, error?: string, maturity?: MaturityPhase }`

```ts
// src/actions/bars.ts — owner-guarded, BSM-typed
export async function tuneBar(barId: string, patch: {
  nation?: string                // element
  intensity?: string             // altitude: dissatisfied | neutral | satisfied
  emotionalAlchemyTag?: string
  moveType?: string              // wakeUp | openUp | cleanUp | growUp | showUp
}): Promise<{ success: boolean; error?: string; maturity?: string }>
// 1. auth via getPlayerId (bars_player_id cookie)
// 2. guard: creator-only + type ∈ {'bar','charge_capture'}
// 3. db.customBar.update({ where:{id}, data: patch })
// 4. derive next maturity from which channels are now set; advance via
//    updateBarSeedMaturity(barId, { maturity: next })  // forward-clamp
// 5. revalidatePath('/bars'), `/bars/${barId}`, '/bars/garden'
```

**Channel → column → maturity bump:**

| Channel | Column | Advances to |
|---|---|---|
| Element | `nation` | `context_named` |
| Altitude (+ charge name) | `intensity` (+ `emotionalAlchemyTag`) | `elaborated` |
| Move | `moveType` | `shared_or_acted` (ready) |

### `saveCaptureDesign(barId, design)` — Server Action (new, Stories slice)

**Input**: `barId: string`, `design: CaptureDesign`
**Output**: `{ success: boolean; error?: string }`

```ts
type CaptureDesign = {
  bg: 'fire' | 'water' | 'wood' | 'metal' | 'earth'
  boxes: Array<{
    id: string; x: number; y: number  // % of canvas, clamp x∈[2,86] y∈[2,92]
    text: string; size: number        // px, clamp [11,46]
    color: string; weight: 500|600|700|800
    font: 'display' | 'body' | 'mono'
  }>
}
// owner-guarded; writes captureDesign: JSON.stringify(design); revalidatePath(`/bars/${barId}`)
// does NOT change maturity
```

### Existing actions (modify, do not rebuild)
`createPlayerBar` / `createBarForUpload` — add maturity+provenance stamp on create (see FR2).
`growQuestFromBar` — add the fully-tuned gate (see FR-grad).

**Route vs Action**: all of the above are **Server Actions** (`'use server'`, form/React paths).
QR round-trip reuses the existing share/claim route `/bar/share/<token>` + `claimBarShareExternal`.

## User Stories

### P1: Frictionless capture
**As a player**, I want to keep a one-line charge in under 10 seconds, so capturing always feels good.
**Acceptance**: one-line note keeps with zero other taps and lands on `/bars`; kept BAR has
`maturity:'captured'` in DB; surface reads the cultivation aesthetic (no zinc/purple chrome);
provenance strip shows locked time; CTA reads exactly **"Keep · tune later"**.

### P2: Tune into game data
**As a player**, I want to assign element/altitude/move later, so a scribble becomes playable.
**Acceptance**: picking an element re-tints the live `CultivationCard`; each channel persists
immediately and survives reload; maturity advances and never regresses; a fully-tuned BAR shows a
graduate affordance; tuning is optional to keep, required to play.

### P3: The 5th move "Open Up"
**As the system**, `openUp` is a first-class move ordered before Clean Up.
**Acceptance**: `openUp` is selectable in Tune chips, appears in the MoveIcon set, ontology doc, and
quest-grammar types (both trees) without breaking the existing four.

### P4: Stories canvas composer
**As a player**, I want to arrange my BAR text into a shareable poster, so a BAR is data *and* canvas.
**Acceptance**: text boxes drag and persist by `%`; recolor/resize/background survive reload via
`captureDesign`; editing does not change maturity; an exported image renders the layout faithfully.

### P5: Decks / Print / QR (staged)
**As a vetted author**, I publish curated decks; printed card backs carry a QR that reopens the BAR.
**Acceptance**: publish gated to allow-listed authors; MPC export at correct size; scanned QR routes
through the existing share/claim flow into the app.

### Verification quest (required — UX feature)
**ID**: `cert-bars-intake-tune-v1`. A Twine story that walks a tester through Capture → Keep → Tune →
graduate, framed as preparing the front door for the Bruised Banana residency.

## Functional Requirements

### Phase 1 — Foundation (no migration)
- **FR1**: maturity helpers parse/merge confirmed (`@/lib/bar-seed-metabolization`).
- **FR2**: `createPlayerBar` + `createBarForUpload` stamp `seedMetabolization` with
  `{ maturity:'captured', soilKind:'holding_pen' }` (prefer `mergeSeedMetabolization()`), and set
  optional capture-time `nation` field tint. `createdAt` is auto (provenance locked).

### Phase 2 — Capture reskin (`/bars/create`)
- **FR3**: rebuild as the cultivation-surface quick-capture: status strip, locked provenance chip
  (`<time> · <time-of-day>` derived from `createdAt`), blank element-tinted card with the load-bearing
  inset highlight, optional 5-sigil field tint, photo + inspiration affordances (existing paths),
  full-width **"Keep · tune later"** CTA disabled until ≥1 char or a photo. Copy is exact.
- **FR4**: Kept confirmation ("A seed is on the board") → default route `/bars`; secondary
  "Tune now →" → `/bars/[id]/tune`.

### Phase 3 — Tune gate (`/bars/[id]/tune`)
- **FR5**: `tuneBar()` per the contract above; owner-guard; forward-clamp maturity via
  `updateBarSeedMaturity` (import from `src/actions/bar-seed-metabolization.ts` — **C1**).
- **FR6**: `TuneBarClient` with live `CultivationCard` (`data-element`, `data-altitude`), maturity
  ladder, the four channel groups (charge name, element, altitude, move) with optimistic chips.
- **FR-grad**: `growQuestFromBar()` additionally requires fully-tuned (maturity `shared_or_acted`);
  keep capture/keep ungated. Existing nation/archetype guard stays.

### Phase 4 — Open Up (C2/C3)
- **FR7**: add `'openUp'` to `PersonalMoveType` + `ALL_WAVE_MOVES` + `VALID_STAGES` +
  `deriveBarDraftFrom321` unions + `JourneyStage`; add 5th glyph to `move-icons.ts`; update schema
  comments (`:2867`, `:3473`); mirror in `packages/bars-core/src/quest-grammar`. Update the ontology
  doc `.agent/context/emotional-alchemy-ontology.md`. Add the liminal-accented Open Up chip to Tune.
  Order: Wake · Open · Clean · Grow · Show.

### Phase 5 — Stories composer (the one migration)
- **FR8**: add nullable `captureDesign String?` to `CustomBar`; migration committed.
- **FR9**: `saveCaptureDesign()` action (does not touch maturity).
- **FR10**: editor (canvas 5/7, drag by %, recolor, resize 11–46, background swap) ported from the
  "V1 · live" canvas in `BARS Intake and Decks.dc.html`.
- **FR11**: export pipeline — image first (1080×1350 / 1080×1920 PNG via satori/`@vercel/og` or
  `html-to-image`), then short video; feed `captureDesign` into the MPC face + deck entry.

### Phase 6 — Decks / Print / QR (staged)
- **FR12**: curated decks authoring/browsing; publish gated to vetted authors.
- **FR13**: MPC print export at 822×1122 px @ 300 dpi; card front mirrors `CultivationCard` (or
  `captureDesign` when present); back carries QR to the share route.
- **FR14**: QR round-trip via existing `/bar/share/<token>` + `claimBarShareExternal`.

## Non-Functional Requirements
- Backward compatible: existing four moves keep working as `openUp` is added.
- Honor `prefers-reduced-motion` for all motion (hover lift, press shrink, idle-float, entry fade).
- Optimistic chip UI with server reconciliation; tune writes are persisted and survive reload.
- Use design-system tokens (`prototypes/_ds/.../tokens/`, mapped to `src/styles/cultivation-cards.css`
  / `src/lib/ui/card-tokens.ts`) — never raw values. Liminal `#7c3aed` is action-only, never an element.

## Persisted data & Prisma (required — Phase 5 only)

> Phases 1–4 need **no** schema change. Phase 5 (Stories composer) adds one nullable column.

| Check | Done |
|-------|------|
| `CustomBar.captureDesign String?` named in Design Decisions / API Contracts | ✅ |
| `tasks.md` includes `npx prisma migrate dev --name add_capturedesign_to_custombar` + commit `prisma/migrations/…` | ✅ |
| Verification: `npm run db:sync` after schema edit; `npm run check` | ✅ |
| Human glance at `migration.sql` (additive) | ⬜ |

**Do not** rely on `db push` (forbidden — see PRISMA_MIGRATE_STRATEGY.md).

## Scaling Checklist (Phase 5 export)

| Touchpoint | Mitigation |
|------------|------------|
| Image/video export | Server-side satori/`@vercel/og` or client `html-to-image`; no `public/` writes in serverless |
| Large payloads | `serverActions.bodySizeLimit` if `captureDesign`/exports are large |
| Env | Document any export/render env in `docs/ENV_AND_VERCEL.md` |

## Verification Quest (required for UX features)
- **ID**: `cert-bars-intake-tune-v1`
- **Steps**: open `/bars/create` → keep a one-liner (lands on `/bars`) → open the kept BAR → tune
  element/altitude/move (watch the live card + maturity ladder) → graduate to a quest.
- Framed toward the Bruised Banana residency (front door for party guests).
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/)

## Dependencies
- `@/lib/bar-seed-metabolization` (maturity helpers) · `src/actions/bar-seed-metabolization.ts`
  (`updateBarSeedMaturity`) · `growQuestFromBar` · existing share/claim flow.

## References
- Contract: `design/design_handoff_bars_v1_intake/README.md`
- Corrections: `design/design_handoff_bars_v1_intake/RECONCILIATION.md` (C1–C3)
- Live source: `src/actions/bars.ts`, `src/components/bars/BarCardFace.tsx`,
  `src/styles/cultivation-cards.css`, `src/lib/ui/card-tokens.ts`,
  `src/lib/quest-grammar/types.ts`
- Prisma: `.agents/skills/prisma-migration-discipline/SKILL.md`, `docs/PRISMA_MIGRATE_STRATEGY.md`
