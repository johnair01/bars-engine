# Plan: Canvas Gestures & Text Editor Fixes

## Implementation order

Fix the bugs first (1.1, 1.2) — they're isolated. Then extend the gesture system (1.3) which touches the most code.

---

## Phase 1: Bug fixes

### 1.1 Fix size slider

In `TextEditorOverlay`, remove the rotated absolutely-positioned slider div. Replace with a horizontal slider row at the bottom of the overlay, below the element colour rail:

```tsx
{/* Size row */}
<div className="flex items-center gap-3 px-6 pb-4">
  <span style={{ fontFamily: 'Jost', fontWeight: 800, fontSize: 11, color: 'rgba(232,226,218,0.5)' }}>A</span>
  <input
    type="range"
    min={12}
    max={80}
    step={1}
    value={draftSize}
    onChange={(e) => onDraftSizeChange(Number(e.target.value))}
    style={{ flex: 1 }}
  />
  <span style={{ fontFamily: 'Jost', fontWeight: 800, fontSize: 22, color: 'rgba(232,226,218,0.5)' }}>A</span>
</div>
```

Also widen the min/max to `12–80` (was `16–54`) to match the free pinch range.

### 1.2 Remove tap-empty-canvas

In `SeedCaptureWhiteboard`, `handleCanvasTap` currently opens the text editor. Replace its body with a no-op (or remove it entirely and change `onPointerDown` on the canvas div to `undefined`). The canvas layer div still needs `onPointerMove` and `onPointerUp` for drag handling.

Keep `onPointerDown` on the canvas div — it's needed to detect drags that start on empty canvas (so we don't accidentally start dragging an item when the user pans). Just remove the text-editor-open logic inside it.

---

## Phase 2: Two-finger gestures

### 2.1 Extend `DragState` + add `GestureState`

Add a second ref for tracking the gesture when two pointers are active on the same item:

```ts
interface GestureState {
  pointer1Id: number
  pointer2Id: number
  itemId: string
  // positions at gesture start
  p1Start: { x: number; y: number }
  p2Start: { x: number; y: number }
  // latest positions (updated on move)
  p1Current: { x: number; y: number }
  p2Current: { x: number; y: number }
  // item state at gesture start
  originSize: number   // font px for text; scale factor for photo
  originRot: number    // degrees
  originX: number      // item center x
  originY: number      // item center y
  scale: number        // canvas scale (for coordinate conversion)
}
```

Store in `gestureRef = useRef<GestureState | null>(null)`.

### 2.2 Second-pointer detection

In `handlePointerMove` (on canvas div), add a check: if `gestureRef.current` is already active, update the matching pointer's current position and recompute size + rotation. Otherwise fall through to existing single-drag logic.

In `handlePointerUp` (on canvas div), if either `pointer1Id` or `pointer2Id` from `gestureRef.current` lifts, clear `gestureRef.current` and allow the remaining pointer to resume as a single drag (update `dragRef.current` accordingly).

**Initiating gesture**: In a new `handleSecondPointerDown` — called when `pointerdown` fires on an item AND `dragRef.current` is already set for that item:

```ts
function handleSecondPointerDown(e: React.PointerEvent, id: string) {
  const drag = dragRef.current
  if (!drag || drag.itemId !== id) return
  const item = items.find(i => i.id === id)
  if (!item) return
  const board = boardRef.current!
  const rect = board.getBoundingClientRect()
  const s = rect.width / LOGICAL_W

  const p1 = { x: drag.startX, y: drag.startY }  // first pointer's last known position
  const p2 = { x: e.clientX, y: e.clientY }

  gestureRef.current = {
    pointer1Id: drag.pointerId,
    pointer2Id: e.pointerId,
    itemId: id,
    p1Start: p1, p2Start: p2,
    p1Current: p1, p2Current: p2,
    originSize: item.size ?? (item.type === 'photo' ? 1.0 : 27),
    originRot: item.rot,
    originX: item.x,
    originY: item.y,
    scale: s,
  }
  dragRef.current = null  // suspend single drag while gesturing
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}
```

In the sticker `onPointerDown` handler, check if a drag is already active for that item and route to `handleSecondPointerDown`.

### 2.3 Gesture math

On each `pointermove` while `gestureRef.current` is set:

```ts
const g = gestureRef.current
// update current positions
if (e.pointerId === g.pointer1Id) g.p1Current = { x: e.clientX, y: e.clientY }
if (e.pointerId === g.pointer2Id) g.p2Current = { x: e.clientX, y: e.clientY }

const initDist = Math.hypot(g.p2Start.x - g.p1Start.x, g.p2Start.y - g.p1Start.y)
const curDist  = Math.hypot(g.p2Current.x - g.p1Current.x, g.p2Current.y - g.p1Current.y)
const scaleFactor = initDist > 0 ? curDist / initDist : 1

const initAngle = Math.atan2(g.p2Start.y - g.p1Start.y, g.p2Start.x - g.p1Start.x)
const curAngle  = Math.atan2(g.p2Current.y - g.p1Current.y, g.p2Current.x - g.p1Current.x)
const angleDelta = (curAngle - initAngle) * (180 / Math.PI)

setItems(prev => prev.map(it => {
  if (it.id !== g.itemId) return it
  const isPhoto = it.type === 'photo'
  const newSize = isPhoto
    ? clamp(g.originSize * scaleFactor, 0.35, 3.5)
    : clamp(Math.round(g.originSize * scaleFactor), 12, 80)
  return { ...it, size: newSize, rot: g.originRot + angleDelta }
}))
```

### 2.4 Photo size rendering

Update the photo sticker JSX to use `item.size` (default `1.0`) as a scale factor:

```ts
const photoW = Math.round(118 * (item.size ?? 1.0))
const photoH = Math.round(132 * (item.size ?? 1.0))
```

### 2.5 Type-check + verify

- `npm run check` — no errors
- Manual: run `cert-canvas-gestures-v1` (11 steps)
