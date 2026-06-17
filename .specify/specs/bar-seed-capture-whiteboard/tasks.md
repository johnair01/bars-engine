# Tasks: BAR Seed Capture Whiteboard

## Phase 1: Canvas Foundation

### 1.1 Schema & Server Action

- [ ] Grep `intensity` usages across codebase to confirm no conflicts before reuse; add `chargeLevel Int?` column if conflicts found
- [ ] Add `canvasLayout String?` to `CustomBar` in `prisma/schema.prisma`
- [ ] Run `npx prisma migrate dev --name bar_canvas_layout`; commit `prisma/migrations/…`
- [ ] Run `npm run db:sync`
- [ ] Add `captureBarFromCanvas` server action to `src/actions/bars.ts`:
  - Accept `{ items, fieldTint, charge, provenance? }`
  - Derive `title` (first text sticker first line, max 120 chars; fallback "Untitled seed")
  - Derive `description` (all text content joined `\n\n`)
  - Normalize `nation` via existing `normalizeFieldTint`
  - Store `intensity = String(charge)` (or `chargeLevel`)
  - Serialize `inputs` from link items: `[{ type:'link', url, label }]`
  - Serialize `canvasLayout = JSON.stringify(items)`
  - Set `seedMetabolization = { maturity:'captured', soilKind:'holding_pen' }` via `mergeSeedMetabolization`
  - Return `{ barId }` or `{ error }`
- [ ] Run `npm run check` — types pass

### 1.2 Route

- [ ] Create `src/app/bars/capture/page.tsx`
  - RSC; auth guard → redirect to `/login` if no `bars_player_id` cookie
  - Renders `<SeedCaptureWhiteboard />`

### 1.3 Component Shell

- [ ] Create `src/components/bars/SeedCaptureWhiteboard.tsx` (Client Component)
- [ ] Implement 392×812 logical canvas container with `position:relative; overflow:hidden; border-radius:38px`
- [ ] Implement viewport scale wrapper (`transform:scale(vw/392)`, `transform-origin:top center`)
- [ ] Implement field background CSS with `--field-tint-frame/glow` CSS custom properties; update on `fieldTint` change with `0.5s ease` transition
- [ ] Add `@keyframes barsCompostPulse` to `src/styles/cultivation-cards.css`

### 1.4 Top Chrome

- [ ] Story progress strip: 5 equal segments, `height:3px`, segment 1 filled 62% with liminal glow
- [ ] Status row: left time (`new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})`), center hint `drag to move · tap to edit`, right `♦ 1428` placeholder

### 1.5 Tool Rail

- [ ] Four tool buttons (Aa, ▦, waveform glyph, ↗) — 40×40, `border-radius:12px`, backdrop blur
- [ ] Divider: `width:30px; height:1px; background:rgba(255,255,255,0.14)`
- [ ] Five element rows: label (Space Mono 8.5px uppercase) + 34×34 sigil button
- [ ] Element sigil active state: gem color, frame box-shadow, text-shadow glow (from `ELEMENT_TOKENS`)
- [ ] Tap element → set `fieldTint`; tap again → clear

### 1.6 Canvas Items & Drag

- [ ] Seed initial `items` state with default text sticker: `"I went quiet in the\nmeeting again."`, x184, y218, rot −2, tint=water, size 27
- [ ] Render text stickers as absolutely-positioned divs: Nunito 700, element gem text color, text-shadow, `max-width:300px`, `border-radius:9px`
- [ ] Implement pointer drag handlers on each item:
  - `onPointerDown`: record start (pointer id, start coords, item origin, board rect, scale)
  - `onPointerMove`: compute delta/scale; if `hypot > 4` mark moved; update position (clamped); set `overTrash` if item-y > 512
  - `onPointerUp`: release; delete if `overTrash`; open editor if not moved (text) ; commit position
- [ ] Drag lift animation: `scale(1.04)`, `filter:brightness(1.06)drop-shadow(…)`, inset ring
- [ ] Empty-canvas `onPointerDown` → open editor in new mode (after `stopPropagation` on items)

### 1.7 Compost Node

- [ ] Render compost circle only when `dragId !== null`
- [ ] Position: centered horizontal, `bottom:196px`, `z-index:34`, `pointer-events:none`
- [ ] Idle style: `rgba(5,4,3,0.66)` bg, inset border, trash glyph + "COMPOST" label
- [ ] Active (`overTrash`) style: earth-gem color, frame box-shadow, `scale(1.12)`, `barsCompostPulse` animation

### 1.8 Bottom Chrome

- [ ] Charge selector header: label text + charge copy (`barely a flicker` | `a low hum` | `it's sitting with me` | `hard to shake` | `can't put it down`)
- [ ] 5 charge segments: `flex:1; height:5px; border-radius:3px`; off = `rgba(255,255,255,0.13)`; on ≤ current = element gem + glow shadow
- [ ] Segment click → set `charge` (1–5)
- [ ] Provenance line: `{time} · auto-located`, Space Mono 9px uppercase
- [ ] `Capture this seed →` button: full-width, liminal purple, Jost 700 15.5px
- [ ] Button `onClick`: call `captureBarFromCanvas`, show loading state, redirect to `/hand` on success, show inline error on failure

### 1.9 Text Editor Overlay

- [ ] Renders when `editing !== null`: full-screen, `z-index:40`, `background:rgba(5,4,3,0.9)`, `backdrop-filter:blur(9px)`
- [ ] Top bar: hint `COMPOSE · TYPE YOUR SPARK` (Space Mono 9px uppercase) + Done pill button (liminal)
- [ ] Vertical size slider: `<input type="range" min="16" max="54">`, rotated −90°, positioned `left:6px; top:50%`, small-A / large-A labels
- [ ] Textarea: centered, transparent bg, Nunito 700, font-size from `draftSize`, color from `draftTint` gem; placeholder `type your spark…`; auto-focus; `caret-color: var(--bars-liminal-glow)`
- [ ] Element colour rail: 6 swatches (none = `#f4f1ec`, then 5 element frames); `border-radius:50%`; selection ring (`0 0 0 2px #050403, 0 0 0 4px <gem>`); `scale(1.08)` on selected
- [ ] Done / backdrop tap: if new + non-empty → add sticker at x196 y300 rot 0; if edit + empty → delete sticker; else update sticker; close editor
- [ ] Non-none tint selection relocks `fieldTint`

### 1.10 Verify Phase 1

- [ ] Run `npm run build`
- [ ] Run `npm run check`
- [ ] Manual: complete Verification Quest steps 1–7 (see spec)

---

## Phase 2: Media Stickers

- [ ] Photo sticker — tool button wires hidden `<input type="file" accept="image/*">`
- [ ] Photo sticker — FileReader → dataUrl → add photo item at x130 y300 rot −4
- [ ] Photo sticker — render: 118×132 card, gradient body, `<img>` with `object-fit:cover` when dataUrl present
- [ ] Photo sticker — capture: if photo item without assetId → `createBarForUpload` → PUT blob → link assetId
- [ ] Link chip — tool button opens small URL input overlay
- [ ] Link chip — submit URL → add link item at x176 y520 rot −2; label = URL host (no fetch in v1)
- [ ] Link chip — render: dark bg chip, `max-width:210px`, ↗ glyph, truncated label
- [ ] Link chip — capture: serialize to `inputs` JSON
- [ ] Voice chip placeholder — tool button adds static `{ type:'voice', label:'0:14 voice', x:296, y:300, rot:4 }` chip
- [ ] Voice chip render: mini waveform (5 bars), `0:14 voice` label, water-tinted bg

---

## Phase 3: Integration & Polish

- [ ] Add "Capture a seed" entry point to `/hand` page (`router.push('/bars/capture')`)
- [ ] `SeamBarCreate` — add "Open canvas" link alongside existing form
- [ ] URL param pre-population: `?text=<encoded>` → pre-seed first text sticker on mount
- [ ] `prefers-reduced-motion` — disable `barsCompostPulse` and set all CSS transitions to `0s`
- [ ] Keyboard: Escape → close editor without saving; Cmd/Ctrl+Enter → commit editor
- [ ] ARIA: canvas `role="region" aria-label="Seed canvas"`; compost `role="img" aria-label="Compost — drag here to remove"`
- [ ] Voice recording (MediaRecorder): `getUserMedia({ audio:true })`, tap to start/stop, max 60s, upload blob on capture
- [ ] Final `npm run build` + `npm run check`
- [ ] Certification Quest: `cert-bar-seed-capture-v1` run-through
