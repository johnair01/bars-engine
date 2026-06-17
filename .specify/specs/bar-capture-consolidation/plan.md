# Plan: BAR Capture Consolidation

## Dependency order

Phase 1 must ship before Phase 2. The confirmation screen and intent field make the canvas complete enough to accept all traffic. Only then is callsite migration safe (players won't land on a canvas with no ritual closure).

---

## Phase 1: Canvas completion (confirmation + intent)

### 1.1 Confirmation overlay in `SeedCaptureWhiteboard`

Add a `captured: { barId: string; title: string } | null` state.

After `captureBarFromCanvas` succeeds, set `captured` (don't push route yet). Render a full-screen overlay (`position:absolute; inset:0; z-index:50`) on top of the canvas:

```
[wood glyph ◇ — 64px, element gem color, radial glow]
"A seed is on the board"      (Jost 700, 28px, #e8e6e0)
[derived title]               (Space Mono 11px, rgba(232,226,218,0.55))

[Tune now →]   (full-width, liminal purple button)
[Back to board] (ghost button, border-white/10)
```

- Background: `background: rgba(10,9,8,0.88); backdrop-filter: blur(12px)` over the frozen canvas
- "Tune now →" → `router.push('/bars/${captured.barId}')`
- "Back to board" → `router.push('/hand')`
- No `router.push` fires until the player chooses an action — Back button behavior stays clean

Title derivation: reuse `deriveCanvasTitle` logic (already in `captureBarFromCanvas`; duplicate client-side or pass back from server action). Simplest: return `{ barId, title }` from `captureBarFromCanvas` (currently returns only `{ barId }`).

**Update server action return type**:
```ts
// src/actions/bars.ts
captureBarFromCanvas → Promise<{ barId: string; title: string } | { error: string }>
```

### 1.2 Intent field in bottom chrome

Below the charge selector, above the provenance line:

```
[+ intent]   (collapsed by default — Space Mono 9px, rgba(232,226,218,0.5), cursor:pointer)
```

On tap: expand to a single-line `<input>` (Nunito 13px, same dark style as canvas inputs):
- placeholder `quest, reflection, gift…`
- maxLength 80
- `[× clear]` button to right collapses + clears
- Value stored in `intent: string` state on the whiteboard component

Pass `storyContent: intent.trim() || undefined` to `captureBarFromCanvas`.

**Update `captureBarFromCanvas` input**:
```ts
storyContent?: string   // → CustomBar.storyContent
campaignRef?: string    // → CustomBar.campaignRef
provenanceSource?: string  // appended to contextLines
```

### 1.3 Update `SeedCaptureWhiteboard` props

```ts
interface SeedCaptureWhiteboardProps {
  defaultText?: string
  campaignRef?: string       // new
  provenanceSource?: string  // new
}
```

Pass both through to `captureBarFromCanvas` in `handleCapture`.

### 1.4 Verify Phase 1

- `npm run build` + `npm run check`
- Manual: capture a seed → confirmation overlay appears → "Tune now →" opens detail page with correct data
- Manual: capture with intent `reflection` → verify `storyContent=reflection` on BAR detail

---

## Phase 2: Param compatibility + callsite migration

### 2.1 Update `/bars/capture/page.tsx`

```ts
// Read all param variants
const prefill   = searchParams.prefill
const text      = searchParams.text
const ref       = searchParams.ref
const source    = searchParams.source
const refId     = searchParams.refId  // for encounter: ref=encounterId

const defaultText      = prefill ?? text   // legacy ?prefill= wins
const campaignRef      = ref ?? undefined
const provenanceSource = source
  ? `${source}:${refId ?? ''}`
  : undefined
```

Pass `campaignRef` and `provenanceSource` as props.

### 2.2 Migrate 14 callsites

Work file-by-file; `npm run check` after each batch.

**Batch A — trivial href swaps (no param changes)**:
- `NavBar.tsx`: href + isActive check
- `DashboardActionButtons.tsx`: href
- `bars/page.tsx` (×2)
- `wiki/bars-guide/page.tsx` (×2)
- `wiki/quests-guide/page.tsx`
- `wiki/rules/page.tsx`
- `wiki/handbook/play/HandbookCyoa.tsx`
- `BruisedBananaTwinePlayer.tsx` (comment + href)
- `SceneDeckCardPanel.tsx` (×2)

**Batch B — param mapping**:
- `wiki/hidden/page.tsx`: `?prefill=` → `?text=`
- `EncounterRunner.tsx`: `?source=encounter&ref=id&prefill=text` → `?source=encounter&refId=id&text=text`
- `DonationSelfServiceWizard.tsx`: `?ref=campaignRef` stays the same (canvas page now reads it)

### 2.3 `/bars/create` route retirement

Replace `src/app/bars/create/page.tsx` with:
```ts
import { redirect } from 'next/navigation'
export default function CreateBarPage() {
  redirect('/bars/capture')
}
```

Delete `src/app/bars/create/CreateBarFormPage.tsx`.

Add `@deprecated` JSDoc to `createPlayerBar` in `src/actions/bars.ts`.

### 2.4 Consolidate `/hand` buttons

Replace "Capture seed" (purple) + "Create BAR" (amber) buttons with a single:
```tsx
<Link href="/bars/capture" className="... border-purple-800/70 bg-purple-950/30 text-purple-100 ...">
  New BAR →
</Link>
```

### 2.5 Verify Phase 2 — Certification Quest

Run `cert-bar-capture-consolidation-v1` steps (see spec).

---

## Risk flags

| Risk | Mitigation |
|------|-----------|
| `EncounterRunner` uses `ref=` for encounter id — conflicts with `ref=` for campaignRef | Rename encounter's param to `refId=` in EncounterRunner; canvas page reads both `ref` (campaignRef) and `refId` (encounter provenance) |
| `createPlayerBar` has other callers (CYOA, create-bar.ts, SeamBarCreate) | Only mark deprecated; don't delete. Those callers migrate on their own timelines. |
| Some wiki pages are static / SSG — redirect won't break them but test | Verify at build time that no static pages try to render `/bars/create` content (they only link, so fine) |
| `isActive('/bars/create')` in NavBar could match `/bars/capture` incorrectly | Update to exact match `pathname === '/bars/capture'` |
