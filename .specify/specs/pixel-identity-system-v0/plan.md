# Plan: Pixel identity system v0

Implement per [.specify/specs/pixel-identity-system-v0/spec.md](./spec.md).

## Order

1. Land [humanoid-v1-walkable-contract](../humanoid-v1-walkable-contract/spec.md) checklist alignment with existing `public/sprites/walkable` and Pixi code.
2. Add `CharacterIdentity` types + `resolveWalkableSprite` (wrap `getWalkableSpriteUrl` or merge).
3. Migrate call sites incrementally (world room, any avatar picker using walkable).
4. Optional Phase 1: layer registry design doc + spike (separate PR if large).

## File impacts (expected)

- `src/lib/avatar-utils.ts` or new `src/lib/pixel-identity/` module
- `src/app/world/.../RoomCanvas.tsx` (import path only if needed)
- `docs/WALKABLE_SPRITES.md` — anchor/frame reference to humanoid v1

## Out of scope (v0)

- Full runtime compositor and AI bake pipeline.
- NPC crowd systems (see walkable-sprites-implementation backlog).

## Related

- [GAP_ANALYSIS.md](../../../docs/conclave/construc-conclave-9/GAP_ANALYSIS.md)
