# Tasks: Canvas Gestures & Text Editor Fixes

## Phase 1: Bug fixes

### 1.1 Fix size slider

- [ ] In `TextEditorOverlay`: remove the rotated absolutely-positioned slider div (lines ~722–746)
- [ ] Add horizontal size row below the element colour rail: `<input type="range" min={12} max={80}>` with small/large **A** labels, no transform
- [ ] Widen `draftSize` initial value range if needed (default `30` is fine, clamp is 12–80)
- [ ] Run `npm run check` — types clean

### 1.2 Remove tap-empty-canvas

- [ ] In `handleCanvasTap`: remove the `setEditing('new')` call and related draft-reset logic
- [ ] The handler can be a no-op or removed entirely — keep `onPointerDown` on canvas div for drag-start detection if needed, or just remove it
- [ ] Confirm tapping empty canvas no longer opens editor; Aa button still does

---

## Phase 2: Two-finger gestures

### 2.1 Extend gesture tracking

- [ ] Add `GestureState` interface (pointer1Id, pointer2Id, itemId, p1/p2 start/current, originSize, originRot, originX, originY, scale)
- [ ] Add `gestureRef = useRef<GestureState | null>(null)` to main component

### 2.2 Second-pointer initiation

- [ ] Add `handleSecondPointerDown(e, id)` function — fires when `pointerdown` hits an item that already has an active drag
- [ ] In `TextSticker` and photo sticker `onPointerDown`: check `dragRef.current?.itemId === id` and call `handleSecondPointerDown` if so, else call existing `handleItemPointerDown`
- [ ] `handleSecondPointerDown` captures second pointer, populates `gestureRef.current`, clears `dragRef.current`

### 2.3 Gesture math in `handlePointerMove`

- [ ] At top of `handlePointerMove`: if `gestureRef.current` is set, update the matching pointer's current position, compute `scaleFactor` and `angleDelta`, update item `size` + `rot` via `setItems`, return early
- [ ] Clamp: text `size` → `clamp(round(originSize * scaleFactor), 12, 80)`; photo `size` → `clamp(originSize * scaleFactor, 0.35, 3.5)`

### 2.4 Gesture exit in `handlePointerUp`

- [ ] If lifted pointer matches `gestureRef.current?.pointer1Id` or `pointer2Id`, clear `gestureRef.current` and `setDragId(null)`
- [ ] Resume single-drag for the remaining pointer if needed (or just let user re-initiate)

### 2.5 Photo size rendering

- [ ] In the photo sticker JSX: compute `photoW = 118 * (item.size ?? 1.0)`, `photoH = 132 * (item.size ?? 1.0)`, use for `width`/`height` style props

### 2.6 Final check

- [ ] `npm run check` — no type errors
- [ ] Manual: run `cert-canvas-gestures-v1` (11 steps in spec)
- [ ] Verify slider updates textarea font size live
- [ ] Verify empty canvas tap does nothing
- [ ] Verify pinch-resize on text and photo
- [ ] Verify twist-rotate on text and photo
- [ ] Verify compost still works after resize/rotate
