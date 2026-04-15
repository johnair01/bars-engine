# Spec — NPC Codex Workflow (Seed → Review → Canon)

## Developer-Facing Summary

This spec defines how to use:

- [`npc_codex_seed.json`](npc_codex_seed.json)
- [`npc_codex_review.md`](npc_codex_review.md)

to systematically transform raw source creators into:

- classified ontology-aligned records
- in-world NPC coaches
- routed quest systems

This workflow ensures:

- no premature canonization
- consistent ontology alignment
- scalable content generation
- preservation of provenance

**Parent spec**: [../spec.md](../spec.md) (API contracts, DB). The codex JSON is the **authoring source** for `SourceCoachRecord` / cluster → `NPCCoach` import.

---

# Core Principle

The codex is not content.

The codex is a **classification engine**.

It exists to answer:

- How do these creators cluster?
- Which archetypes dominate?
- Which emotional patterns repeat?
- Which NPCs should exist in the world?

---

# Files and Roles

## 1. npc_codex_seed.json

### Purpose
Machine-readable source of truth for all creators.

### Used for:
- classification
- seeding database
- routing logic
- NPC generation
- quest generation

### Contains:
- source identity
- classification fields
- daemon hypotheses
- domain mapping
- NPC placeholders (`npcNamePlaceholder` → becomes assigned **character name** in `NPCCoach.displayName` after review; see parent spec)
- review state

---

## 2. npc_codex_review.md

### Purpose
Human-readable inspection surface.

### Used for:
- pattern recognition
- manual classification
- clustering decisions
- editorial judgment

### Contains:
- table view of all creators
- blank classification fields
- status indicators

---

# Workflow Phases

---

## Phase 1 — Initial Scan

### Goal
Identify obvious patterns without overthinking.

### Instructions

1. Open `npc_codex_review.md`
2. Read all 30 entries quickly
3. Do NOT classify yet

### Output
Mental map of:
- familiar creators
- unclear creators
- perceived clusters

---

## Phase 2 — Anchor Classification (5–7 entries)

### Goal
Establish stable reference points

### Instructions

Select 5–7 creators that feel obvious.

For each:

#### Fill in:
- GM Face
- Nation
- Archetype
- Campaign Domain
- Likely Daemons

#### Add rationale:
- why this face?
- what emotional pattern is present?
- what behavior defines them?

### Update BOTH files:
- fill row in `.md`
- update object in `.json`

---

## Phase 3 — Pattern Detection

### Goal
Let structure emerge before completing all entries

### Questions to answer:

- Which GM Faces are dominant?
- Which Nations are overrepresented?
- Which Archetypes repeat?
- Which Domains cluster?

### Output

Create a note block:

```md
## Pattern Notes

- Architect appears in X/7 entries
- Fire nation dominant in action coaches
- Diplomat cluster around audience-building
- Missing Shaman representation
```

---

## Phase 4 — Batch Completion

### Goal
Classify remaining creators with pattern awareness

### Instructions

For each remaining creator:

1. Assign:
   - GM Face
   - Nation
   - Archetype
2. Validate against existing clusters
3. Avoid over-fragmentation

### Rule

> If two creators feel identical in function, they should likely share:
- same GM Face
- same Nation
- same Archetype

---

## Phase 5 — JSON Enrichment

### Goal
Make data operational

### Add fields in `npc_codex_seed.json`:

- `gmFaceConfidence`
- `nationConfidence`
- `archetypeConfidence`
- `gmFaceRationale`
- `nationRationale`
- `archetypeRationale`
- `campaignDomain`
- `subdomains`
- `inheritedMoveFamilies`
- `likelyDaemons`
- `primaryDaemon`
- `recommendedAlchemyChannel`
- `npcNamePlaceholder` (draft in-world label; final **character name** is approved into DB as `NPCCoach.displayName`)
- `npcTitlePlaceholder`
- `npcVoiceStyle`
- `entryQuestSeed`

---

## Phase 6 — NPC Compression

### Goal
Reduce 30 creators → 6–12 usable NPC archetypes

### Instructions

Group creators by identical:

- GM Face
- Nation
- Archetype
- Domain

### Output

Create grouping:

```json
{
  "clusterId": "architect_fire_storm",
  "members": ["Trey Lewellen", "Dan Henry"],
  "sharedTraits": ["action", "leverage", "rapid iteration"]
}
```

### Result

Each cluster becomes:
→ 1 NPC Coach (not 1 per creator)

---

## Phase 7 — NPC Generation

### Goal
Create in-world coaches

For each cluster:

Generate:

- **Character name** (assigned, unique, world-native) — stored as `NPCCoach.displayName`; must not mirror real-world `sourceName`
- Title
- Nation
- Archetype
- GM Face
- Teaching Style
- Move Profile
- Quest Domain

### Link back to:
- all source creators in cluster

---

## Phase 8 — Provenance Layer

### Rule

Real-world creators are **never shown first**

### Instead:

NPC → Quest → Completion → Reveal

### Reveal includes:
- source creator(s)
- chapter title
- lineage summary

---

## Phase 9 — Routing Integration

### Goal
Use classification for player experience

### Inputs:
- player nation
- player archetype
- active daemon
- campaign state
- **developmental lens** / GM Face alignment (see parent spec)

### Output:
- 2–4 NPC options
- 1 primary path
- 1 contrast path

---

# Daemon Integration Rule

Every quest must check:

```text
Is there an emotional resistance pattern?
```

If yes:

- require WAVE or 3-2-1
- delay reward until processed
- attach provenance to vibeulon

---

# Status Lifecycle

Each record moves through:

```text
unreviewed → reviewed → approved → canonical
```

Only `canonical` entries:
- generate NPCs
- enter routing system
- become player-facing

---

# Anti-Patterns

Do NOT:

- classify all 30 immediately
- invent new archetypes
- overfit unique identities per creator
- expose real-world names prematurely
- skip daemon modeling
- build quests before classification stabilizes

---

# Success Criteria

System is working when:

- creators cluster naturally
- NPC count < creator count
- players see ≤ 4 choices at a time
- daemon gates appear consistently
- provenance reveals feel earned
- quest generation becomes templatable

---

# First Milestone

Complete:

- 7 classified creators
- 2–3 clusters identified
- 2 NPCs generated
- 1 quest tree built
- 1 provenance reveal working

---

# Final Note

This system is not about organizing information.

It is about:

> converting fragmented advice into a coherent world  
> where guidance is embodied, earned, and metabolized
