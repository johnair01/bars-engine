# Spec: BAR Lobby World

## Purpose

Build a mobile-first 8-bit walkable BAR lobby system — 4 nation homerooms (Pyrakanth/Lamenth/Virelune/Argyra) + shared Card Club trading floor — where players discover, craft, and distribute BARs through spatial encounter and give-one-get-one trade. Pokémon TCG GBC aesthetic. Meridia players wander all rooms as the bridge nation.

**Problem**: The spatial world infrastructure exists (Pixi.js, `SpatialMap`, anchor system) but has no BAR trading economy, no nation-specific rooms, no gift mechanic for new players, and no Pokémon-style encounter+trade loop. The game needs a social layer where BARs circulate.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Extends not replaces | Builds on `seed-spatial-world` (Pixi.js `RoomRenderer`, `SpatialMap` schema, anchor system) — do not replace |
| Trade model | Give-one-get-one: fully reciprocal. No bypass. Player selects a BAR from hand; receives one from agent. |
| Starter BAR | Gifted on room entry when hand is empty — one-time per room per session. Prevents empty-hand dead ends. |
| Meridia wanderer | No homeroom — spawns deterministically in a random nation room (seeded by `playerId + date`) |
| Asset pipeline | Flux+LoRA (same model as card art — `fal-ai/flux/dev + pytorch_lora_weights`) for backgrounds |
| Presence | No real-time WebSockets — async/snapshot presence (existing `RoomPresence` pattern) |
| Walkable sprites | Composited from 3 RGBA sprite sheets (base + nation + archetype) — same build-a-bear as `Avatar.tsx` |
| Portal transition | Fade-out → room load → fade-in between nation rooms and Card Club |
| Aesthetic reference | Pokémon TCG GBC 2000: club rooms, walking up to players, card trading, Card Pop. 32px tile grid. |

## Conceptual Model

| Dimension | Value |
|-----------|-------|
| **WHO** | Player (any nation); Meridia wanderer (bridge nation, no homeroom); GM (configures anchors) |
| **WHAT** | BAR trade (`TradeTransaction`); starter BAR gift (`StarterBAR`); nation embassy featured BARs |
| **WHERE** | `/world/[instanceSlug]/[roomSlug]` — 4 nation rooms + Card Club trading floor |
| **Energy** | BARs circulate through the economy; trades generate encounter energy |
| **Personal throughput** | Show Up — enter room → encounter → trade → ceremony → Vault |

## API Contracts (API-First)

### `tradeBAR` (Server Action)

**Input**: `{ offeredBarId: string; agentPlayerId: string; roomSlug: string }`
**Output**: `{ transaction: TradeTransaction; receivedBar: { id: string; title: string } }`

```ts
function tradeBAR(input: {
  offeredBarId: string
  agentPlayerId: string
  roomSlug: string
}): Promise<{ transaction: TradeTransaction; receivedBar: { id: string; title: string } }>
```

### `grantStarterBAR` (Server Action)

**Input**: `{ playerId: string; roomSlug: string }`
**Output**: `{ bar: { id: string; title: string } | null }` — null if already granted this session

```ts
function grantStarterBAR(input: { playerId: string; roomSlug: string }): Promise<{ bar: StartedBar | null }>
```

Called from `enterRoom` server action — idempotent per room per session.

### `getWandererSpawn` (Server Action)

**Input**: `{ playerId: string; nationKey: 'meridia' }`
**Output**: `{ roomSlug: string }` — deterministic random nation room assignment

### `getFeaturedBarsForEmbassy` (Server Action)

**Input**: `{ nationKey: string }`
**Output**: `{ bars: { id: string; title: string; creatorName: string }[] }` — up to 5, curated weekly

## User Stories

### P1: Player enters nation room and encounters Intent Agent

**As a player**, I want to walk into my nation's homeroom and encounter another player's avatar, so I can discover their BARs and trade.

**Acceptance**: Room loads with `IntentAgentSlot` avatars from recent `RoomPresence` records. Walking within 1 tile + tap opens `IntentAgentPanel` with agent's public BARs.

### P1: Player completes give-one-get-one trade with ceremony

**As a player**, I want to select a BAR from my hand, trade it, and see a ceremony animation, so the exchange feels meaningful and the received BAR lands in my Vault.

**Acceptance**: `tradeBAR` completes. `TradeCeremony` component animates card flip + element spark (~1.5s). Received BAR appears in Vault.

### P2: New player with empty hand receives starter BAR

**As a new player with no BARs**, I want to receive a starter BAR on room entry, so I can participate in the trade economy immediately.

**Acceptance**: `grantStarterBAR` called on `enterRoom` when `player.hand.length === 0`. One-time per room per session. Second entry does NOT re-grant.

### P2: Meridia player spawns in a random nation room

**As a Meridia player (earth/bridge nation)**, I want to be assigned to a random nation room on entry, so I experience all four nations as the bridge.

**Acceptance**: `getWandererSpawn` returns deterministic room slug (seeded by `playerId + date`). Meridia is never assigned Card Club as first room.

### P3: Player views nation embassy featured BARs

**As a player in Card Club**, I want to browse each nation's featured BARs at the embassy anchors, so I know what's circulating in the economy.

**Acceptance**: `nation_embassy` anchor opens `NationEmbassyPanel` with up to 5 featured BARs for that nation.

## Functional Requirements

### Phase LW-1: Asset Generation

- **FR1**: `scripts/generate-lobby-art.ts` generates 4 nation room backgrounds + trading floor + 6 anchor tiles via Flux+LoRA
- **FR2**: Assets committed to `public/lobby-art/`; fallback to procedural CSS tiles if style drift > 30%

### Phase LW-2: Schema + Room Seeding

- **FR3**: `SpatialRoom` gains: `roomType` (`nation_room|trading_floor`), `nationKey` (String?), `backgroundUrl` (String?)
- **FR4**: New `TradeTransaction` model: `id`, `offeredBarId`, `receivedBarId`, `initiatorPlayerId`, `agentPlayerId`, `roomSlug`, `completedAt`
- **FR5**: New `StarterBAR` model: `id`, `playerId`, `roomSlug`, `grantedAt`, `barId` — unique per `(playerId, roomSlug, sessionKey)`
- **FR6**: Seed script creates all 5 rooms (4 nation + Card Club) with correct anchors; `npm run seed:bar-lobby-world`

### Phase LW-3: Mobile Input

- **FR7**: Tap-to-move: click/tap on canvas → A* pathfind to tile (already implemented via `handleCanvasTap`)
- **FR8**: Virtual D-pad React overlay (`DPadOverlay.tsx`) visible on touch devices, hidden on desktop — already implemented
- **FR9**: WASD still works on desktop

### Phase LW-4: Trade Mechanic

- **FR10**: `IntentAgentPanel` extended with trade flow: agent's public BARs shown → player selects BAR from hand → confirm → `tradeBAR` action
- **FR11**: `TradeCeremony` component: card flip animation + element spark (element of received BAR) → ~1.5s → Vault
- **FR12**: `grantStarterBAR` called in `enterRoom` server action; idempotent per session

### Phase LW-5: Librarian NPC + Nation Embassies

- **FR13**: `librarian_npc` anchor opens `LibrarianNpcModal` with Regent face dialogue + starter BAR distribution
- **FR14**: `nation_embassy` anchor opens `NationEmbassyPanel` with featured BARs (up to 5, `getFeaturedBarsForEmbassy`)
- **FR15**: Giacomo seeded as `npc_slot` anchor in Card Club corner (links to ANC spec)

### Phase LW-6: Meridia Wanderer + Portal Transitions

- **FR16**: `resolveWandererSpawn(playerId): string` — deterministic random nation room, re-randomized per session
- **FR17**: Portal anchor triggers fade-out → room load → fade-in (Pixi.js alpha tween)
- **FR18**: All 4 nation rooms and Card Club traversable via portals

### Phase LW-7: Walkable Sprite System

- **FR19**: `resolveWalkableSprite(config: AvatarConfig): WalkableSpriteConfig` in `avatar-utils.ts`
- **FR20**: Base walk cycle: `public/sprites/walkable/base/{genderKey}.png` (4 files, 512×64 RGBA, 8 frames: 4 dirs × 2)
- **FR21**: Nation overlay: `public/sprites/walkable/nation/{nationKey}.png` (5 files) — hue from `ELEMENT_TOKENS`
- **FR22**: Archetype silhouette: `public/sprites/walkable/archetype/{archetypeKey}.png` (8 files)
- **FR23**: Pixi compositing: `Container` → `Sprite(baseSheet)` + `Sprite(nationSheet)` + `Sprite(archetypeSheet)` (same frame, same position)

### Phase LW-8: World Entry Point

- **FR24**: `/world` page routes player to their nation room (or random for Meridia)
- **FR25**: Dashboard has World entry point in `ThroughputLanesSection`

## Non-Functional Requirements

- No real-time WebSockets — all presence is async snapshot (`RoomPresence` pattern)
- Sprite compositing is RGBA pixel-perfect; no offsets at composite time
- `validate-sprite-layers.ts` script validates all PNG files in `public/sprites/` for RGBA + correct dimensions
- April 4 hard deadline: all rooms traversable + trade economy working + mobile input functional

## Persisted data & Prisma

| Check | Done |
|-------|------|
| `TradeTransaction`, `StarterBAR`, `SpatialRoom` extensions named above | |
| `tasks.md` includes `npx prisma migrate dev --name add_lobby_world_rooms_and_trades` | |
| `npm run db:sync` after schema edit | |
| Human reviews migration SQL — `SpatialRoom` field additions are nullable | |

**New models**:
```prisma
model TradeTransaction {
  id               String   @id @default(cuid())
  offeredBarId     String
  receivedBarId    String
  initiatorPlayerId String
  agentPlayerId    String
  roomSlug         String
  completedAt      DateTime @default(now())

  @@map("trade_transactions")
}

model StarterBAR {
  id         String   @id @default(cuid())
  playerId   String
  roomSlug   String
  sessionKey String
  barId      String
  grantedAt  DateTime @default(now())

  @@unique([playerId, roomSlug, sessionKey])
  @@map("starter_bars")
}
```

## Verification Quest

- **ID**: `cert-bar-lobby-world-v1`
- **Steps**:
  1. Navigate to `/world` — verify correct nation room loads (or random for Meridia)
  2. Walk to Intent Agent (within 1 tile) — verify `IntentAgentPanel` opens with their BARs
  3. Select a BAR from hand and trade — verify ceremony animation plays and received BAR lands in Vault
  4. Enter room with empty hand — verify starter BAR is granted; re-enter and verify it is NOT granted again
  5. Navigate via portal to Card Club — verify fade transition and all 5 rooms traversable
  6. Tap embassy anchor — verify nation featured BARs appear
- **Narrative**: "Validate the BAR lobby world so guests at the April 4 dance event can trade BARs spatially on mobile."

## Dependencies

- `seed-spatial-world` (built) — Pixi.js `RoomRenderer`, `SpatialMap` schema, anchor system
- `1.66 BLW` depends on `1.67 ANC` — Giacomo NPC seeded in Card Club
- `seed-deck-card-move-grammar` — BAR→Card grammar; cards traded in lobby
- `src/components/world/AnchorModal.tsx` — extend for `librarian_npc`, `nation_embassy`
- `src/lib/spatial-world/pixi-room.ts` — extend with Pixi layer compositing

## References

- Seed: [seed-bar-lobby-world.yaml](../../../seed-bar-lobby-world.yaml)
- Aesthetic: Pokémon TCG GBC 2000; `card-tokens.ts` for all color values; `cultivation-cards.css` for game aesthetic
- Asset pipeline: `FAL_LORA_URL` from `.env.local`
