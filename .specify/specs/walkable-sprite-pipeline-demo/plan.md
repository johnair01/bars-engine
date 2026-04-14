# Plan: Walkable Sprite Pipeline Demo

## Files

| File | Change |
|------|--------|
| [`src/app/world/[instanceSlug]/[roomSlug]/page.tsx`](../../../src/app/world/[instanceSlug]/[roomSlug]/page.tsx) | Optional demo URL via env |
| [`src/app/world/[instanceSlug]/[roomSlug]/RoomCanvas.tsx`](../../../src/app/world/[instanceSlug]/[roomSlug]/RoomCanvas.tsx) | WASD keybindings |
| [`src/lib/avatar-utils.ts`](../../../src/lib/avatar-utils.ts) | Optional helper `getWalkableSpriteDemoUrl()` or inline in page |
| `public/sprites/walkable/argyra-bold-heart.png` | Demo asset |
| [`docs/WALKABLE_SPRITES.md`](../../../docs/WALKABLE_SPRITES.md) | Env + demo instructions |

## Order

1. Asset on disk  
2. Env-gated URL resolution  
3. WASD in `RoomCanvas`  
4. Doc update  

## Verification

`npm run check`, manual world room walk with demo env.
