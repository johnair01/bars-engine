# Spec: BARS Engine — Game Master Move (Artifact Generation)

## Purpose

Build a system where:

- Users input **BARs** (Belief–Action–Result tensions).
- **Game Master characters** (NPCs in the world) offer **quests** that fit the player and the collective moment.
- Completing a quest yields an **artifact** — the **prize** defined when that quest was created for them.
- **Game Master agents** (backend intelligence) maintain **system-level** structures: patterns, templates, registry hygiene, and APIs that decide *which* quest is needed.

This is **not** a recommendation engine. It is **artifact generation + quest assignment** grounded in campaign state, charge, BAR history, nation, and archetype.

**Practice**: Deftness Development — spec kit first; deterministic fallbacks where possible; AI optional for voice. Aligns with [game-master-face-moves](../game-master-face-moves/spec.md) (face moves produce BARs) and extends BAR Forge with **quest–artifact binding** and **savvy resolution**.

---

## World model

### Game Master agents vs Game Master characters

| Layer | Role | Produces |
|-------|------|----------|
| **GM agents** | System intelligence (APIs, batch jobs, LLM tools) | Artifacts **for the system**: templates, pattern reports, refined BAR clusters, registry metadata, OpenAPI-shaped outputs |
| **GM characters** | NPCs the player meets in-game | **Quests** the player actually plays — dialogue, stakes, and the promise of what completing the quest **unlocks** |

Agents shape the machinery; characters turn the story. Agents may **draft** artifact definitions that attach to quests; **characters** **issue** the quest in fiction.

### Artifact = completion prize

An **artifact** is not a loose “insight.” In product terms:

- A **quest** is offered (by an NPC / face) with a clear ask.
- The **artifact** is the **prize** granted when that quest is **completed** — collectible, storable, narratively load-bearing.

So: **quest first (character), completion → artifact (reward).** System agents may pre-compose `Artifact` payloads that are **bound** to `questId` before or at assignment time.

### Plot driver: NPC encounters

**Player encounters with NPCs move the plot forward.** Quest assignment, dialogue beats, and which face “owns” the next move should be driven by encounter design + this resolution pipeline — not by a single global BAR match in isolation.

---

## Core concepts

### BAR

A compressed tension object. Can be **one-sided** (inferred polarity) or **two-sided** using `/` syntax.

### Game Masters (canonical faces)

| Axis | Faces |
|------|--------|
| **Communion** | Shaman, Diplomat, Regent |
| **Agency** | Challenger, Architect, Sage |

**Canonical six faces** (codebase-only names): Shaman, Challenger, Regent, Architect, Diplomat, Sage. See [.agent/context/game-master-sects.md](../../../.agent/context/game-master-sects.md), `src/lib/quest-grammar/types.ts`.

### Savvy quest resolution (inputs)

**“What quest does someone need?”** is a function of **all** of the following (not just BAR text):

| Signal | Meaning |
|--------|---------|
| **Collective campaign position** | Where the **instance / campaign** is: e.g. Kotter stage, allyship domain, hub state, narrative beat — see `Instance` (`kotterStage`, `allyshipDomain`, `campaignHubState`, `campaignRef`, etc.) |
| **Charge** | What the player is holding energetically / emotionally — often tied to charge capture BARs (`CustomBar` / charge flows) |
| **BARs** | Declared tensions — from `BarForgeRecord`, in-session BARs, or linked `CustomBar` rows |
| **Nation** | Player’s nation (faction / thematic home) — `Player.nationId` / nation keys |
| **Archetype** | How they show up — `Player.archetypeId`, playbook / archetype keys |

Optional boosts: active **Game Master face** in story progress, quest thread state, completed quest ids.

---

## Types

### Artifact (player-facing prize + metadata)

```ts
type GameMasterFaceKey =
  | 'shaman'
  | 'challenger'
  | 'regent'
  | 'architect'
  | 'diplomat'
  | 'sage'

type Artifact = {
  id?: string
  type: string
  title: string
  description: string
  instructions: string[]
  charge: string
  riskLevel?: 'low' | 'medium' | 'high'
  domain?: 'internal' | 'relational' | 'systemic'
  /** Set when this artifact is the prize for completing a specific quest. */
  questId?: string
  /** Which GM face authored the prize framing (may differ from presenting NPC). */
  sourceFace?: GameMasterFaceKey
}
```

### Quest proposal (resolution output)

What the **character** would offer — links quest + presenting face + promised prize:

```ts
type QuestProposal = {
  questId: string
  /** NPC / GM face that should present this quest in fiction. */
  presentingFace: GameMasterFaceKey
  /** Prize on completion (may match CustomBar id when persisted). */
  artifactPrize: Artifact
  /** Why this fits (for agents, debug, GPT — optional surface to player). */
  rationale?: string[]
  /** Optional beat for narrative / encounter tooling. */
  sceneHint?: string
}
```

### Player quest context (for move + resolve)

Passed when the pipeline must align to a **specific player** and **instance**:

```ts
type PlayerQuestContext = {
  instanceId?: string
  campaignRef?: string
  playerId?: string
  nationKey?: string
  archetypeKey?: string
  /** Current or primary charge text / id reference. */
  charge?: { text?: string; sourceBarId?: string }
  /** BAR registry ids or inline BAR + analysis. */
  barRegistryIds?: string[]
  bars?: Array<{ bar: string; analysis: { type: string; wavePhase: string; polarity: string[] } }>
}
```

---

## API design

Auth: reuse **BAR Forge** patterns unless the route is **session-only** (in-app). External tools: `Authorization: Bearer <BARS_API_KEY>`. In-app: session + optional same payloads.

### 1. `POST /api/game-master/move`

**Purpose:** Wave move applied to BAR (+ optional player context): per-face **artifact-shaped** outputs for **system** use (templates, drafts, pattern work). Does **not** replace quest resolution when the question is “what should this player play next?”

**Request** (extends earlier contract):

```json
{
  "bar": "string",
  "analysis": {
    "type": "string",
    "wavePhase": "string",
    "polarity": ["string"]
  },
  "move": "wake_up | clean_up | grow_up | show_up",
  "gameMasters": ["shaman", "challenger", "diplomat", "regent", "architect", "sage"],
  "options": { "maxArtifacts": 0 },
  "context": { }
}
```

`context` is optional `PlayerQuestContext` when moves must be **grounded** in campaign + charge + nation + archetype.

**Response:** `bar`, `move`, `artifacts` keyed by face, `meta.axis`, optional `meta.patterns` (wake-up), optional `meta.debug`.

**Note:** Snake_case `move` values ↔ `BarWavePhase` title case — normalize at one boundary (`src/lib/bar-forge/types.ts`).

---

### 2. `POST /api/game-master/resolve-quest` (core “savvy” endpoint)

**Purpose:** Given **player + collective + BAR/charge** signals, return **ranked quest proposals**: which **quest**, which **NPC face** presents it, and which **artifact** is the **completion prize**.

**Request:**

```json
{
  "instanceId": "string",
  "playerId": "string",
  "campaignRef": "string",
  "charge": { "text": "string", "sourceBarId": "string" },
  "barRegistryIds": ["string"],
  "bars": [],
  "nationKey": "string",
  "archetypeKey": "string",
  "options": {
    "maxProposals": 3,
    "preferFaces": ["shaman"]
  }
}
```

**Rules:** At least one of `instanceId` or `campaignRef` SHOULD be present to anchor **collective** position. `playerId` required for server-side player lookup when using API key; optional when session implies player.

**Response:**

```json
{
  "collective": {
    "kotterStage": 0,
    "allyshipDomain": "string",
    "campaignRef": "string"
  },
  "player": {
    "nationKey": "string",
    "archetypeKey": "string"
  },
  "proposals": [],
  "meta": { "axis": { "communion": [], "agency": [] } }
}
```

`proposals` is `QuestProposal[]`. Implementation may combine `match-bar-to-quests` scoring with instance/player filters and face rotation rules.

---

### 3. `GET /api/game-master/collective-context`

**Purpose:** Read-only **collective** snapshot for agents, GPT, or UI — “where is the campaign?” without loading full instance admin.

**Query:** `instanceId` **or** `campaignRef` (resolve to instance).

**Response (illustrative):**

```json
{
  "instanceId": "string",
  "campaignRef": "string",
  "kotterStage": 1,
  "allyshipDomain": "string",
  "primaryCampaignDomain": "string",
  "campaignHubState": {},
  "narrativeKernel": "string"
}
```

Expose only fields safe for the caller’s auth level (public vs admin).

---

### 4. Existing BAR Forge (unchanged contracts)

- `POST /api/match-bar-to-quests` — library **match** (no player/collective layer).
- `POST /api/bar-registry` / `GET /api/bar-registry` — persist BARs + analysis; extend metadata to hold `lastResolve` / `artifactDrafts` if needed.

---

### 5. Quest completion → grant artifact (application layer)

**Purpose:** When a quest completes, persist **artifact grant** to inventory / ledger / BAR.

This may be **server actions** or internal services first; if exposed as HTTP:

- `POST /api/quests/{questId}/complete` with body `{ playerId, artifactId? }` — **session-auth** preferred; validate quest completion state in DB.

Exact shape depends on quest completion model (`CustomBar`, quest threads, etc.). Spec the **contract** in implementation tasks when the persistence model is chosen.

---

## Wave moves (critical)

Moves are **transformations** on BARs, artifacts, and **system data** — not mere analysis steps.

| Move | Role |
|------|------|
| **Wake Up** | Reveal patterns, cluster BARs, surface blindspots |
| **Clean Up** | Refine, dedupe, sharpen wording |
| **Grow Up** | New structures, templates, archetype mappings |
| **Show Up** | Deploy: assignment, encounters, execution state |

**Show Up** is the natural home for **resolve-quest** outputs and NPC-facing deployment — tied to collective + player context.

---

## System principles

- Artifacts > insights
- Multiplicity > optimization
- Tension > resolution
- Voice matters (faces stay distinct)
- **Quests from characters; prizes as artifacts; agents keep the system honest**
- Moves operate on **system data**, not only the single request payload

---

## Relationship to existing code

| Area | Location |
|------|----------|
| BAR analysis + wave enums | `src/lib/bar-forge/types.ts` |
| Quest matching (library) | `src/lib/bar-forge/match-bar-to-quests.ts`, `POST /api/match-bar-to-quests` |
| Registry | `POST/GET /api/bar-registry`, `BarForgeRecord` |
| Collective / instance | `Instance` — `kotterStage`, `allyshipDomain`, `campaignHubState`, `campaignRef`, … |
| Player profile | `Player` — `nationId`, `archetypeId`, `storyProgress` |
| Charge / BAR linkage | `CustomBar`, charge capture flows |
| Face moves → BAR | [game-master-face-moves](../game-master-face-moves/spec.md), `src/lib/face-move-bar.ts` |
| GM voice modifiers | `GmFaceModifier` (artifact affinity, etc.) |

---

## Future extensions

- Artifact crafting (combine artifacts)
- Campaign arcs with explicit encounter graphs
- Player progression + adaptive re-resolution

---

## See also

- [plan.md](plan.md) — phased implementation
- [tasks.md](tasks.md) — checklist
- [game-master-face-moves](../game-master-face-moves/spec.md)
- [BAR_FORGE_API.md](../../../docs/BAR_FORGE_API.md)
- [openapi/bars-engine-gm-quest.yaml](../../../openapi/bars-engine-gm-quest.yaml) — draft OpenAPI for new routes
