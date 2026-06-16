# Spec: BAR Capture Consolidation

## Purpose

Make `/bars/capture` (the Seed Capture Whiteboard) the **first and only** BAR creation surface by closing the four gaps that block retiring `/bars/create`, then migrating all 14 callsites and redirecting the old route.

**Problem**: Two parallel creation surfaces exist. `/bars/create` (form) has features the canvas lacks — post-capture confirmation, intent/tags, and param contracts used by EncounterRunner and DonationSelfServiceWizard. Until these gaps are closed, the canvas cannot replace the form; until the form is retired, players see two different "New BAR" paths with different affordances and ritual quality.

**Practice**: Deftness Development — close gaps in dependency order; migrate callers only when the target is ready; redirect rather than delete so deep-links don't 404.

## Relationship to existing specs

| Spec | Relationship |
|------|-------------|
| [bar-seed-capture-whiteboard](../bar-seed-capture-whiteboard/spec.md) (BSCW) | Canvas surface this spec completes; no new schema required here |
| [bar-working-layer](../bar-working-layer/spec.md) | "Tune now →" on the confirmation screen is the on-ramp to BAR Working (Clean Up) |
| [bars-ui-overhaul](../bars-ui-overhaul/spec.md) | `/bars/create` + `CreateBarFormPage` are retired in this spec |

## Gap Analysis

### Gap 1 — Post-capture confirmation (blocker)

**Current**: `captureBarFromCanvas` returns `{ barId }`, canvas calls `router.push('/hand')`. Player gets no ritual closure; no path to immediate tuning.

**Current form**: Shows "A seed is on the board" screen with the captured text, "Tune now →" (`/bars/:id/tune`), and "To the board" (`/hand`).

**Fix**: Add a `Captured` state to `SeedCaptureWhiteboard`. After capture succeeds, transition the canvas UI to an in-place confirmation overlay (full-screen, `z-index:50`) showing:
- Large ritual symbol (wood element ◇, element gem color)
- "A seed is on the board" heading (Jost 700)
- Derived title preview (first line of primary sticker, muted, small)
- Two actions: `Tune now →` (→ `/bars/:barId`) and `Back to board` (→ `/hand`)
- Atmospheric: same field background as the canvas, darkened (`rgba(10,9,8,0.88)` overlay + blur)

### Gap 2 — Intent/tags field (blocker)

**Current**: Canvas has no field for intent tags (`storyContent`). The form's "Intent" field (`quest, reflection, gift…`) maps to `CustomBar.storyContent`, read downstream by quest generation, BarFaceBackTabs, and BAR Working.

**Fix**: Add a collapsed "Intent" single-line input to the bottom chrome, below the charge selector and above the provenance line. Placeholder: `quest, reflection, gift…`. Optional; hidden by default behind a small `+ intent` toggle (Space Mono, muted). Expands to an 80-char max text input inline. Wire into `captureBarFromCanvas` as `storyContent`.

**API contract update**:
```ts
// Add to CaptureBarFromCanvasInput:
storyContent?: string  // → CustomBar.storyContent (tags/intent)
```

### Gap 3 — Param compatibility (blocker for callers)

Three param patterns currently used by callers:

| Param | Caller | Current target | Meaning |
|-------|--------|----------------|---------|
| `?prefill=<text>` | EncounterRunner, wiki hidden page | `/bars/create` | Pre-populate textarea |
| `?text=<text>` | SeamBarCreate, canvas internal | `/bars/capture` | Pre-populate (already works) |
| `?ref=<campaignRef>` | DonationSelfServiceWizard | `/bars/create` | Associate BAR with campaign |
| `?source=encounter&ref=<encounterId>` | EncounterRunner | `/bars/create` | Provenance stamp |

**Fix in `src/app/bars/capture/page.tsx`**:
- Accept `prefill`, `text`, `ref`, `source`, `encounterId` from `searchParams`
- `defaultText = prefill ?? text` (prefill takes priority, matches legacy callers)
- Pass `campaignRef` and `provenanceSource` as props to `SeedCaptureWhiteboard`

**Fix in `captureBarFromCanvas`**:
```ts
// Add to CaptureBarFromCanvasInput:
campaignRef?: string    // → CustomBar.campaignRef
provenanceSource?: string  // appended to contextLines: e.g. "encounter:enc_123"
storyContent?: string
```

### Gap 4 — Callsite migration (blocker for retirement)

14 hardcoded `/bars/create` links across the codebase. Must all move to `/bars/capture` (with param mapping where applicable) before the form route can be retired.

| File | Change |
|------|--------|
| `src/components/NavBar.tsx` | `/bars/create` → `/bars/capture` (active state check too) |
| `src/components/dashboard/DashboardActionButtons.tsx` | href → `/bars/capture` |
| `src/app/hand/page.tsx` | `/bars/create` "Create BAR" button (already has separate "Capture seed" — consolidate to one) |
| `src/app/bars/page.tsx` (×2) | `/bars/create` → `/bars/capture` |
| `src/app/wiki/bars-guide/page.tsx` (×2) | `/bars/create` → `/bars/capture` |
| `src/app/wiki/quests-guide/page.tsx` | `/bars/create` → `/bars/capture` |
| `src/app/wiki/rules/page.tsx` | `/bars/create` → `/bars/capture` |
| `src/app/wiki/handbook/play/HandbookCyoa.tsx` | href → `/bars/capture` |
| `src/app/wiki/hidden/page.tsx` | `/bars/create?prefill=…` → `/bars/capture?text=…` |
| `src/app/threshold-encounter/[id]/EncounterRunner.tsx` | `?source=encounter&ref=id&prefill=text` → `/bars/capture?source=encounter&ref=id&text=text` |
| `src/components/event/DonationSelfServiceWizard.tsx` | `?ref=campaignRef` → `/bars/capture?ref=campaignRef` |
| `src/components/campaign/BruisedBananaTwinePlayer.tsx` | update comment + href |
| `src/components/creator-scene-deck/SceneDeckCardPanel.tsx` (×2) | href → `/bars/capture` |

### Gap 5 — Route retirement

Once all callers are migrated:
- `src/app/bars/create/page.tsx` → replace with `redirect('/bars/capture')` (permanent 308)
- `src/app/bars/create/CreateBarFormPage.tsx` → delete
- Mark `createPlayerBar` in `src/actions/bars.ts` as `@deprecated` (don't delete — used by other paths)

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Confirmation placement** | In-canvas overlay (state transition), not a new route. Keeps the atmospheric feel; no history push means Back button behavior is clean. |
| **Confirmation "Tune now →"** | Links to `/bars/:barId` (detail page). Not `/bars/:barId/tune` — the detail page is the entry to BAR Working; tune is a sub-action there. |
| **Intent field** | Collapsed behind `+ intent` toggle. Optional. Does not gate capture. |
| **Back photo** | Out of scope for canvas capture. `BarPhotoForm` on the detail page handles it ("Bring your BAR into the Conclave"). Capture is single-photo only. |
| **Social/inspiration links** | Out of scope for canvas capture. `BarSocialLinksForm` on the detail page is the right surface. Canvas link chips serve creative composition, not social embed. |
| **`createPlayerBar` deprecation** | Mark deprecated, don't delete. It's still called by `SeamBarCreate` (adventure seam), `CreateBarForm` (CYOA-derived path), and `create-bar.ts`. Those paths have their own migration timelines. |
| **`/bars/create` route** | Becomes a `redirect('/bars/capture', { status: 308 })` so any existing bookmarks or external links still work. |
| **NavBar active state** | Update `isActive` check from `'/bars/create'` to `'/bars/capture'`. |
| **`/hand` page buttons** | Collapse "Capture seed" + "Create BAR" into single "New BAR →" button → `/bars/capture`. |

## API Contracts (updates)

### `captureBarFromCanvas` (updated input)

```ts
interface CaptureBarFromCanvasInput {
  items: CanvasItem[]
  fieldTint: string | null
  charge: 1 | 2 | 3 | 4 | 5
  provenance?: string
  // New in this spec:
  storyContent?: string      // → CustomBar.storyContent
  campaignRef?: string       // → CustomBar.campaignRef
  provenanceSource?: string  // appended to contextLines
}
```

### `SeedCaptureWhiteboard` (updated props)

```ts
interface SeedCaptureWhiteboardProps {
  defaultText?: string
  // New:
  campaignRef?: string
  provenanceSource?: string
}
```

## User Stories

### P1: Ritual closure after capture

**As a player**, after I tap "Capture this seed →", I want to see a confirmation that the seed landed, so I can exhale before moving on.

**Acceptance**: Canvas transitions to "A seed is on the board" overlay. "Tune now →" opens `/bars/:barId`. "Back to board" navigates to `/hand`. Back button doesn't re-submit.

### P1: Intent at capture

**As a player**, I want to optionally tag my BAR's intent (`quest, reflection, gift`) at capture, so quest generation and BAR Working have context without requiring a separate tuning step.

**Acceptance**: `+ intent` expands a text field in bottom chrome. Value persists across editor opens. Stored in `storyContent` on the created BAR.

### P1: Encounter → canvas continuity

**As a player** finishing a threshold encounter, tapping "Keep as BAR" should carry my reflection text into the canvas, so I don't have to retype it.

**Acceptance**: `/bars/capture?source=encounter&ref=enc_123&text=My+reflection` pre-populates the first text sticker. The encounter reference is stored as provenance on the BAR.

### P1: Clean "New BAR" entry point

**As a player** on `/hand`, I want one clear "New BAR" button, not two (Capture seed + Create BAR) with ambiguous distinction.

**Acceptance**: Single "New BAR →" button on `/hand` → `/bars/capture`. No second creation entry point visible.

## Functional Requirements

### Phase 1: Confirmation screen + intent field

- **FR1**: After `captureBarFromCanvas` succeeds, `SeedCaptureWhiteboard` transitions to `Captured` state (no route push yet)
- **FR2**: Captured overlay: atmospheric background (`rgba(10,9,8,0.88)` + `backdrop-filter:blur(12px)`), wood-element ◇ glyph, "A seed is on the board" heading (Jost 700 28px), title preview (first line, `rgba(232,226,218,0.6)`, Space Mono 11px), "Tune now →" button (liminal), "Back to board" ghost button; then `router.push('/hand')` on "Back to board" click
- **FR3**: Bottom chrome: `+ intent` toggle (Space Mono 9px, muted); tapping expands an `<input>` (max 80 chars, placeholder `quest, reflection, gift…`); tapping again collapses and clears if empty
- **FR4**: `captureBarFromCanvas` server action: accept and store `storyContent`, `campaignRef`, `provenanceSource` (append source to `contextLines`)
- **FR5**: `SeedCaptureWhiteboard` props: accept `campaignRef` and `provenanceSource`; pass through to server action on capture

### Phase 2: Param compatibility + callsite migration

- **FR6**: `/bars/capture/page.tsx`: read `prefill`, `text`, `ref`, `source`, `encounterId` from `searchParams`; derive `defaultText = prefill ?? text`; pass `campaignRef = ref` and `provenanceSource = source ? \`${source}:${encounterId ?? ''}\` : undefined` to component
- **FR7**: Migrate all 14 `/bars/create` callsites to `/bars/capture` (with param mapping per Gap 4 table above)
- **FR8**: `/bars/create/page.tsx` → `redirect('/bars/capture')` (308 permanent); delete `CreateBarFormPage.tsx`
- **FR9**: `/hand` page: consolidate two buttons into one "New BAR →" → `/bars/capture`
- **FR10**: NavBar: update href and `isActive` check to `/bars/capture`
- **FR11**: Mark `createPlayerBar` as `@deprecated` with migration note in JSDoc

## Non-Functional Requirements

- No new schema migrations required (all target columns already exist: `storyContent`, `campaignRef`, `contextLines`)
- `npm run build` and `npm run check` pass after each phase
- Existing bookmarks to `/bars/create` continue to work via redirect (308)
- `SeamBarCreate` is NOT migrated in this spec — it has its own UX (fill-in-the-blank + optional canvas link) and uses `emitBarFromPassage`, not `createPlayerBar` directly

## Verification Quest

- **ID**: `cert-bar-capture-consolidation-v1`
- **Steps**:
  1. Navigate to `/hand` — confirm single "New BAR →" button, no "Create BAR" or "Capture seed"
  2. Click "New BAR →" → confirm `/bars/capture` loads
  3. Compose a text sticker, lock Water element, charge 3, add intent `reflection`
  4. Tap "Capture this seed →" → confirm overlay appears: title visible, "Tune now →" and "Back to board" buttons
  5. Tap "Tune now →" → confirm redirect to `/bars/:barId` detail page with correct content, nation=water, intensity=3, storyContent=reflection
  6. Navigate to `/bars/create` → confirm redirect to `/bars/capture` (check no 404)
  7. Navigate to a threshold encounter → tap "Keep as BAR" → confirm canvas pre-populated with encounter text
  8. NavBar "BAR" link → confirm it points to `/bars/capture` and shows active state

## Dependencies

- [bar-seed-capture-whiteboard](../bar-seed-capture-whiteboard/spec.md) — BSCW Phase 1 must be complete (it is)
- `CustomBar.storyContent`, `CustomBar.campaignRef`, `CustomBar.contextLines` — all exist in schema

## References

- `src/app/bars/create/CreateBarFormPage.tsx` — surface to retire
- `src/actions/bars.ts` — `captureBarFromCanvas`, `createPlayerBar` (to deprecate)
- `src/components/NavBar.tsx` — active state logic
- Callsite table: Gap 4 above
