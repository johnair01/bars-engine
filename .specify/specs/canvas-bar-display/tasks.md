# Tasks: Canvas BAR Display

## Phase 1: Data layer

### 1.1 `getBarDetail` query update
- [ ] Add `canvasLayout: true` to Prisma select in `getBarDetail` (`src/actions/bars.ts`)
- [ ] Add `nation: true` to same query
- [ ] Add `intensity: true` to same query
- [ ] Update any TypeScript return-type annotations that wrap `getBarDetail`'s result
- [ ] Run `npm run check` — types clean

### 1.2 `updateCanvasPhotoUrls` server action
- [ ] Add `updateCanvasPhotoUrls(barId, updates)` to `src/actions/bars.ts`
- [ ] Auth-gated: only bar creator can patch (check `creatorId === playerId`)
- [ ] Parses `canvasLayout`, patches matching item `text` fields, writes back as JSON string
- [ ] Export the function

### 1.3 `deriveCanvasPreviewText` helper
- [ ] Create `src/lib/canvas-utils.ts`
- [ ] Implement `deriveCanvasPreviewText(canvasLayout: string | null): string | null`
- [ ] Parses JSON, finds first `type === 'text'` item, returns trimmed text (max 120 chars)
- [ ] Returns `null` on parse error or no text stickers
- [ ] Run `npm run check`

---

## Phase 2: Photo URL persistence

### 2.1 Collect upload URLs in `SeedCaptureWhiteboard`
- [ ] Check `uploadBarAsset` return type — confirm it returns `{ url: string }` (or adjust)
- [ ] In `handleCapture`: collect `{ itemId, url }` pairs from each upload result
- [ ] After all uploads: call `updateCanvasPhotoUrls(barId, urlUpdates)` if any updates exist
- [ ] Import `updateCanvasPhotoUrls` from `@/actions/bars`
- [ ] Run `npm run check`

---

## Phase 3: Read-only renderer + integration

### 3.1 `CanvasPreview` component
- [ ] Create `src/components/bars/CanvasPreview.tsx` (`'use client'`)
- [ ] Props: `{ canvasLayout: string; nation?: string | null; intensity?: string | null; className?: string }`
- [ ] Parse `canvasLayout` JSON → `CanvasItem[]` (try/catch, return empty canvas on failure)
- [ ] Scale: `ResizeObserver` on container div → `scale = containerWidth / 392` (capped at 1)
- [ ] Render `FieldBackground` (pass `fieldTint` from `nation`) and `Vignette`
- [ ] Render each item:
  - `type === 'text'` → `TextSticker` with `isDragging=false`, wrapped in `pointer-events: none`
  - `type === 'photo'` → photo div sized by `item.size ?? 1.0` scale factor, `<img>` if `item.text` is a real URL, placeholder otherwise
  - `type === 'voice'` → `VoiceChip`-style display (no tap-to-play)
  - `type === 'link'` → `LinkChip`-style display
- [ ] No `TopChrome`, `ToolRail`, `BottomChrome`, `CompostNode`
- [ ] `pointer-events: none` on the entire canvas layer

### 3.2 Detail page integration
- [ ] In `src/app/bars/[id]/page.tsx`: import `CanvasPreview`, `ELEMENT_TOKENS`, `ElementKey`
- [ ] When `bar.canvasLayout` is present: render `<CanvasPreview>` above `BarFaceBackTabs`
  - Container: `max-w-sm mx-auto rounded-[28px] overflow-hidden`
- [ ] Render element + charge badge row beneath the canvas preview:
  - Element: `ELEMENT_TOKENS[nation].sigil` + `nation` name, colored with `tok.gem`
  - Charge: `parseInt(intensity)` filled dots (●) out of 5, colored with element gem or purple
- [ ] Old-format BARs (no `canvasLayout`): no change to existing rendering
- [ ] Run `npm run check`

### 3.3 Feed card fallback
- [ ] In `src/app/bars/page.tsx`: add `canvasLayout` to the Prisma query for the bars list
- [ ] Import `deriveCanvasPreviewText` from `@/lib/canvas-utils`
- [ ] For each BAR in the list: pass `description: bar.description || deriveCanvasPreviewText(bar.canvasLayout) || '—'` to `BarCardFace`
- [ ] Check any other files that render `BarCardFace` with BAR data — apply same fallback
- [ ] Run `npm run check`

### 3.4 Final verification
- [ ] `npm run check` — zero type errors
- [ ] `npm run build` — no build errors
- [ ] Manual: run `cert-canvas-bar-display-v1` (8 steps in spec)
- [ ] Verify old-format BARs still render correctly
- [ ] Verify photo stickers show real images after reload (URL persistence fix working)
- [ ] Verify feed cards show sticker text for canvas BARs
