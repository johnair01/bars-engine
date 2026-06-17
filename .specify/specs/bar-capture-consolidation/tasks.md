# Tasks: BAR Capture Consolidation

## Phase 1: Canvas completion

### 1.1 Server action updates

- [ ] Update `captureBarFromCanvas` return type: `{ barId: string; title: string } | { error: string }` — add `title` to the success return
- [ ] Add `storyContent?: string`, `campaignRef?: string`, `provenanceSource?: string` to `CaptureBarFromCanvasInput`
- [ ] Store `storyContent → CustomBar.storyContent`, `campaignRef → CustomBar.campaignRef`
- [ ] Append `provenanceSource` to `contextLines` (e.g. `[provenance, provenanceSource].filter(Boolean).join(' · ')`)
- [ ] Run `npm run check` — types clean

### 1.2 `SeedCaptureWhiteboard` — intent field

- [ ] Add `intent: string` state (default `''`)
- [ ] Add `showIntent: boolean` state (default `false`)
- [ ] Add to bottom chrome, between charge segments and provenance line:
  - When `!showIntent`: `+ intent` toggle link (Space Mono 9px muted, `onClick → setShowIntent(true)`)
  - When `showIntent`: `<input>` (Nunito 13px, dark bg, max 80 chars, placeholder `quest, reflection, gift…`) + `×` button (`onClick → setIntent(''); setShowIntent(false)`)
- [ ] Pass `storyContent: intent.trim() || undefined` to `captureBarFromCanvas` in `handleCapture`

### 1.3 `SeedCaptureWhiteboard` — props + pass-through

- [ ] Add `campaignRef?: string` and `provenanceSource?: string` to component props
- [ ] Pass both to `captureBarFromCanvas` in `handleCapture`

### 1.4 `SeedCaptureWhiteboard` — confirmation overlay

- [ ] Add `captured: { barId: string; title: string } | null` state (default `null`)
- [ ] In `handleCapture`: on success set `captured` instead of calling `router.push` immediately
- [ ] Render `CapturedOverlay` component when `captured !== null`:
  - Full-screen absolute, `z-index:50`, `background: rgba(10,9,8,0.88); backdrop-filter:blur(12px)`
  - Wood-element ◇ glyph (64px, `color: #2ecc71`, radial glow `0 0 32px -8px #27ae60`)
  - `"A seed is on the board"` — Jost 700 28px `#e8e6e0`
  - `captured.title` — Space Mono 11px `rgba(232,226,218,0.55)`, max 1 line, ellipsis
  - `"Tune now →"` — full-width liminal button → `router.push('/bars/${captured.barId}')`
  - `"Back to board"` — ghost button (border `rgba(255,255,255,0.1)`) → `router.push('/hand')`
- [ ] Run `npm run check` and manual test: capture → overlay appears → both buttons navigate correctly

---

## Phase 2: Param compatibility

### 2.1 Update `/bars/capture/page.tsx`

- [ ] Read `prefill`, `text`, `ref`, `source`, `refId` from `searchParams`
- [ ] Derive `defaultText = prefill ?? text`
- [ ] Derive `campaignRef = ref ?? undefined`
- [ ] Derive `provenanceSource = source ? \`${source}:${refId ?? ''}\` : undefined`
- [ ] Pass all three new props to `<SeedCaptureWhiteboard />`

---

## Phase 3: Callsite migration

### 3.1 Batch A — trivial href swaps

- [ ] `src/components/NavBar.tsx`: `href="/bars/create"` → `href="/bars/capture"`, update `isActive` check
- [ ] `src/components/dashboard/DashboardActionButtons.tsx`: `href: '/bars/create'` → `'/bars/capture'`
- [ ] `src/app/bars/page.tsx`: both `/bars/create` links → `/bars/capture`
- [ ] `src/app/wiki/bars-guide/page.tsx`: both `/bars/create` links → `/bars/capture`
- [ ] `src/app/wiki/quests-guide/page.tsx`: `/bars/create` → `/bars/capture`
- [ ] `src/app/wiki/rules/page.tsx`: `/bars/create` → `/bars/capture`
- [ ] `src/app/wiki/handbook/play/HandbookCyoa.tsx`: href → `/bars/capture`
- [ ] `src/components/campaign/BruisedBananaTwinePlayer.tsx`: update comment + href → `/bars/capture`
- [ ] `src/components/creator-scene-deck/SceneDeckCardPanel.tsx`: both links → `/bars/capture`
- [ ] Run `npm run check` — no type errors from Batch A

### 3.2 Batch B — param-mapped hrefs

- [ ] `src/app/wiki/hidden/page.tsx`: `?prefill=I+found+the+compost+heap` → `?text=I+found+the+compost+heap`
- [ ] `src/app/threshold-encounter/[id]/EncounterRunner.tsx`:
  - Change `?source=encounter&ref=${encounterId}&prefill=${text}` → `?source=encounter&refId=${encounterId}&text=${text}`
- [ ] `src/components/event/DonationSelfServiceWizard.tsx`:
  - `?ref=${refParam}` stays the same param name (canvas page reads `ref` as `campaignRef`) — **verify no change needed**
- [ ] Run `npm run check`

### 3.3 Route retirement

- [ ] Replace `src/app/bars/create/page.tsx` with permanent redirect to `/bars/capture`
- [ ] Delete `src/app/bars/create/CreateBarFormPage.tsx`
- [ ] Add `@deprecated` JSDoc to `createPlayerBar` in `src/actions/bars.ts`

### 3.4 Consolidate `/hand` buttons

- [ ] Remove "Create BAR" amber button from `/hand/page.tsx`
- [ ] Rename "Capture seed" purple button to "New BAR →" (or leave as "Capture seed" — decide)
- [ ] Keep button copy consistent with NavBar label

### 3.5 Final verification

- [ ] `npm run build`
- [ ] `npm run check`
- [ ] Manual: run `cert-bar-capture-consolidation-v1` (8 steps in spec)
- [ ] Verify `/bars/create` → redirects to `/bars/capture` (not 404)
- [ ] Verify EncounterRunner "Keep as BAR" pre-populates canvas correctly
- [ ] Verify DonationSelfServiceWizard "Create a BAR" opens canvas with campaign context
