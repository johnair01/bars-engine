# Tasks: BAR Lobby World

## Spec kit
- [x] `spec.md`
- [x] `plan.md`
- [x] `tasks.md`
- [ ] Register in `.specify/backlog/BACKLOG.md` (row BLW, priority 1.66)
- [ ] Run `npm run backlog:seed`

## LW-1: Asset Generation

- [ ] Create `scripts/generate-lobby-art.ts` — Flux+LoRA generation for 4 nation room backgrounds + trading floor + 6 anchor tiles
- [ ] Generate and commit to `public/lobby-art/` (fallback: procedural CSS if style drift > 30%)
- [ ] Create `docs/lobby-art-prompt-template.md`

## LW-2: Schema + Room Seeding

- [ ] Extend `SpatialRoom` in `prisma/schema.prisma`: add `roomType String?`, `nationKey String?`, `backgroundUrl String?`
- [ ] Add `TradeTransaction` model
- [ ] Add `StarterBAR` model with `@@unique([playerId, roomSlug, sessionKey])`
- [ ] Run `npx prisma migrate dev --name add_lobby_world_rooms_and_trades`
- [ ] Commit migration + schema
- [ ] Run `npm run db:sync` + `npm run check`
- [ ] Create `scripts/seed-bar-lobby-world.ts` — seeds all 5 rooms + Card Club anchors
- [ ] Add `npm run seed:bar-lobby-world` to `package.json`

## LW-3: Mobile Input (verify existing)

- [ ] Verify tap-to-move (A* pathfind) works on mobile (already in `handleCanvasTap`)
- [ ] Verify `DPadOverlay.tsx` shows on touch, hides on desktop (already implemented)
- [ ] Verify WASD on desktop unchanged

## LW-4: Trade Mechanic

- [ ] Create `src/actions/bar-trade.ts`: `tradeBAR`, `grantStarterBAR`, `getFeaturedBarsForEmbassy`
- [ ] Create `src/components/world/TradePanel.tsx` — BAR selection from hand + confirm
- [ ] Create `src/components/world/TradeCeremony.tsx` — card flip + element spark (~1.5s)
- [ ] Extend `src/components/world/IntentAgentPanel.tsx` with trade flow
- [ ] Edit `src/actions/room-presence.ts` — call `grantStarterBAR` on `enterRoom` when `hand.length === 0`
- [ ] Test: trade → `TradeTransaction` created → received BAR in Vault

## LW-5: Librarian NPC + Nation Embassies

- [ ] Create `src/components/world/LibrarianNpcModal.tsx` — Regent face dialogue + starter BAR distribution
- [ ] Create `src/components/world/NationEmbassyModal.tsx` — featured BARs list
- [ ] Extend `src/components/world/AnchorModal.tsx` with `librarian_npc` + `nation_embassy` cases
- [ ] Seed Giacomo as `npc_slot` in Card Club corner (coordinate with ANC spec)

## LW-6: Meridia Wanderer + Portal Transitions

- [ ] Create `src/lib/spatial-world/wanderer-spawn.ts` — `resolveWandererSpawn(playerId): string`
- [ ] Edit `src/actions/room-presence.ts` — Meridia spawn logic on enterRoom
- [ ] Edit `src/lib/spatial-world/pixi-room.ts` — portal `portal` transition (fade-out → route → fade-in)
- [ ] Test: Meridia player → assigned nation room; portal anchor → room transition

## LW-7: Walkable Sprite Translation Layer

- [ ] Edit `src/lib/avatar-utils.ts` — add `resolveWalkableSprite(config): WalkableSpriteConfig`
- [ ] Create base sprite sheets at `public/sprites/walkable/base/` (4 RGBA files, 512×64)
- [ ] Create nation overlay sheets at `public/sprites/walkable/nation/` (5 RGBA files, hue from `ELEMENT_TOKENS`)
- [ ] Create archetype silhouette sheets at `public/sprites/walkable/archetype/` (8 RGBA files)
- [ ] Edit `src/lib/spatial-world/pixi-room.ts` — Pixi layer compositing + element ring name tags
- [ ] Create `scripts/validate-sprite-layers.ts` — validates RGBA + correct dimensions
- [ ] Regenerate `bold-heart` outfit + accent PNGs as RGBA (currently RGB)

## LW-8: World Entry Point

- [ ] Edit `src/app/world/page.tsx` — route player to nation room (or random for Meridia)
- [ ] Edit `src/components/dashboard/ThroughputLanesSection.tsx` — add World entry point

## LW-9: Certification Quest

- [ ] Seed `cert-bar-lobby-world-v1` Twine + `CustomBar`
- [ ] Add `npm run seed:cert:bar-lobby-world` to `package.json`

## Verification

- [ ] `npm run build` passes
- [ ] `npm run check` passes (0 TypeScript errors)
- [ ] Full demo loop on mobile: enter room → encounter → trade → ceremony → Vault
- [ ] All 5 rooms traversable via portals before April 4
- [ ] Starter BAR granted once per session; second entry does not re-grant
- [ ] Walkable sprite shows nation color + archetype silhouette
