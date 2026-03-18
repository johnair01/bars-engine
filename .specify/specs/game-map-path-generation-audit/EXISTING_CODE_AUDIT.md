# Existing Code Audit — Extend vs Compost

**Purpose**: Before Phase 1, verify what exists and decide what to extend vs compost. Ensure we build on existing work.

---

## 1. Game Map (`/game-map`)

**File**: `src/app/game-map/page.tsx`

**What it is**: Static zone hub — 11 zones as link cards (Campaign, Daily Alchemy, Quest Wallet, Quest Library, EFA, Reliquary, Nations, World Wiki, Fork, Lobby, World).

**Extend or compost?** **EXTEND**
- Keep as the top-level navigation hub. It's the "map of the world" — players land here to choose where to go.
- **Add**: Campaign zone should link to campaign lobby when player has campaign membership. Currently Campaign → `/campaign/board`. We could:
  - **Option A**: Add a new zone "Campaign Portals" or "8 Portals" that links to `/campaign/lobby?ref=X`
  - **Option B**: Make Campaign zone context-aware: if player has campaign, show "Campaign Lobby" (8 portals) as primary, "Gameboard" as secondary
  - **Option C**: Keep Campaign → board; add Campaign Lobby as a sub-link or separate zone

**Recommendation**: Add "Campaign Lobby" as a zone (or make Campaign zone have two links: "Portals" and "Gameboard"). Game-map stays the hub; we add a new destination.

---

## 2. Lobby (`/lobby`)

**File**: `src/app/lobby/page.tsx`

**What it is**: **Global** spatial lobby — tile-based walkable map (LobbyCanvas). Uses `app_config.defaultLobbyMapId` → SpatialMap with rooms, anchors. Players walk around, meet others.

**Extend or compost?** **KEEP SEPARATE**
- This is the **global** lobby (spatial, tile-based). Our campaign lobby is **campaign-specific** and non-spatial (8 portal cards).
- No compost. No merge. Different concepts:
  - `/lobby` = global spatial lobby (walk around)
  - `/campaign/lobby` = campaign-specific hub with 8 hexagram portals (new)

---

## 3. Campaign Board (`/campaign/board`)

**File**: `src/app/campaign/board/page.tsx`, `GameboardClient.tsx`

**What it is**: Gameboard with 8 slots. Draws quests from campaign deck. Kotter stage + allyship domain from instance. "← Game Map" back link. "Begin the Journey" → campaign/twine.

**Extend or compost?** **EXTEND**
- Campaign board is the **quest completion** surface. It already has:
  - `campaignRef` from URL
  - Instance (kotterStage, allyshipDomain) via getOrCreateGameboardSlots
  - Campaign deck integration
- **Add**: "Campaign Lobby" or "8 Portals" link in the header (next to "Begin the Journey"). So: Game Map ← | Support → | Begin Journey | **Portals** (new)
- Campaign board stays; we add a parallel entry point (lobby with 8 portals) that can lead *to* the board or to CYOA paths.

---

## 4. Campaign Page (`/campaign`)

**File**: `src/app/campaign/page.tsx`

**What it is**: Resolves Adventure by campaignRef (+ subcampaignDomain). For bruised-banana: redirects to initiation or campaign/twine. Otherwise: CampaignReader with Adventure + Passages (CYOA).

**Extend or compost?** **EXTEND**
- Campaign page is the **CYOA reader** entry. It resolves Adventure from DB or falls back to wake-up.
- **Add**: When `?lobby=1` or similar, or when no initiation exists, could redirect to `/campaign/lobby?ref=X` as an alternative entry. Or: campaign lobby is a separate route; campaign page stays for direct CYOA.
- **Recommendation**: Add `/campaign/lobby` as new route. Campaign page stays for direct Adventure resolution. Lobby is the "choose your portal" entry before diving into CYOA.

---

## 5. Campaign Deck

**Files**: `src/lib/gameboard.ts`, `src/lib/campaign-domain-deck.ts`, `src/actions/gameboard.ts`

**What it is**:
- `getCampaignDeckQuestIds(campaignRef, period?, playerId?)` — quests from ThreadQuest (adventure.campaignRef) + CustomBars with campaignRef. Filter by kotterStage when period provided. Filter by emotionalAlchemyTag when playerId provided.
- Deck = quests in threads with adventure.campaignRef, OR CustomBars with campaignRef + type quest/inspiration/vibe.
- **Not** "BAR seeds" — it's **actual quests** (CustomBars) that are campaign-tagged. The "seeds" concept (pre-quest templates) may not exist yet.

**Extend or compost?** **EXTEND**
- Campaign deck logic is solid. We need it for gameboard.
- **Clarification**: User said "campaign deck = BAR seeds that can be turned into quests." Current deck = **already-quests**. Seeds might mean: draft/template BARs that become quests when player engages. If so, we may need a **CampaignDeckSeed** or similar for pre-quest templates. For Phase 1, we can use existing deck (quests) and treat "portal" as entry to an Adventure; deck quests can populate rooms later.
- **Reuse**: `getCampaignDeckQuestIds` for any "what quests are available for this campaign" logic. Instance kotterStage, allyshipDomain from `getActiveInstance()`.

---

## 6. Instance (kotterStage, allyshipDomain, campaignRef)

**File**: `src/actions/instance.ts`, `prisma/schema.prisma`

**What it is**: Instance has `campaignRef`, `kotterStage` (1–8), `allyshipDomain`. `getActiveInstance()` returns current instance. Admin can set kotterStage, allyshipDomain.

**Extend or compost?** **REUSE**
- No changes needed. We'll call `getActiveInstance()` or fetch instance by campaignRef to get kotterStage, allyshipDomain for portal contextualization.

---

## 7. I Ching Casting

**File**: `src/actions/cast-iching.ts`

**What it is**: `castIChingTraditional` — 6 lines, hexagramId (1–64), transformedHexagramId, changingLines, faceMapping. `castIChing()` uses alignment context (kotterStage, nation, archetype) for weighted draw. `acceptReading` creates face-move BAR.

**Extend or compost?** **EXTEND**
- We need to **cast 8 hexagrams** for 8 portals. Options:
  - **A**: Call `castIChingTraditional` 8 times (or a variant that returns 8 distinct hexagrams). No alignment weighting for portals — we want 8 different readings.
  - **B**: New function `cast8PortalsForCampaign(campaignRef)` — draws 8 hexagram IDs (distinct or allow repeats), fetches Bar records, returns 8 portal objects.
- **Reuse**: Bar (hexagram) lookup, hexagram structure. `getHexagramStructure` from iching-struct. Kotter/domain from instance.

---

## 8. Campaign Reader / CYOA

**Files**: `src/app/campaign/components/CampaignReader.tsx`, `CampaignPassageEditModal`, etc.

**What it is**: Renders Adventure + Passages as CYOA. Fetches nodes from DB or file. PlayerAdventureProgress tracks currentNodeId.

**Extend or compost?** **REUSE**
- Portal entry = launch an Adventure. CampaignReader (or equivalent) already renders Adventures. We'll create a portal Adventure (8 entry nodes → rooms with 4 moves) and use existing play flow.
- No compost. Full reuse.

---

## 9. Dashboard / Explore Modal / GetStartedBlock

**Files**: `src/components/dashboard/ExploreModal.tsx`, `GetStartedBlock.tsx`, `src/app/page.tsx`

**What it is**: Dashboard has "Game Map" link. ExploreModal has Game Map, Quest Library. GetStartedBlock has Game Map.

**Extend or compost?** **EXTEND**
- Add "Campaign Lobby" or "Portals" when player has campaign membership. Or: Game Map already goes to game-map; game-map will have Campaign Lobby zone. No change to dashboard if we add the zone to game-map.

---

## 10. Admin Maps (Spatial)

**File**: `src/app/admin/maps/page.tsx`

**What it is**: Admin UI for SpatialMap (tile-based maps). Used for lobby, world rooms. Anchors can link to adventures (`linkedType`, `linkedId`).

**Extend or compost?** **KEEP SEPARATE**
- Spatial maps are for tile-based navigation. Campaign lobby (8 portals) is card-based, not spatial. No overlap for Phase 1.
- Future: Campaign lobby could *become* a spatial room with 8 anchor portals. For now, we're building card-based.

---

## 11. Game Map Lobbies (Archived Spec)

**Spec**: `game-map-lobbies` — Archived. "Four lobbies: Library, EFA, Dojos, Gameboard."

**What it is**: The spec described 4 lobbies as zones. Current game-map has 11 zones including Campaign, Quest Library, EFA, etc. The "four lobbies" concept evolved into the current zone grid.

**Extend or compost?** **COMPOSTED**
- Already done. Game-map is the hub. We're adding Campaign Lobby (8 portals) as a new concept, not reviving the old spec.

---

## Summary: Extend vs Compost

| Component | Action | Notes |
|-----------|--------|------|
| **game-map** | EXTEND | Add Campaign Lobby zone (or make Campaign zone dual-link) |
| **lobby** | KEEP | Global spatial; separate from campaign lobby |
| **campaign/board** | EXTEND | Add "Portals" link to campaign lobby |
| **campaign page** | EXTEND | New route `/campaign/lobby`; page stays for CYOA |
| **Campaign deck** | EXTEND | Reuse getCampaignDeckQuestIds; clarify seeds vs quests |
| **Instance** | REUSE | kotterStage, allyshipDomain, campaignRef |
| **I Ching** | EXTEND | New `cast8PortalsForCampaign` or equivalent |
| **CampaignReader** | REUSE | Portal Adventures use existing CYOA flow |
| **Dashboard/Explore** | EXTEND | Game Map → game-map; game-map has new zone |
| **Admin maps** | KEEP | Spatial; no change for Phase 1 |
| **game-map-lobbies spec** | COMPOSTED | Already archived; current zones evolved |

---

## Phase 1 Implementation: What to Build

1. **New route**: `src/app/campaign/lobby/page.tsx` — Campaign lobby with 8 portals.
2. **New action**: `cast8PortalsForCampaign(campaignRef)` — returns 8 hexagram-based portal objects.
3. **New lib**: `contextualizeHexagramForPortal(hexagramId, allyshipDomain, kotterStage)` — flavor + path hints.
4. **Extend game-map**: Add "Campaign Lobby" zone → `/campaign/lobby?ref=bruised-banana` (or derive ref from instance).
5. **Extend campaign/board**: Add "Portals" or "Lobby" link in header → `/campaign/lobby?ref=X`.
6. **Reuse**: Instance fetch, CampaignReader/Adventure flow, Bar (hexagram) data.

---

## Files to Touch (Phase 1)

| File | Change |
|------|--------|
| `src/app/campaign/lobby/page.tsx` | **Create** — campaign lobby, 8 portals |
| `src/actions/campaign-portals.ts` (or cast-iching) | **Create** — cast8PortalsForCampaign |
| `src/lib/portal-context.ts` | **Create** — contextualizeHexagramForPortal |
| `src/app/game-map/page.tsx` | **Edit** — add Campaign Lobby zone (conditional on instance) |
| `src/app/campaign/board/page.tsx` | **Edit** — add Portals link |
