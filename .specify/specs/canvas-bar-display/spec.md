# Spec: Canvas BAR Display

## Purpose

BARs created via the Seed Capture Whiteboard (`/bars/capture`) are stored with a `canvasLayout` JSON field containing the full sticker positions, element tint, and charge level. None of this is currently read or rendered anywhere — the detail page (`/bars/[id]`) and feed cards (`BarCardFace`) only know about `description` and `tags`, which are empty on canvas-captured BARs. Players see a blank shell when they open a BAR they just made.

This spec closes that gap: canvas-captured BARs should render their whiteboard visually on the detail page, and appear legibly in the feed.

---

## Design Decisions

### Read-only canvas renderer (`CanvasPreview`)

A new component that takes a parsed `CanvasItem[]` + `nation` + `intensity` and renders the frozen whiteboard: `FieldBackground`, element tint, stickers in their saved positions. No drag, no editing — `pointer-events: none` on all stickers. Scaled to fit its container (same `scale` logic as the live canvas but driven by container width, not `window` dimensions).

This component is intentionally dumb: it only renders what it receives. It does not fetch.

### Detail page

`/bars/[id]` currently calls `getBarDetail()` which does **not** select `canvasLayout`, `nation`, or `intensity` from Prisma. These three fields need to be added to the query.

When `canvasLayout` is present:
- Show `CanvasPreview` at the top of the detail page, full-width, max 520px, with the phone-frame border radius.
- Show element badge (sigil + name from `nation`) and charge dot cluster (from `intensity`) below it.
- Keep `BarFaceBackTabs` below — still useful for canvas BARs to add a written description or tags later.

When `canvasLayout` is absent (old-format BARs): detail page is unchanged.

### Feed card fallback (`BarCardFace`)

`BarCardFace` receives `description: string`. For canvas BARs, `description` is empty. The fix lives at the callsite in `bars/page.tsx` (and anywhere else BARs are listed): derive a text preview from the first text sticker in `canvasLayout` if `description` is absent.

Helper: `deriveCanvasPreviewText(canvasLayout: string | null): string | null` — parse JSON, find first `type === 'text'` item, return its `text` (trimmed, max 120 chars). Callers pass this as `description` when the real `description` is blank.

### Photo URL persistence problem

Canvas photo stickers are uploaded to Vercel Blob in `handleCapture` (client-side), but the `canvasLayout` saved in the DB still has `text: "blob:..."` (ephemeral local object URL) for photo items. These URLs are meaningless in the read-only renderer.

**Fix**: After uploading each photo in `handleCapture`, collect the returned permanent URL. Before navigating away (now: setting `captured` state), call a new server action `updateCanvasPhotoUrls(barId, updates: { itemId: string; url: string }[])` that patches the `canvasLayout` JSON in the DB, replacing each photo item's `text` with the real URL.

`uploadBarAsset` currently returns `{ url: string }`. This return value is already available — it's just discarded.

**Scope note**: Voice memo chips in `canvasLayout` have the same problem (blob URL in `text`). The same patch mechanism handles them too.

### Rendering photo stickers in `CanvasPreview`

Photo stickers with a real Vercel Blob URL render normally via `<img src={item.text}>`. If `item.text` is absent, null, or still a `blob:` URL (captured before this fix shipped), render a placeholder frame (same dark gradient frame as the live canvas).

---

## Conceptual Model

```
CustomBar
  └─ canvasLayout (JSON string)  →  CanvasPreview component (read-only render)
  └─ nation (element key)         →  element badge on detail page
  └─ intensity ("1"–"5")          →  charge dots on detail page
  └─ description (text)           →  BarFaceBackTabs (unchanged)
  └─ assets[] (uploaded files)    →  already shown in BarFaceBackTabs
```

```
Feed card (BarCardFace)
  └─ description present   →  show description text (existing behavior)
  └─ description absent    →  show deriveCanvasPreviewText(canvasLayout)
  └─ both absent           →  show "—" placeholder
```

---

## Data / API Contracts

### `getBarDetail` additions
```ts
// src/actions/bars.ts — getBarDetail query
select: {
  // existing fields...
  canvasLayout: true,   // ADD
  nation: true,         // ADD
  intensity: true,      // ADD
}
```

### New server action
```ts
// src/actions/bars.ts
export async function updateCanvasPhotoUrls(
  barId: string,
  updates: { itemId: string; url: string }[]
): Promise<void>
// Fetches canvasLayout from DB, parses JSON, replaces item.text for matching ids, writes back.
// Auth-gated: only bar creator can call this.
```

### New helper
```ts
// src/lib/canvas-utils.ts  (or co-locate in actions/bars.ts)
export function deriveCanvasPreviewText(canvasLayout: string | null): string | null
```

### New component
```tsx
// src/components/bars/CanvasPreview.tsx
interface CanvasPreviewProps {
  canvasLayout: string         // raw JSON string from DB
  nation?: string | null       // ElementKey
  intensity?: string | null    // "1"–"5"
  className?: string
}
export function CanvasPreview(props: CanvasPreviewProps): JSX.Element
```

---

## Verification Quest: `cert-canvas-bar-display-v1`

1. Create a BAR via `/bars/capture` with at least one text sticker and one photo. Capture it → overlay shows title.
2. Click "Tune now →". Verify the detail page shows the canvas layout (field background, text sticker, photo) — not a blank page.
3. Verify the element badge matches the element you set on the canvas.
4. Verify the charge level shown matches what you selected.
5. Navigate to `/bars` (feed). Find the just-captured BAR. Verify its card shows the text from the first text sticker (not blank).
6. Open a pre-existing old-format BAR. Verify its detail page is unchanged — description/tags still show normally.
7. In the detail page for the canvas BAR, go to the Back tab. Verify you can add a description and save it without breaking the canvas display.
8. Reload the canvas BAR detail page. Verify canvas still renders correctly (photo URL survived the round-trip to DB).
