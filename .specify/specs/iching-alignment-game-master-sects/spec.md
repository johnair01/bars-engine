# Spec: I Ching Alignment and Game Master Sects

## Purpose

Upgrade the I Ching draw (campaign deck) so it produces only quests aligned with the player's **next available step** — a function of game clock (instance kotterStage), nation, archetype, and developmental lens (Game Master). Reframe Game Masters as Taoist sect heads; players choose to show up to a sect, learn its missions, and align with the campaign.

**Practice**: Deftness Development — deterministic alignment scoring over random draw; rules-first; API-first.

## Design Decisions

| Topic | Decision |
|-------|----------|
| I Ching = campaign deck | Drawing from I Ching IS drawing from the campaign deck; no separate deck model |
| Alignment formula | Next step = f(kotterStage, nation, archetype, developmental lens) |
| Draw constraint | Weighted random from hexagrams scored by alignment; fallback to kotter-only when no instance |
| Game Master as sect | 6 faces = 6 sect heads; players "serve" a sect via active_face choice |
| Deftness | Alignment scoring is rules-based; AI (generateQuestCore) gets richer context |

## Conceptual Model

**Next available step** = quest that aligns with:

| Factor | Source | Alignment rule |
|--------|--------|----------------|
| **Game clock** | `instance.kotterStage` (1–8) | Hexagram must include current stage's trigram (upper or lower) |
| **Nation** | `player.nationId` → Nation name | Prefer hexagrams whose trigrams match nation affinities |
| **Archetype** | `player.playbookId` → Playbook | Playbook maps to trigram; prefer matching hexagrams |
| **Developmental lens** | `storyProgress.state.active_face` | Game Master face = sect; prefer hexagrams aligned with sect |

**Game Master Sects** (6 faces = 6 sect heads):

| Sect (Face) | Role | Mission |
|-------------|------|---------|
| Shaman | Mythic threshold | Belonging, ritual space, bridge between worlds |
| Challenger | Proving ground | Action, edge, lever |
| Regent | Order, structure | Roles, rules, collective tool |
| Architect | Blueprint | Strategy, project, advantage |
| Diplomat | Weave | Relational field, care, connector |
| Sage | Whole | Integration, emergence, flow |

## User Stories

### P1: Aligned I Ching Draw

**As a player**, when I cast the I Ching, I want to receive a hexagram that aligns with my next available step (campaign stage, nation, archetype, developmental lens), so the resulting quest serves the campaign and feels written for me.

**Acceptance**:
- `castIChing` uses alignment scoring instead of pure random
- When active instance exists: hexagram pool filtered/weighted by kotterStage + nation + playbook + active_face
- When no instance: fall back to current random behavior

### P2: Quest Generation with Campaign Context

**As a player**, when a quest is generated from my I Ching reading, I want the AI to receive campaign context (stage, nation, face), so the quest aligns with the campaign and my developmental lens.

**Acceptance**:
- `generateQuestCore` prompt includes kotterStage, nationName, activeFace
- AI instructed to align quest with campaign phase and player identity

### P3: Game Master Sect Lore

**As a contributor**, I want documentation of Game Masters as sect heads and how sect choice affects alignment, so I can understand and extend the system.

**Acceptance**:
- `.agent/context/game-master-sects.md` exists with face → trigram/move preferences
- Spec and plan reference this lore

## API Contracts

### IChingAlignmentContext

```ts
type IChingAlignmentContext = {
  kotterStage: number | null  // 1–8; null when no active instance
  nationName: string | null   // e.g. 'Argyra'
  playbookTrigram: string | null  // e.g. 'Heaven'
  activeFace: string | null   // e.g. 'shaman', 'challenger'
}
```

### getAlignmentContext

**Input**: `playerId: string`  
**Output**: `Promise<IChingAlignmentContext>`

Fetches player (nation, playbook), active instance (kotterStage), storyProgress (active_face). Derives playbook trigram from playbook description or mapping.

### scoreHexagramAlignment

**Input**: `hexagramId: number`, `context: IChingAlignmentContext`  
**Output**: `{ score: number; breakdown: { kotter: number; nation: number; archetype: number; sect: number } }`

Rules-based scoring. Uses `getHexagramStructure`, `KOTTER_STAGES`, `NATION_AFFINITIES`, `FACE_TRIGRAM_PREFERENCE`.

### drawAlignedHexagram

**Input**: `context: IChingAlignmentContext`  
**Output**: `Promise<number>` (hexagramId 1–64)

Scores all 64 hexagrams; weighted random from pool (e.g. top 16 by score, or score >= 1). Fallback: kotter-only when instance exists; pure random when no instance.

## Functional Requirements

### Phase 1: Alignment Context

- **FR1**: `getAlignmentContext(playerId)` MUST return IChingAlignmentContext with kotterStage, nationName, playbookTrigram, activeFace.
- **FR2**: Playbook → trigram mapping MUST be defined (config, seed, or derive from playbook description).

### Phase 2: Alignment Scoring

- **FR3**: `scoreHexagramAlignment(hexagramId, context)` MUST return score and breakdown.
- **FR4**: Kotter alignment: +2 if both trigrams match stage; +1 if one matches; 0 otherwise.
- **FR5**: Nation alignment: +1 if upper or lower trigram in nation affinities.
- **FR6**: Archetype alignment: +1 if trigram matches playbook.
- **FR7**: Sect alignment: +1 if hexagram aligns with active_face preference (FACE_TRIGRAM_PREFERENCE).

### Phase 3: Constrain castIChing

- **FR8**: `castIChing` MUST call `getAlignmentContext` and `drawAlignedHexagram` when player is logged in.
- **FR9**: When no active instance: use pure random (current behavior).
- **FR10**: Log alignment score and breakdown in non-production for tuning.

### Phase 4: Enrich generateQuestCore

- **FR11**: `generateQuestCore` MUST pass kotterStage, nationName, activeFace into AI system prompt.
- **FR12**: AI prompt MUST instruct: "Align quest with Stage N: {stageName}. Player's nation: {nation}. Developmental lens: {face}."

### Phase 5: Game Master Sect Lore

- **FR13**: `.agent/context/game-master-sects.md` MUST define each face as sect head with trigram preference.

## Non-Functional Requirements

- Alignment scoring adds minimal latency; no DB round-trips beyond existing player/instance fetch.
- Cache key for generateQuestCore: extend to include kotterStage, nationName, activeFace (different context = different quest).

## Dependencies

- [Campaign Kotter Domains](../campaign-kotter-domains/spec.md) — instance.kotterStage
- [Game Master Face Sentences](../game-master-face-sentences/spec.md) — 6 faces, active_face
- [AI Deftness Strategy](../ai-deftness-token-strategy/spec.md) — generateQuestCore cache

## References

- [src/actions/cast-iching.ts](../../src/actions/cast-iching.ts)
- [src/actions/generate-quest.ts](../../src/actions/generate-quest.ts)
- [src/lib/iching-struct.ts](../../src/lib/iching-struct.ts)
- [src/lib/kotter.ts](../../src/lib/kotter.ts)
- [src/lib/elemental-moves.ts](../../src/lib/elemental-moves.ts)
- [.agent/context/player_archetypes.md](../../.agent/context/player_archetypes.md)
