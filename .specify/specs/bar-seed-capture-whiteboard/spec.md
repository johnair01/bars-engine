# Spec: BAR Seed Capture Whiteboard

## Purpose

Replace the form-based BAR creation flow with a mobile-first, freeform **canvas** where a player composes a seed the way they'd build an Instagram Story: dragging text stickers, photo cards, voice chips, and link chips onto a dark atmospheric canvas, attuning to one of the five Wuxing elements, and setting a charge level before capturing the seed as a BAR.

**Problem**: Current BAR creation (`/hand`, `SeamBarCreate`) is a text form — functional but devoid of ritual. The canvas interaction makes *composing* a BAR feel like making a talisman, not filling out a ticket. The emotional charge and element attunement become first-class acts, not optional metadata.

**Practice**: Deftness Development — API-first, reuse existing schema columns where possible, React pointer-event drag (no third-party DnD library), client-only canvas state until `Capture this seed →` fires a single server action.

## Relationship to existing specs

| Spec | Relationship |
|------|-------------|
| [bars-ui-overhaul](../bars-ui-overhaul/spec.md) | Provides the BAR schema, `createBarForUpload`, `createPlayerBar`, Asset model, and talisman receive UX this spec calls into at capture time. |
| [bar-working-layer](../bar-working-layer/spec.md) | BAR Working (Clean Up) is the *next* step after capture; the canvas sets `maturity: 'captured'` and hands off. |
| [bar-seed-metabolization](../bar-seed-metabolization/spec.md) | Maturity lifecycle; canvas sets initial `seedMetabolization.maturity = 'captured'` and `soilKind`. |
| [charge-capture-ux-micro-interaction](../charge-capture-ux-micro-interaction/spec.md) | Charge selector on the canvas shares the visual segment metaphor from that spec. |

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Route** | `/bars/capture` (new page). Entry points: "New BAR" CTA on `/hand`, share-as-BAR flow, adventure seam. |
| **Canvas dimensions** | Internal logical size 392×812 (portrait phone). Rendered in a `position:relative; overflow:hidden; border-radius:38px` shell. Scale via `CSS transform:scale()` to fill viewport on desktop. |
| **Item types** | Four sticker types: `text`, `photo`, `voice`, `link`. Each absolutely positioned by center `(x,y)` + `rot`. |
| **Drag implementation** | Native pointer events (`pointerdown/move/up` + `setPointerCapture`). No DnD library. Scale-aware: `dx = clientDx / (boardRect.width / 392)`. |
| **Compost node** | Visible only while dragging. Dragging an item to `y > 512` shows earth-toned pulse ring. On `pointerup` over compost → item removed from canvas state. Reframes delete as "Compost." |
| **Element lock** | `fieldTint: ElementKey \| null`. Drives field background gradient, charge bar glow, default tint for new text. Stored in `CustomBar.nation` column at capture. |
| **Charge** | 1–5 integer. Stored in `CustomBar.intensity` column as string at capture (consistent with existing `intensity` field usage). |
| **Canvas layout persistence** | Store item positions + types as `CustomBar.canvasLayout String?` (new column, JSON). Enables future "re-edit" and provenance display. |
| **Capture action** | Single server action `captureBarFromCanvas(payload)`. For text-only canvases: wraps `createPlayerBar`. For canvases with photo/voice: wraps `createBarForUpload` + client-side Blob upload. Link stickers stored in `CustomBar.inputs` JSON array. |
| **Photo/voice upload** | Follows existing pattern: client gets upload URL from `createBarForUpload`, uploads blob, then calls `captureBarFromCanvas` with assetId. Voice → `audio/webm` blob via `MediaRecorder` (future phase); placeholder chip in Phase 1. |
| **State management** | Single React component state in `SeedCaptureWhiteboard`. No Zustand/context. |
| **Animation** | CSS transitions only (no Framer Motion). Field background `0.5s ease`; item lift `0.16s cubic-bezier(0.16,1,0.3,1)`; charge `0.22s ease`. Honor `prefers-reduced-motion` (disable compost pulse). |
| **Typography** | Jost (display/chrome), Nunito (body/stickers), Space Mono (mono micro-labels). All three already in BARS Engine font stack. |
| **No new DnD dep** | Framer Motion is **not** added. Pointer events + `transform: translate(-50%,-50%)` cover all cases. |
| **UI covenant** | Three-channel encoding: element=color, altitude=border, stage=density. Canvas surface uses `--bars-bg-base` (`#0a0908`) and element `frame`/`glow`/`gem` from `card-tokens.ts`. |

## Conceptual Model

| Dimension | Value |
|-----------|-------|
| **WHO** | Player (authenticated; identified by `bars_player_id` cookie) |
| **WHAT** | Canvas BAR — a composed seed with draggable stickers, element attunement, and charge level |
| **WHERE** | `/bars/capture` — dedicated mobile-first page; also reachable as a fullscreen drawer from `/hand` |
| **Energy** | Capture mints no Vibulon (that happens in BAR Working / Clean Up) |
| **Maturity** | `maturity: 'captured'`, `soilKind: 'holding_pen'` — same as existing capture flow |

### Canvas Item Types

| Type | Stored as | Notes |
|------|-----------|-------|
| `text` | `description` (first sticker) / `canvasLayout` | Primary text sticker → BAR title (first line) |
| `photo` | `Asset` + `canvasLayout` | Uploaded to Vercel Blob; follows existing `bar_attachment` pattern |
| `voice` | `Asset` (audio/webm) + `canvasLayout` | Phase 2; Phase 1: placeholder chip only |
| `link` | `CustomBar.inputs` JSON + `canvasLayout` | `{ type:'link', url, label }` entries |

## API Contracts (API-First)

### `captureBarFromCanvas` (Server Action)

**Input**:
```ts
type CanvasItem = {
  id: string
  type: 'text' | 'photo' | 'voice' | 'link'
  x: number; y: number; rot: number
  // text
  text?: string; tint?: ElementKey | null; size?: number
  // media
  assetId?: string
  // link
  url?: string; label?: string
}

type CaptureBarFromCanvasInput = {
  items: CanvasItem[]
  fieldTint: ElementKey | null  // → CustomBar.nation
  charge: 1 | 2 | 3 | 4 | 5   // → CustomBar.intensity (as string)
  provenance?: string           // e.g. "11:42 PM · auto-located"
}
```

**Output**: `{ barId: string } | { error: string }`

**Derivation rules** (server-side):
- `title` = first text sticker's first line (trimmed), max 120 chars; fallback `"Untitled seed"`
- `description` = all text sticker content joined by `\n\n`
- `type` = `"seed"` (new canonical value; fall back to `"vibe"` if not migrated)
- `nation` = `fieldTint` (normalised via existing `normalizeFieldTint`)
- `intensity` = `String(charge)`
- `canvasLayout` = `JSON.stringify(items)` (full layout for future re-edit)
- `inputs` = link items serialised: `JSON.stringify(items.filter(i=>i.type==='link').map(...))`
- `seedMetabolization` = `{ maturity: 'captured', soilKind: 'holding_pen' }`

### Photo upload flow (client)

1. Client: `createBarForUpload({ title, description, nation, intensity })` → `{ barId, uploadUrl }`
2. Client: `fetch(uploadUrl, { method:'PUT', body: photoBlob })`
3. Client calls `captureBarFromCanvas({ ..., items: [..., { type:'photo', assetId }] })`
   - Server links `assetId` to the bar

## User Stories

### P1: Compose and capture a text seed

**As a player**, I want to type my emotional spark onto a dark canvas and capture it as a BAR, so that creation feels like a ritual act, not a form submission.

**Acceptance**:
- Tapping `Aa` or empty canvas opens the text editor overlay
- Text appears as a draggable sticker on the canvas
- Tapping `Capture this seed →` creates a BAR with title = first line of primary sticker

### P1: Attune to an element

**As a player**, I want to lock the canvas to a Wuxing element, so that my BAR carries elemental meaning from the moment of capture.

**Acceptance**:
- Side rail shows 火水木金土 sigil buttons
- Tapping an element changes the field background glow and charge bar colour
- Locked element is stored as `nation` on the BAR

### P1: Set charge level

**As a player**, I want to set how charged this seed feels (1–5), so the intensity is recorded alongside the content.

**Acceptance**:
- 5-segment bar at bottom, tinted to locked element gem
- Tapping a segment sets charge; label changes (`barely a flicker` → `can't put it down`)
- Charge stored as `intensity` on the BAR

### P1: Compost a sticker

**As a player**, I want to remove a sticker from the canvas by dragging it over the Compost node, so the delete metaphor fits the game world.

**Acceptance**:
- Compost circle appears only while dragging
- Dragging an item over it lights up in earth tones with a pulse
- Releasing over it removes the item; releasing elsewhere commits new position

### P2: Add a photo sticker

**As a player**, I want to drop a photo onto my canvas, so I can bring a real-world moment into the seed.

**Acceptance**:
- Tapping the `▦` tool button opens device photo picker
- Selected photo appears as a 118×132 card sticker on the canvas
- On capture, photo is uploaded and linked as an Asset

### P2: Add a link chip

**As a player**, I want to paste a URL as a link chip sticker, so I can seed a BAR from something I found online.

**Acceptance**:
- Tapping `↗` tool opens a URL input dialog
- Submitted URL appears as a draggable chip with truncated label
- On capture, link is stored in `CustomBar.inputs`

## Functional Requirements

### Phase 1: Canvas Foundation (text, element, charge, compost)

- **FR1**: New route `/bars/capture` renders `SeedCaptureWhiteboard` full-screen
- **FR2**: Canvas component: 392×812 logical space, scales to viewport
- **FR3**: Field background gradient: layered radial + crosshatch + liminal base; updates on element lock
- **FR4**: Top chrome: story progress strip (5 segments, 62% lit), status row (time · hint · vibeulons)
- **FR5**: Tool rail (right): Aa, ▦, voice, ↗ buttons + divider + 5 element sigil tags
- **FR6**: Text editor overlay (z-index:40): size slider, centered textarea, element colour rail
- **FR7**: Draggable text stickers: pointer events, clamp region [44,348]×[122,560], lift animation
- **FR8**: Tap-to-edit: text sticker tap (< 4px move) opens editor in edit mode
- **FR9**: Empty canvas tap: opens editor in new mode
- **FR10**: Compost node: appears on drag, earth-toned active state, delete on drop
- **FR11**: Charge selector: 5 segments, element-tinted, 5 label strings
- **FR12**: Provenance line: timestamp + "auto-located"
- **FR13**: `Capture this seed →` button: calls `captureBarFromCanvas`, redirects to `/hand` on success
- **FR14**: `captureBarFromCanvas` server action: derives title, description, nation, intensity, canvasLayout, seedMetabolization

### Phase 2: Media Stickers

- **FR15**: Photo sticker: file input → local blob URL → canvas card; upload on capture via `createBarForUpload`
- **FR16**: Link chip: URL input dialog → chip sticker; stored in `inputs` on capture
- **FR17**: Voice chip: placeholder only (MediaRecorder capture deferred to Phase 3)

### Phase 3: Entry Points & Polish

- **FR18**: "New BAR" CTA on `/hand` → navigates to `/bars/capture`
- **FR19**: Adventure seam `SeamBarCreate` → option to open canvas instead of form
- **FR20**: Share-as-BAR flow: pre-populated canvas text from quest/campaign collapse
- **FR21**: `prefers-reduced-motion`: disable compost pulse, disable idle item motion

## Non-Functional Requirements

- Mobile-first, target 392px wide; responsive scaling on desktop via `transform:scale`
- No third-party DnD library
- Canvas state is client-only until `Capture this seed →`; no auto-save / realtime
- Fonts (Jost, Nunito, Space Mono) already loaded globally — no new font bundles
- `npm run check` and `npm run build` must pass

## Persisted data & Prisma

| Check | Done |
|-------|------|
| `CustomBar.canvasLayout String?` — new column for canvas item layout JSON | |
| Migration: `npx prisma migrate dev --name bar_canvas_layout` | |
| `CustomBar.intensity` already exists — repurpose for charge (String, "1"–"5") | |
| `CustomBar.nation` already exists — repurpose for element/fieldTint | |
| `npm run db:sync` after schema edit | |
| Migration SQL reviewed (additive only) | |

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| Photo upload | Vercel Blob via existing `createBarForUpload` pattern; no `public/` writes |
| Canvas JSON | `canvasLayout` is a small JSON blob (< 2 KB typical); no size concern |
| Voice (Phase 3) | `audio/webm` blob upload via Blob; set `serverActions.bodySizeLimit` if using action |

## Verification Quest

- **ID**: `cert-bar-seed-capture-v1`
- **Steps**:
  1. Navigate to `/bars/capture`
  2. Tap empty canvas → type "I went quiet in the meeting again." → tap Done
  3. Drag text sticker to a new position
  4. Lock field to Water (水) → confirm background glow changes to navy/teal
  5. Set charge to 4 → confirm label reads "hard to shake"
  6. Drag a second text sticker over the Compost node → confirm it disappears
  7. Tap `Capture this seed →` → confirm redirect to `/hand` and BAR appears with correct title, nation=water, intensity=4

## Dependencies

- [bars-ui-overhaul](../bars-ui-overhaul/spec.md) — `createBarForUpload`, `createPlayerBar`, Asset model, BAR schema extensions
- `src/lib/ui/card-tokens.ts` — `ELEMENT_TOKENS`, `ElementKey`
- `src/styles/cultivation-cards.css` — game aesthetic classes
- Fonts: Jost, Nunito, Space Mono (globally loaded)

## References

- Design handoff: `design_handoff_seed_capture_whiteboard/README.md` (in zip bundle)
- Screenshots: `screenshots/01-board.png`, `02-editor.png`, `03-compost.png`
- `src/actions/bars.ts` — `createPlayerBar`, `createBarForUpload`, `normalizeFieldTint`
- `prisma/schema.prisma` — `CustomBar.nation`, `CustomBar.intensity`, `CustomBar.seedMetabolization`
- Prisma workflow: [prisma-migration-discipline](.agents/skills/prisma-migration-discipline/SKILL.md)
- UI Covenant: [UI_COVENANT.md](../../UI_COVENANT.md)
