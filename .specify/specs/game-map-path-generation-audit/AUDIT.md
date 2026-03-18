# Audit: Game Map Path Generation — Players Generate Paths Others Can Follow

## Purpose

Audit how players can generate paths in the game map that other players can follow. The vision: 8 I Ching scenarios become portals of exploration; players follow paths while emitting/completing quests; AI agents generate paths "downwind" from feedback and emotional state; BARs from map pages can be sent to others to grant path access; generating more paths costs vibeulons.

---

## Vision vs Current State

| Vision Element | Current State | Gap |
|----------------|---------------|-----|
| **8 I Ching scenarios as portals** | I Ching produces 64 hexagrams; 8 trigrams map to archetypes. Wake-up campaign has 6 face paths (Shaman, Challenger, Regent, Architect, Diplomat, Sage). Bruised Banana quest map has 8 Kotter stages (Q-MAP-1…8). No explicit "portal" linking I Ching result → exploration entry. | I Ching result does not unlock or route to a specific exploration path. Paths exist (6 faces, 8 Kotter) but are not I Ching–driven portals. |
| **Paths rendered in CYOA logic** | Adventures + Passages with `choices` JSON. CampaignReader, PassageRenderer render CYOA. Quest threads are sequential (ThreadQuest.position). | Paths exist as CYOA (Adventure/Passage) and as quest sequences (QuestThread). No unified "path" model that spans both. |
| **Players follow paths, emit/complete quests** | Players advance through passages (PlayerAdventureProgress.currentNodeId). Players complete quests in threads (ThreadProgress.currentPosition). Face-move BARs created on cast/complete. | Flow works for both. No explicit "path emission" — BARs are created but not tied to "path I explored." |
| **AI agents generate paths downwind** | `generateGrammaticQuestFromReading` uses hexagram + alignment context (kotterStage, nation, archetype). No feedback loop. No emotional state input. | No "downwind" logic. No agent that generates paths from player feedback or emotional state. |
| **Emotional state changes with paths** | Emotional First Aid has stuckBefore/stuckAfter, applyToQuesting. No wiring from path completion → emotional state update. | Path traversal does not update emotional state. |
| **World updates as players move** | World page uses SpatialMap/rooms. Campaign gameboard shows slots. No dynamic world that updates from player movement. | World is static (rooms, slots). No "living" world that morphs from exploration. |
| **BARs from map pages → share path access** | `sendBar` creates BarShare (notification). `delegateBar` transfers claim. BAR has no `adventureId`, `pathId`, or `nodeId` to encode "which path this unlocks." | Sharing a BAR does not grant "access to path X." Recipient gets the quest, not the exploration route. |
| **Vibeulon cost for more paths** | `createSubQuest`, `appendExistingQuest` cost 1 vibeulon. Gameboard "generate quest" costs 1 vibeulon. | No vibeulon cost for "generate new path" or "unlock portal." |

---

## Current Architecture

### Map-Related Routes

| Route | Purpose | Implementation |
|-------|---------|----------------|
| `/game-map` | Hub of zone links (Campaign, Wallet, EFA, etc.) | Static zone grid; no path visualization |
| `/map?type=thread&threadId=X` | Quest thread map | **Not implemented** — links exist, page 404 |
| `/map?type=story&adventureId=X` | Story/adventure graph | **Not implemented** — links exist, page 404 |
| `/map?type=vibeulon` | Vibeulon flow map | **Not implemented** — links exist, page 404 |
| `/campaign/board` | Campaign gameboard (slots, deck) | Implemented; Kotter/domain context |
| `/world` | Spatial map (rooms) | Redirects to `/world/{instance}/{room}` |
| `/campaign`, `/campaign/twine` | Campaign CYOA reader | Implemented; Adventure + Passages |

### Path-Like Structures

| Structure | Schema | How it works |
|-----------|--------|---------------|
| **Adventure + Passages** | Adventure, Passage (nodeId, choices) | CYOA graph. PlayerAdventureProgress tracks currentNodeId. |
| **Quest threads** | QuestThread, ThreadQuest, ThreadProgress | Linear sequence. Player advances by completing quests. |
| **Kotter quest map** | CustomBar (Q-MAP-1…8), kotterStage | 8 container quests; Market filters by instance.kotterStage. |
| **Face paths (wake-up)** | content/campaigns/wake_up/*.json | Path_Sh_Start → Path_Sh_Interpret → … → Path_Complete. |

### BAR Sharing

| Action | Behavior | Path access? |
|--------|-----------|--------------|
| `sendBar` | Creates BarShare; recipient sees shared BAR | No — BAR is a quest, not a path key |
| `delegateBar` | Transfers claim; recipient gets assigned quest | No — quest assignment, not path unlock |
| `pickUpBar` | Player claims available BAR | No |

### I Ching → Path

| Flow | Current behavior |
|------|-------------------|
| Cast I Ching | Returns hexagramId; `acceptReading` creates face-move BAR, fires ICHING_CAST |
| Generate quest from reading | `generateGrammaticQuestFromReading` → compileQuestWithAI → publish. Creates CustomBar + optionally Adventure. |
| Hexagram → portal | No mapping. Hexagram influences quest content, not which path/portal to enter. |

---

## Spec References

- [story-quest-map-exploration](../story-quest-map-exploration/spec.md) — Map A (story), B (thread), C (vibeulon). **Implementation deferred.**
- [campaign-map-phase-1](../campaign-map-phase-1/spec.md) — Layer 1–3 on gameboard. Domain regions, field activity.
- [bruised-banana-quest-map](../bruised-banana-quest-map/spec.md) — 8 Kotter stages, container quests.
- [game-map-lobbies](../game-map-lobbies/spec.md) — Archived; lobbies (Library, EFA, Dojos, Gameboard).

---

## Gaps to Address

### 1. Path-as-shareable-artifact

**Gap:** BARs do not encode "path I explored." Sharing a BAR does not grant the recipient access to that path.

**Options:**
- Add `adventureId`, `startNodeId`, or `pathSignature` to CustomBar when created from exploration. Recipient who receives BAR can "enter path" at that node.
- New model: `ExploredPath` (playerId, adventureId, nodeSequence, barId). BAR links to ExploredPath; sharing BAR grants ExploredPath access.
- Simpler: BAR metadata includes `{ adventureId, nodeId }`. Recipient gets "Enter this path" CTA that deep-links to `/adventures/{id}/play?start={nodeId}`.

### 2. I Ching → 8 portals

**Gap:** I Ching result does not map to one of 8 exploration portals.

**Options:**
- Map 64 hexagrams → 8 trigram groups. Cast result → "Portal N" (1–8). Portal N = Kotter stage N or face path N.
- Or: 8 "scenarios" = 8 compound states (e.g. upper trigram × lower trigram simplified). Each scenario has a dedicated Adventure or path entry.
- Wire: After cast, player chooses or is routed to "Portal 1–8" based on hexagram. Each portal = entry to a path.

### 3. AI downwind path generation

**Gap:** No agent that generates paths from player feedback + emotional state.

**Options:**
- Extend `generateGrammaticQuestFromReading` or new action: input = (playerId, feedbackSummary, emotionalState, lastPath). Output = suggested next path or quest.
- Emotional First Aid `applyToQuesting` could feed into path suggestion (e.g. "after Clean Up, suggest paths that match Grow Up").
- Backend agent (Sage, Regent) with MCP: reads feedback, emotional state, recent paths; proposes next node or path.

### 4. Emotional state ↔ path

**Gap:** Path completion does not update emotional state.

**Options:**
- On passage/quest complete: optional "How do you feel now?" → update EmotionalFirstAidSession or player.storyProgress.
- `applyToQuesting` from EFA could set a flag that path generator reads.
- New: `PlayerPathState` (lastPath, emotionalDelta, feedbackSnippet) for agent consumption.

### 5. Vibeulon cost for path generation

**Gap:** No explicit cost for "generate new path" or "unlock portal."

**Options:**
- New action `generatePathFromReading` or `unlockPortal`: cost 1 vibeulon. Creates path/portal entry.
- Reuse `createSubQuest` / `appendExistingQuest` cost (already 1 vibeulon) if "path" = subquest under container.
- Gameboard "generate quest" already costs 1 vibeulon; treat as path-generation cost when used from map context.

### 6. `/map` page

**Gap:** `/map?type=thread|story|vibeulon` does not exist. Links 404.

**Options:**
- Implement story-quest-map-exploration Phase 1–2: Story map (Map A), Thread map (Map B). Add `/map` page that routes by `type`.
- Or: Redirect `/map` to `/game-map` until map views are built.

---

## Clarified Vision (Post-Interview)

See [INTERVIEW_AND_GM_CONSULT.md](INTERVIEW_AND_GM_CONSULT.md) for full detail. Summary:

| Element | Clarified |
|---------|-----------|
| **8 portals** | 8 hexagrams cast from I Ching → allyship domain + Kotter stage applied to each → 8 quest portals (CYOA entry points). Player sees 8 at once. |
| **Lobby** | Campaign-specific (not global, not spatial world yet). 8 distinct paths. |
| **4 moves** | Only at branch nodes (rooms). Not at every node. |
| **Grow Up** | → One CYOA adventure with 6 branches (Game Master faces = schools). Core 4 moves at branch nodes. |
| **Wake Up** | → Extend path: AI or admin creates new room. Player does 321 + unpacking; paths emerge responsively. |
| **Show Up** | → Completion returns to lobby. |
| **Campaign deck** | BAR seeds generated when campaign is created; turn into quests via player engagement. |
| **Hexagram** | Flavor + path suggestion (lines) + resolution (transformed hexagram). |
| **Terminology** | Portal = into CYOA; Room = branch point; Path = between room and lobby; Branch = path off a room. |
| **Schools** | 6 Game Master faces, separate from nations. |

---

## Recommended Next Steps

1. **Spec: Campaign Lobby Path Map** — Campaign-specific lobby, 8 Kotter-aligned hexagram portals, branch nodes with 4 moves, Grow Up → schools CYOA, Wake Up → 321 + room generation.
2. **Campaign deck schema** — BAR seeds per campaign; Kotter + domain alignment; hexagram selection for 8 portals.
3. **8-portal hexagram selection** — Algorithm: given Kotter stage N, select 8 hexagrams from 64 that "reference" stage N (trigram mapping, domain weighting).
4. **Wake Up room generation** — 321 + unpacking → AI or admin creates new room (Adventure + Passages) with responsive paths.
5. **Implement `/map` page** — Route to campaign lobby path view when `type=story` or campaign context.

---

## Files Referenced

| Area | Files |
|------|-------|
| Map / game-map | `src/app/game-map/page.tsx`, `src/app/campaign/board/page.tsx` |
| Map links (404) | `QuestThread.tsx`, `QuestDetailModal.tsx`, `wallet/page.tsx`, `adventure/[id]/play/page.tsx` |
| BAR sharing | `src/actions/bars.ts` (sendBar), `src/actions/delegate-bar.ts` |
| I Ching | `src/actions/cast-iching.ts`, `src/actions/generate-quest.ts` |
| Path structures | `content/campaigns/wake_up/`, `src/lib/story-content.ts` |
| Quest grammar | `src/actions/generate-quest.ts`, `src/actions/quest-grammar.ts` |
| Vibeulon costs | `src/actions/quest-nesting.ts`, `src/actions/gameboard.ts` |
| Emotional state | `src/actions/emotional-first-aid.ts` |
