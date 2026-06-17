# Plan: BAR Seed Capture Whiteboard

## Implementation Order

Generative dependency: Phase 1 (canvas foundation + server action) unlocks everything else. Ship Phase 1 as a complete, usable feature before starting Phase 2.

---

## Phase 1: Canvas Foundation

### 1.1 Schema + server action

1. Add `canvasLayout String?` to `CustomBar` in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name bar_canvas_layout`; commit migration
3. Add `captureBarFromCanvas` server action to `src/actions/bars.ts`:
   - Accepts `{ items, fieldTint, charge, provenance? }`
   - Derives `title`, `description`, `nation`, `intensity`, `inputs`, `canvasLayout`, `seedMetabolization`
   - Calls existing `db.customBar.create` (mirrors `createPlayerBar` internals)
   - Returns `{ barId }` or `{ error }`

### 1.2 Route

4. Create `src/app/bars/capture/page.tsx` — thin RSC that renders `<SeedCaptureWhiteboard />`
5. Ensure auth guard: redirect to `/login` if no `bars_player_id` cookie

### 1.3 `SeedCaptureWhiteboard` component

Location: `src/components/bars/SeedCaptureWhiteboard.tsx`

Build in this order (each step is independently testable):

**a. Shell + field background**
- 392×812 container, `position:relative; overflow:hidden; border-radius:38px`
- `transform:scale(viewport/392)` wrapper for desktop
- Field background CSS: layered radial + crosshatch + liminal; CSS custom properties for `--field-tint-frame/glow`; React state `fieldTint: ElementKey | null`; `transition: background 0.5s ease`

**b. Top chrome**
- Story progress strip: 5 segments (static, 62% fill on segment 1)
- Status row: time (`Date` formatted), hint, vibulon count placeholder

**c. Tool rail**
- Four tool buttons (Aa, ▦, voice, ↗) with correct sizing and backdrop blur
- Divider
- Five element rows (label + sigil button); active state uses element gem/frame tokens from `ELEMENT_TOKENS`
- Tap → set `fieldTint`; tap again → clear

**d. Canvas items layer**
- `items: CanvasItem[]` state (seeded with one default text sticker: "I went quiet in the\nmeeting again.", x184, y218, rot −2, tint=water, size 27)
- Render each item at `position:absolute; left:x; top:y; transform:translate(-50%,-50%) rotate(rot deg)`
- Text sticker: Nunito 700, element gem color, text-shadow, hover/drag states

**e. Pointer drag**
- `onPointerDown`: capture pointer, record start
- `onPointerMove`: compute delta / scale; if `hypot > 4` → dragging; clamp to [44,348]×[122,560]; if item-center `y > 512` → `overTrash = true`
- `onPointerUp`: release; if over trash → delete; else if not moved → open editor (text items); else commit position
- Dragging lift: `scale(1.04)`, brightness filter, inset ring

**f. Compost node**
- Renders only when `dragId !== null`
- Centered, `bottom:196px`, `z-index:34`, `pointer-events:none`
- Idle vs active (`overTrash`) states; `barsCompostPulse` keyframe animation (CSS)

**g. Bottom chrome + charge selector**
- Charge header row (label + current level copy)
- 5 segment taps → set `charge`; segments glow with element gem
- Provenance line (timestamp)
- `Capture this seed →` button: liminal purple, full-width; `onClick` calls `captureBarFromCanvas`, handles loading/error, redirects

**h. Text editor overlay**
- Renders when `editing !== null` (full-screen, `z-index:40`, dark blur backdrop)
- Top bar: hint + Done button
- Vertical size slider (`range`, min 16 max 54): rotated −90°, positioned `left:6px; top:50%`
- Textarea: centered, transparent, auto-focused, font mirrors draft tint + size
- Element colour rail: 6 swatches (none + 5 elements); selection ring
- Done / tap-backdrop: commit (new → add sticker; edit → update; empty → delete)

### 1.4 CSS

- Add `@keyframes barsCompostPulse` to `src/styles/cultivation-cards.css`
- Field background and element CSS custom properties in same file or a new `src/styles/seed-capture.css`
- No new Tailwind plugins; layout via Tailwind (`flex`, `absolute`, `z-*`, `w-`, `h-`)

---

## Phase 2: Media Stickers

### 2.1 Photo sticker

- Tap ▦ → `<input type="file" accept="image/*">` (hidden, triggered by click)
- Read file into `FileReader` → `dataUrl`; add `{ type:'photo', assetId:null, dataUrl, x:130, y:300, rot:-4 }` to items
- On capture: if any photo items without `assetId` → call `createBarForUpload` → PUT blob → get assetId → include in `captureBarFromCanvas` payload
- Render: 118×132 `border-radius:11px` card, gradient body, `object-fit:cover` img when dataUrl set

### 2.2 Link chip

- Tap ↗ → inline URL input (small overlay or bottom sheet)
- Submit → fetch `<link>` title via `/api/link-preview?url=…` (add simple route; 1s timeout, fallback to URL host)
- Add `{ type:'link', url, label, x:176, y:520, rot:-2 }` to items
- Render: dark chip, `max-width:210px`, truncated label, ↗ glyph

### 2.3 Voice chip (placeholder)

- Tap voice button → adds static placeholder chip `{ type:'voice', label:'0:14 voice', x:296, y:300, rot:4 }`
- MediaRecorder implementation deferred to Phase 3

---

## Phase 3: Integration & Polish

### 3.1 Entry points

- `/hand` page: add "Capture a seed" button → `router.push('/bars/capture')`
- `SeamBarCreate` adventure seam: add "Open canvas" link alongside existing form
- Collapse-to-BAR share flow: `router.push('/bars/capture?text=<encoded>')` — canvas pre-populates first text sticker

### 3.2 Accessibility & motion

- `prefers-reduced-motion: reduce` → disable `barsCompostPulse` and item idle drift
- Keyboard: Escape → close text editor; Enter (meta/ctrl) → Done
- ARIA: canvas region labeled "Seed canvas", compost node role="button" aria-label="Compost — drag here to remove"

### 3.3 Voice capture (Phase 3)

- `MediaRecorder` + `getUserMedia({ audio: true })` for voice note recording
- Max 60s; produces `audio/webm` blob
- Upload via existing Blob pattern on capture
- Waveform chip: static 5-bar graphic (real waveform visualization deferred)

---

## Critical Files

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add `canvasLayout String?` |
| `prisma/migrations/…/migration.sql` | New migration (additive) |
| `src/actions/bars.ts` | Add `captureBarFromCanvas` |
| `src/app/bars/capture/page.tsx` | New route |
| `src/components/bars/SeedCaptureWhiteboard.tsx` | Main canvas component (large, ~600 lines) |
| `src/styles/cultivation-cards.css` | Add `barsCompostPulse` keyframe + field bg vars |
| `src/app/hand/page.tsx` (or client) | Add "Capture a seed" CTA |

## Risk Flags

| Risk | Mitigation |
|------|------------|
| `intensity` field currently `String?` with unclear existing semantics | Grep existing uses before capture; if conflicts, add `chargeLevel Int?` column instead |
| Pointer events on mobile Safari (iOS) | Test `setPointerCapture` compat; fallback to `touchstart/move/end` if needed |
| Canvas scale on desktop clipping items outside logical bounds | Apply `transform-origin: top center`; test at 1440px viewport |
| Photo upload payload size | Use client-side Blob URL for preview; only upload on capture (not on file select) |
