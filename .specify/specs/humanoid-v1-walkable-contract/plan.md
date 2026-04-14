# Plan: Humanoid v1 walkable contract

Implement per [.specify/specs/humanoid-v1-walkable-contract/spec.md](./spec.md).

## Steps

1. Diff current `RoomCanvas` / `getWalkableSpriteUrl` assumptions against [humanoid_v1_spec.md](../../../docs/conclave/construc-conclave-9/humanoid_v1_spec.md) (frame count, order, anchor).
2. Add JSON sidecar for pilot asset(s) under `public/sprites/walkable/` if missing; align filenames with doc conventions.
3. Implement `scripts/validate-walkable-humanoid.ts` (or extend existing script) — image dimensions + optional JSON parse.
4. Wire `npm run` entry in `package.json` if stable.
5. Update [docs/WALKABLE_SPRITES.md](../../../docs/WALKABLE_SPRITES.md) with contract summary and link to this spec.

## File impacts (expected)

- `public/sprites/walkable/*.json` (sidecars)
- `scripts/validate-walkable-humanoid.ts`
- `package.json` script
- `docs/WALKABLE_SPRITES.md`
- Possibly `RoomCanvas.tsx` if anchor/frame mapping correction needed

## Related

- [pixel-identity-system-v0 plan](../pixel-identity-system-v0/plan.md)
