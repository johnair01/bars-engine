# Plan: BAR Lobby World

## Architecture

Extends the existing spatial world infrastructure (`seed-spatial-world`, built). Does not replace `RoomRenderer`, `SpatialMap` schema, or the anchor system. New rooms are seeded as `SpatialMap` + `SpatialRoom` records. Trade economy adds two new models (`TradeTransaction`, `StarterBAR`). The walkable sprite system extends `avatar-utils.ts` with a resolver that maps `AvatarConfig` → three composited RGBA sprite sheets — same architecture as portrait `Avatar.tsx`.

## File Impact

### New Files

| File | Purpose |
|------|---------|
| `prisma/migrations/[ts]_add_lobby_world_rooms_and_trades/` | `TradeTransaction`, `StarterBAR`; extend `SpatialRoom` |
| `scripts/seed-bar-lobby-world.ts` | Seeds all 5 rooms + Card Club anchors |
| `scripts/generate-lobby-art.ts` | Flux+LoRA asset generation for room backgrounds + anchor tiles |
| `src/actions/bar-trade.ts` | `tradeBAR`, `grantStarterBAR`, `getFeaturedBarsForEmbassy` |
| `src/components/world/TradePanel.tsx` | BAR selection panel for trade |
| `src/components/world/TradeCeremony.tsx` | Card flip + element spark ceremony animation |
| `src/components/world/LibrarianNpcModal.tsx` | Librarian NPC dialogue + starter BAR distribution |
| `src/components/world/NationEmbassyModal.tsx` | Embassy: featured BARs for nation |
| `src/lib/spatial-world/wanderer-spawn.ts` | `resolveWandererSpawn(playerId): string` |
| `src/lib/spatial-world/portal-transition.ts` | Pixi.js fade-out/fade-in room transition |
| `scripts/validate-sprite-layers.ts` | Validates all PNG files: RGBA + correct dimensions |
| `public/sprites/walkable/base/` | 4 RGBA sprite sheets (512×64, 8 frames) |
| `public/sprites/walkable/nation/` | 5 RGBA nation overlay sheets |
| `public/sprites/walkable/archetype/` | 8 RGBA archetype silhouette sheets |
| `public/lobby-art/` | 5 room backgrounds + 6 anchor tiles |

### Modified Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `TradeTransaction`, `StarterBAR`; extend `SpatialRoom` |
| `src/lib/avatar-utils.ts` | Add `resolveWalkableSprite(config): WalkableSpriteConfig` |
| `src/lib/spatial-world/pixi-room.ts` | Add Pixi layer compositing for walkable sprites + portal transition + element ring name tags |
| `src/components/world/IntentAgentPanel.tsx` | Extend with trade flow |
| `src/components/world/AnchorModal.tsx` | Add `librarian_npc` + `nation_embassy` cases (already has `LibrarianNpcModal` stub) |
| `src/actions/room-presence.ts` | Call `grantStarterBAR` on `enterRoom` when hand empty |
| `src/app/world/page.tsx` | Route player to nation room (or random for Meridia) |
| `src/components/dashboard/ThroughputLanesSection.tsx` | Add World entry point |

## Key Patterns

- **Sprite compositing follows Avatar.tsx**: base + nation + archetype sheets stacked via Pixi `source-over`. Same pixel-perfect RGBA registration as portrait layers. No offsets at composite time.
- **Trade is synchronous client-side then confirmed**: `TradePanel` → user selects BAR → confirm → `tradeBAR` action → `TradeCeremony` plays. Receipt BAR is optimistic-displayed during ceremony.
- **Starter BAR idempotency**: `StarterBAR` has `@@unique([playerId, roomSlug, sessionKey])`. Session key = `date + roomSlug` hash. Same session = no re-grant.
- **Asset fallback**: If Flux+LoRA produces style-inconsistent art after 2 attempts, fall back to procedural CSS tiles using `ELEMENT_TOKENS` from `card-tokens.ts`.

## Dependencies

- Spatial world (built): `RoomRenderer`, `SpatialMap`, `SpatialRoom`, `RoomPresence`
- `src/lib/avatar-utils.ts` — `AvatarConfig`, `parseAvatarConfig`
- `src/lib/ui/card-tokens.ts` — element token colors for nation overlays
- ANC spec (Giacomo) — Giacomo seeded as `npc_slot` in Card Club
- `FAL_LORA_URL` env var for asset generation

## Risk / Trade-offs

- Asset generation (LW-1) is blocking for demo-quality but not for functionality. Implement procedural fallback first so dev can proceed without waiting for AI assets.
- Walkable sprite sheets (LW-7) can ship without archetype silhouettes in v1 — base + nation color is sufficient to demo identity. Archetype silhouettes are Phase 2.
- Portal transitions (LW-6) are cosmetic — implement as simple `router.push` first; add Pixi alpha tween as polish.
