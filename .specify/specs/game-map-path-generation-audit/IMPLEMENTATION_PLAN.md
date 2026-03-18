# Implementation Plan: Campaign Lobby Path Map

**Source**: [AUDIT.md](AUDIT.md), [INTERVIEW_AND_GM_CONSULT.md](INTERVIEW_AND_GM_CONSULT.md)

---

## Overview

| Phase | Scope | Est. Effort |
|-------|-------|-------------|
| **Phase 1** | Campaign lobby page, 8-portal UI, hexagram cast + contextualize | 2–3 days |
| **Phase 2** | Campaign deck (BAR seeds), portal → Adventure wiring | 2–3 days |
| **Phase 3** | Branch nodes with 4 moves, Grow Up → schools CYOA | 2–3 days |
| **Phase 4** | Wake Up room generation (321 + unpacking → AI/admin) | 3–5 days |
| **Phase 5** | Path sharing, vibeulon costs, polish | 2–3 days |

---

## Phase 1: Campaign Lobby + 8 Portals

### 1.1 New Route: Campaign Lobby

- **Route**: `/campaign/lobby?ref={campaignRef}` (or `/campaign/{ref}/lobby`)
- **Purpose**: Campaign-specific lobby as hub. Replaces or extends entry point for campaign players.
- **Data**: Instance (kotterStage, allyshipDomain, campaignRef), player membership.

**Tasks**:
- [ ] Create `src/app/campaign/lobby/page.tsx`
- [ ] Fetch instance by campaignRef; require player membership
- [ ] Render lobby shell (header, campaign name, Kotter stage label)
- [ ] Link from game-map and campaign/board to lobby

### 1.2 Cast 8 Hexagrams

- **Action**: `cast8Portals(campaignRef)` or equivalent
- **Logic**: Cast I Ching 8 times (or draw 8 distinct hexagrams). Each result is a hexagramId (1–64).
- **Output**: 8 portal objects: `{ hexagramId, name, tone, transformedHexagramId?, changingLines }`

**Tasks**:
- [ ] Add `cast8PortalsForCampaign(campaignRef)` in `src/actions/cast-iching.ts` or new `src/actions/campaign-portals.ts`
- [ ] Reuse `castIChingTraditional` or draw 8 random hexagrams (ensure distinct or allow repeats per design)
- [ ] Return 8 hexagram records with Bar data (name, tone, text)

### 1.3 Contextualize with Domain + Kotter

- **Input**: hexagramId, allyshipDomain, kotterStage
- **Output**: Portal display data: flavor text, path suggestions (from lines), resolution hint (transformed hexagram)
- **Logic**: Use Domain × Kotter matrix + hexagram interpretation. E.g. hexagram 23 at Stage 1 Urgency + GATHERING_RESOURCES → "We need resources — and this reading suggests…"

**Tasks**:
- [ ] Add `contextualizeHexagramForPortal(hexagramId, allyshipDomain, kotterStage)` in `src/lib/portal-context.ts` or similar
- [ ] Map Kotter stage to prompt (from kotter-by-domain.md)
- [ ] Map hexagram lines to path suggestions (changing lines → which branches to consider)
- [ ] Transformed hexagram → resolution / "where this leads"

### 1.4 8-Portal UI

- **UI**: 8 cards/tiles on lobby page. Each shows: hexagram name, flavor, "Enter" CTA.
- **Click**: Navigate to Adventure for that portal (Phase 2 wires this).

**Tasks**:
- [ ] Create `CampaignLobbyClient` or `PortalGrid` component
- [ ] Fetch 8 portals (cast + contextualize) on load
- [ ] Render 8 portal cards with hexagram name, tone, contextualized flavor
- [ ] "Enter" → placeholder or Phase 2 destination

---

## Phase 2: Campaign Deck + Portal → Adventure

### 2.1 Campaign Deck Schema

- **Model**: `CampaignDeck` or extend Instance with deck data.
- **Option A**: `Instance.campaignDeckSeeds` (JSON) — array of BAR seed objects.
- **Option B**: New model `CampaignDeckSeed` (instanceId, barSeedData, kotterStage, allyshipDomain).

**BAR seed shape** (minimal):
```ts
{ title: string, description?: string, moveType?: string, allyshipDomain?: string }
```

**Tasks**:
- [ ] Add `CampaignDeckSeed` model or `Instance.campaignDeckSeeds` JSON column
- [ ] Migration
- [ ] Seed script or admin UI to populate deck when campaign is created
- [ ] `getCampaignDeck(instanceId)` returns BAR seeds for current Kotter + domain

### 2.2 Portal → Adventure Mapping

- **Each portal** = entry to a CYOA. Options:
  - **A**: One Adventure per portal (8 Adventures per campaign) — heavy.
  - **B**: One shared "portal adventure" template; 8 entry nodes (one per hexagram). Pass hexagramId as start context.
  - **C**: Portal = BAR seed from deck + hexagram flavor; clicking "Enter" creates/launches quest from that seed, then deep-links to a generic CYOA or quest flow.

**Recommended**: **B** — One `campaign-portal-adventure` per instance. 8 Passages as entry nodes (Portal_1 … Portal_8). Each Passage has choices that lead to rooms (branch nodes). Hexagram flavor injected into Passage text.

**Tasks**:
- [ ] Define portal Adventure structure: 8 entry passages → room passages (branch nodes)
- [ ] Create seed/template for `campaign-portal-adventure-{campaignRef}` or generate on campaign creation
- [ ] Wire "Enter" on portal N → `/adventures/{id}/play?start=Portal_{N}` or equivalent
- [ ] Store portal Adventure id on Instance or via campaignRef lookup

### 2.3 Campaign Creation Flow

- When new campaign (Instance) is created: generate campaign deck (BAR seeds), create portal Adventure template.
- **Tasks**:
  - [ ] Extend campaign creation (admin or bootstrap) to call `createCampaignDeck(instanceId)` and `createPortalAdventure(instanceId, campaignRef)`
  - [ ] Or: manual seed script `npm run seed:campaign-portals` for Bruised Banana

---

## Phase 3: Branch Nodes + 4 Moves + Schools

### 3.1 Room Structure (Branch Nodes)

- **Room** = Passage with 4 choices: Wake Up, Clean Up, Grow Up, Show Up.
- **Each choice** leads to next node:
  - Wake Up → 321 + unpacking flow (Phase 4)
  - Clean Up → EFA quest (link to `/emotional-first-aid` or trigger EFA quest)
  - Grow Up → Schools CYOA (6-face branch)
  - Show Up → Return to lobby (complete quest, redirect to `/campaign/lobby?ref=X`)

**Tasks**:
- [ ] Create room Passage template: 4 choices (moveType: wakeUp, cleanUp, growUp, showUp)
- [ ] Wire Clean Up → EFA (link or quest assignment)
- [ ] Wire Show Up → complete + redirect to lobby
- [ ] Wire Grow Up → schools adventure (3.2)

### 3.2 Schools Adventure (6 Faces)

- **One Adventure** with 6 branches (Shaman, Challenger, Regent, Architect, Diplomat, Sage).
- **Each branch** = path through that face's school. Branch nodes within have 4 moves again (recursive).
- **Structure**: Entry Hub → 6 faces → each face has sub-passages with 4 moves at branch nodes.

**Tasks**:
- [ ] Create `schools-adventure` or `game-master-schools` Adventure
- [ ] 6 entry passages (one per face)
- [ ] Each face path: passages with 4-move choices at branch nodes
- [ ] Wire Grow Up from room → `/adventures/{schoolsId}/play?face={face}` or similar

### 3.3 4 Moves Only at Branch Nodes

- **Rule**: Passages that are "branch nodes" have 4 choices. Linear passages (path between room and lobby) do not.
- **Implementation**: Passage metadata or tag `isBranchNode: true`. Or: convention — if Passage has 4 choices with moveType, it's a branch node.

**Tasks**:
- [ ] Document convention: branch node = Passage with 4 choices (wakeUp, cleanUp, growUp, showUp)
- [ ] Ensure room passages always have 4 choices; path passages have 1–2 (continue, etc.)

---

## Phase 4: Wake Up Room Generation

### 4.1 321 + Unpacking Flow

- **Trigger**: Player chooses Wake Up at a room.
- **Flow**: Launch 321 (Shadow Name) process + unpacking questions. Collect: player desires, needs, context.
- **Output**: Structured input for room generation (AI or admin).

**Tasks**:
- [ ] Add "Wake Up" path in room that redirects to 321 flow or embedded 321 + unpacking
- [ ] Store 321 session output + unpacking answers (e.g. `Shadow321Session` + `metadata` or new `WakeUpRoomRequest`)
- [ ] Pass `WakeUpRoomRequest` to room generation

### 4.2 Room Generation (AI or Admin)

- **Admin path**: Admin creates new Adventure (room) from template. Manually adds passages. Links to Wake Up request.
- **AI path**: Agent receives `WakeUpRoomRequest`; generates Adventure + Passages with paths aligned to player desires. Uses quest-grammar or similar.

**Tasks**:
- [ ] Admin: `createRoomFromWakeUpRequest(requestId)` — creates Adventure, links to player/request
- [ ] AI: `generateRoomFromWakeUpRequest(requestId)` — calls agent (MCP or backend) to create Adventure + Passages
- [ ] New room: linked to parent room (Passage) so player returns to it after completion
- [ ] Redirect player to new room's start passage after generation

### 4.3 Vibeulon Cost (Optional)

- **Cost**: 1 vibeulon to generate new room (Wake Up path). Prevents spam.
- **Tasks**:
  - [ ] Check vibeulon balance before Wake Up room generation
  - [ ] Deduct 1 vibeulon on success
  - [ ] Show "Insufficient vibeulons" if balance < 1

---

## Phase 5: Polish + Path Sharing

### 5.1 Path Metadata on BAR

- When BAR is created from exploration (portal path, room), store `adventureId`, `nodeId` in metadata.
- **Tasks**:
  - [ ] Add `adventureId`, `startNodeId` to CustomBar metadata or new columns
  - [ ] Set when creating BAR from quest completion in portal/room context
  - [ ] "Share path" = send BAR with path metadata; recipient gets "Enter path" link

### 5.2 Fix `/map` 404s

- **Option A**: Implement `/map` page with `type=thread|story|vibeulon` routing (story-quest-map-exploration).
- **Option B**: Redirect `/map` to `/campaign/lobby` when in campaign context, else `/game-map`.
- **Tasks**:
  - [ ] Add `src/app/map/page.tsx` — redirect or minimal router
  - [ ] Resolve campaign context from player's active instance

### 5.3 Campaign Lobby Entry Points

- Add links to campaign lobby from: dashboard, game-map, campaign/board.
- **Tasks**:
  - [ ] Dashboard: "Enter Campaign" link when player has campaign membership
  - [ ] Game-map: Campaign zone links to `/campaign/lobby?ref=X`
  - [ ] Campaign/board: "Lobby" or "Portals" link

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Instance.kotterStage, allyshipDomain | Yes |
| Adventure, Passage, PlayerAdventureProgress | Yes |
| castIChingTraditional, Bar (hexagram) | Yes |
| Emotional First Aid | Yes |
| 321 / Shadow321Session | Yes |
| Quest grammar / AI generation | Yes (for Wake Up AI path) |
| Campaign deck (BAR seeds) | No — Phase 2 |
| Portal Adventure template | No — Phase 2 |

---

## Schema Additions (Summary)

| Element | Type | Notes |
|---------|------|-------|
| CampaignDeckSeed | Model or JSON | BAR seeds per instance |
| Instance.portalAdventureId | String? | FK to Adventure for portal CYOA |
| CustomBar.adventureId | String? | Path metadata for sharing |
| CustomBar.startNodeId | String? | Path metadata for sharing |
| WakeUpRoomRequest | Model? | Optional; links 321 session to generated room |

---

## Verification

- [ ] Player can land on campaign lobby, see 8 portals
- [ ] Each portal shows hexagram + contextualized flavor (domain + Kotter)
- [ ] Entering portal launches CYOA
- [ ] At room (branch node), 4 moves are available
- [ ] Grow Up → schools CYOA (6 faces)
- [ ] Clean Up → EFA
- [ ] Show Up → return to lobby
- [ ] Wake Up → 321 + unpacking → new room (AI or admin)
