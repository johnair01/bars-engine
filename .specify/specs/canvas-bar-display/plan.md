# Plan: Canvas BAR Display

## Dependency order

Phase 1 (data) must land first — nothing else works without the fields. Phase 2 (photo URL fix) is independent of Phase 3 (rendering) but should ship together so the read-only view shows real photos from day one. Phase 3 (renderer + detail + feed) is the visible payoff.

---

## Phase 1: Data layer

### 1.1 Add `canvasLayout`, `nation`, `intensity` to `getBarDetail`

In `src/actions/bars.ts`, find the `getBarDetail` function's Prisma query. Add the three fields to the select/include:

```ts
canvasLayout: true,
nation: true,
intensity: true,
```

The return type of `getBarDetail` will now include these fields. Update any TypeScript types that wrap the return value.

### 1.2 New server action: `updateCanvasPhotoUrls`

```ts
export async function updateCanvasPhotoUrls(
  barId: string,
  updates: { itemId: string; url: string }[]
): Promise<void> {
  const playerId = await getPlayerId()
  if (!playerId) return

  const bar = await prisma.customBar.findFirst({
    where: { id: barId, creatorId: playerId },
    select: { canvasLayout: true },
  })
  if (!bar?.canvasLayout) return

  const items = JSON.parse(bar.canvasLayout) as CanvasItem[]
  const patched = items.map((item) => {
    const update = updates.find((u) => u.itemId === item.id)
    return update ? { ...item, text: update.url } : item
  })

  await prisma.customBar.update({
    where: { id: barId },
    data: { canvasLayout: JSON.stringify(patched) },
  })
}
```

### 1.3 New helper: `deriveCanvasPreviewText`

```ts
// src/lib/canvas-utils.ts
import type { CanvasItem } from '@/actions/bars'

export function deriveCanvasPreviewText(canvasLayout: string | null): string | null {
  if (!canvasLayout) return null
  try {
    const items: CanvasItem[] = JSON.parse(canvasLayout)
    const first = items.find((i) => i.type === 'text' && i.text?.trim())
    if (!first?.text) return null
    return first.text.trim().slice(0, 120)
  } catch {
    return null
  }
}
```

---

## Phase 2: Photo URL persistence fix

### 2.1 Collect upload results in `handleCapture`

In `SeedCaptureWhiteboard.tsx`, `handleCapture` currently discards the return value of `uploadBarAsset`. Collect it:

```ts
const urlUpdates: { itemId: string; url: string }[] = []

await Promise.allSettled(
  mediaItems.map(async (item) => {
    if (item.type === 'photo') {
      const file = photoFilesRef.current.get(item.id)
      if (!file) return
      const { url } = await uploadBarAsset(file, { barId, side: 'front' })
      urlUpdates.push({ itemId: item.id, url })
    } else if (item.type === 'voice') {
      const blob = audioFilesRef.current.get(item.id)
      if (!blob) return
      const file = new File([blob], 'voice-memo.webm', { type: blob.type })
      const { url } = await uploadBarAsset(file, { barId, side: 'front' })
      urlUpdates.push({ itemId: item.id, url })
    }
  })
)

if (urlUpdates.length > 0) {
  await updateCanvasPhotoUrls(barId, urlUpdates)
}
```

Check the return type of `uploadBarAsset` — if it doesn't return `{ url }`, adjust accordingly.

---

## Phase 3: Read-only renderer + integration

### 3.1 `CanvasPreview` component

Create `src/components/bars/CanvasPreview.tsx` as a `'use client'` component.

Reuse these sub-components from `SeedCaptureWhiteboard` (extract to shared file or duplicate — duplication is fine for now):
- `FieldBackground`
- `Vignette`
- `TextSticker` (with `isDragging=false`, no `onPointerDown` handler — wrap div in `pointer-events: none`)
- Photo sticker JSX (inline, same as in BSCW but read-only)

Scale logic: instead of `window.innerHeight`, use a `ResizeObserver` on a container ref to compute scale from container width:
```ts
const scale = containerWidth / LOGICAL_W  // capped at 1
```

The component renders at `LOGICAL_W × LOGICAL_H` logical pixels, scaled to fit container.

No `TopChrome`, `ToolRail`, `BottomChrome`, `CompostNode` — this is the canvas content only.

### 3.2 Detail page integration

In `src/app/bars/[id]/page.tsx`:

- Import `CanvasPreview` and `ELEMENT_TOKENS`
- After `getBarDetail`, check `bar.canvasLayout`
- When present, render above `BarFaceBackTabs`:

```tsx
{bar.canvasLayout && (
  <div className="w-full max-w-sm mx-auto rounded-[28px] overflow-hidden">
    <CanvasPreview
      canvasLayout={bar.canvasLayout}
      nation={bar.nation}
      intensity={bar.intensity}
    />
  </div>
)}

{/* Element + charge badges */}
{bar.nation && (
  <div className="flex items-center gap-3">
    <span>{ELEMENT_TOKENS[bar.nation as ElementKey].sigil}</span>
    <span>{bar.nation}</span>
    {/* charge dots from bar.intensity */}
  </div>
)}
```

### 3.3 Feed card fallback

In `src/app/bars/page.tsx` (and any other BAR list callers):

- Import `deriveCanvasPreviewText`
- When building props for `BarCardFace`, use:
  ```ts
  description: bar.description || deriveCanvasPreviewText(bar.canvasLayout) || '—'
  ```

This requires `canvasLayout` to be included in the list query too. Add it to whichever Prisma query populates the bars list — select only `id, title, description, canvasLayout, assets` (don't fetch full layout for every card if the list is long; it's a TEXT column so it can be large. Consider truncating or only selecting when description is absent).

Alternative: add a `canvasPreviewText` derived column computed on write — simpler for the query but requires a migration. **Skip for now**, use client-side derivation.

### 3.4 Run `npm run check` + verify

- `npm run check` — no type errors
- Manual: run `cert-canvas-bar-display-v1` (8 steps in spec)
