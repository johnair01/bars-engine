# Spec: Canvas Gestures & Text Editor Fixes

## Purpose

Three related problems with the Seed Capture Whiteboard canvas that make it feel broken on mobile:

1. **Slider never worked** — The font-size slider in the text editor is CSS-rotated (`rotate(-90deg)`). On touch devices, the browser maps pointer coordinates to the pre-transform layout position, so dragging the visually-vertical slider does nothing. Bug, not missing feature.

2. **Text editor opens by accident** — Tapping any empty area of the canvas opens the text editor overlay. Players will constantly trigger this accidentally while browsing or repositioning items.

3. **No pinch / rotate gestures** — Placed stickers (text + photos) can only be moved. There's no way to resize or rotate them once on canvas, which is the core Instagram-Stories-style interaction the BSCW is modelling.

---

## Design Decisions

### Slider fix
Replace the rotated horizontal `<input type="range">` with a proper horizontal slider placed beneath the color swatch rail at the bottom of the `TextEditorOverlay`. Small **A** on the left, large **A** on the right — no transform, no rotation. The textarea font size updates in real-time as expected.

### Text editor trigger
- **Remove**: tap on empty canvas → open text editor
- **Keep**: tap the **Aa** button in ToolRail → open new-text editor
- **Keep**: tap an existing placed text sticker → open that sticker's editor (already implemented in `handlePointerUp`)

### Two-finger gestures on placed stickers
Single-pointer drag = move (unchanged). When a **second** pointer goes down on the **same item** while a drag is active, switch to gesture mode:

- **Pinch in/out** → scale the sticker. For text: changes `item.size` (font size, free range 12–80px). For photos: changes `item.size` as a scale factor (default `1.0`, min `0.4`, max `3.0`; renders as `118 * size` × `132 * size` px).
- **Twist** → changes `item.rot` (degrees, unbounded). Computed as the angle delta between the two-finger vector at gesture start vs. current.
- Both happen simultaneously from the same two-finger interaction.

Gesture mode exits when either pointer is released; single-pointer drag can resume after.

### Scope
- Gestures only on **placed stickers** on canvas (text and photo). Not on voice chips, link chips, or inside editor overlays.
- Photo `size` field (`number`, default `1.0`) is new on `CanvasItem`. Text already has `size`.
- No minimum snap on pinch — free continuous scale.

---

## Conceptual Model

```
One finger on sticker  →  move
Two fingers on sticker →  pinch = scale · twist = rotate (simultaneous)
Tap (no move, one finger, text sticker) → open text editor
Aa button → open text editor (new text)
Empty canvas tap → nothing (removed)
```

---

## Data / API Contracts

`CanvasItem` (already in `src/actions/bars.ts`):
- `size?: number` — already used by text (font px). For photos: treat as scale factor, default `1.0`.
- `rot: number` — already present. Unbounded degrees.

No schema changes needed — `canvasLayout` already stores the full `CanvasItem[]` as JSON.

---

## Verification Quest: `cert-canvas-gestures-v1`

1. Open `/bars/capture`. Tap empty canvas area → nothing opens.
2. Tap **Aa** button → text editor opens. Type text, tap Done → sticker placed.
3. Tap the placed text sticker → editor reopens with existing text.
4. In editor: drag size slider left/right → textarea font size updates live.
5. Place two text stickers. With one finger on one sticker, drag it → it moves. The other sticker stays put.
6. Two-finger pinch on a text sticker → font size grows/shrinks.
7. Two-finger twist on a text sticker → sticker rotates.
8. Add a photo. Two-finger pinch on the photo sticker → photo grows/shrinks.
9. Two-finger twist on the photo sticker → photo rotates.
10. Drag a resized/rotated sticker to the compost zone → it is removed.
11. Capture → BAR saved with correct canvas layout (positions, sizes, rotations preserved).
