# Gap Analysis: Six Faces as Levels — Expressed as BARs

**Purpose**: How to implement the six-faces-as-levels framework (player, nation, archetype each 1–6) using the existing BAR (hexagram) system. Identifies gaps and concrete BAR-based expressions.

---

## Target Model

| Dimension | Levels 1–6 | Each level = |
|-----------|------------|---------------|
| **Player** | Shaman → Regent → Challenger → Architect → Diplomat → Sage | One face, one orientation step |
| **Nation** | Same 6 faces, nation-specific content | Deep dive into your nation |
| **Archetype** | Same 6 faces, archetype-specific content | Deep dive into your archetype |

**Level 6** in any dimension = completion of that dimension’s six-face journey.

---

## Current State: BARs and Faces

### What Exists

| Component | Location | Notes |
|-----------|----------|-------|
| **Bar** (64 hexagrams) | `prisma/schema.prisma`, `content/iching-canonical.json` | id 1–64, name, tone, text |
| **Face → Trigram** | `src/lib/quest-grammar/iching-faces.ts` | `FACE_TRIGRAM`: shaman=Earth, challenger=Fire, regent=Lake, architect=Heaven, diplomat=Wind, sage=Mountain |
| **Hexagram → Faces** | `getFacesForHexagram(hexagramId)` | Returns faces whose trigram match hexagram’s upper/lower |
| **PlayerBar** | `prisma/schema.prisma` | playerId, barId, source, acquiredAt — player acquires a hexagram |
| **CustomBar** (quest) | `hexagramId` field | Quest can be linked to a hexagram |
| **GmFaceModifier** | DB | Per-face modifiers (anomalyStyle, contactVoice, etc.) |
| **Orientation face sub-packets** | `orientationFaceSubPacket.ts` | 6 branches per face; compileFaceSubPacket(face) |

### What’s Missing

- **Face → Canonical Hexagram**: No mapping from face to a single hexagram per face.
- **Level tracking per dimension**: No `PlayerNationLevel`, `PlayerArchetypeLevel`, or `PlayerFaceLevel`.
- **BAR acquisition for orientation**: Completing orientation doesn’t create `PlayerBar`.
- **Nation/Archetype × Face content**: No quest content keyed by (nationId, face) or (archetypeId, face).

---

## Proposed: Face → Canonical BAR

Use `FACE_TRIGRAM` to pick one hexagram per face (prefer trigram in both upper and lower).

| Face | Trigram | Canonical Hexagram | Bar Name | Rationale |
|------|---------|-------------------|----------|-----------|
| **Shaman** | Earth | 2 | Supportive Power | Earth/Earth — receptivity, threshold |
| **Regent** | Lake | 64 | Toward an End | Lake/Lake — order, completion |
| **Challenger** | Fire | 30 | The Spark | Fire/Fire — proving ground, action |
| **Architect** | Heaven | 1 | Creative Power | Heaven/Heaven — blueprint, structure |
| **Diplomat** | Wind | 20 | Observation | Wind/Earth — contemplation, weave |
| **Sage** | Mountain | 15 | Modesty | Earth/Mountain — integration, humility |

**Implementation**: Add `FACE_CANONICAL_HEXAGRAM: Record<GameMasterFace, number>` in `iching-faces.ts`:

```ts
export const FACE_CANONICAL_HEXAGRAM: Record<GameMasterFace, number> = {
  shaman: 2,
  regent: 64,
  challenger: 30,
  architect: 1,
  diplomat: 20,
  sage: 15,
}
```

---

## BAR-Based Expressions

### 1. Orientation Quest = CustomBar with hexagramId

Each orientation step (e.g. Nation L1 = Shaman) is a **CustomBar** (quest) with:

- `hexagramId`: canonical hexagram for that face (e.g. 2 for Shaman)
- `type`: `'onboarding'` or `'orientation'`
- `completionEffects`: `[{ type: 'acquireBar', barId: 2 }]` or `[{ type: 'advanceNationLevel', face: 'shaman' }]`

**Gap**: No `acquireBar` completion effect. `PlayerBar` exists but isn’t created by quest completion.

### 2. Completing = Acquiring the BAR

When a player completes "Nation Level 1 (Shaman)":

- Create `PlayerBar` with `playerId`, `barId: 2`, `source: 'nation_orientation_shaman'`
- Optionally: `PlayerNationLevel` or equivalent with `nationId`, `faceLevel: 1`, `completedAt`

**Gap**: No `acquireBar` in `processCompletionEffects`. No `PlayerNationLevel` / `PlayerArchetypeLevel` schema.

### 3. Nation Level = BARs Acquired for Nation

**Option A**: `PlayerBar` with `source` like `nation_orientation_shaman`, `nation_orientation_regent`, …  
`nationLevel` = count of `PlayerBar` where `source.startsWith('nation_orientation_')` and `barId` in face hexagrams.

**Option B**: New table `PlayerNationFaceProgress`:

```prisma
model PlayerNationFaceProgress {
  id         String   @id @default(cuid())
  playerId   String
  nationId   String
  face       String   // shaman|regent|challenger|architect|diplomat|sage
  barId      Int      // hexagram acquired
  completedAt DateTime @default(now())
  player     Player   @relation(...)
  nation     Nation   @relation(...)
  bar        Bar      @relation(...)
  @@unique([playerId, nationId, face])
}
```

**Gap**: Option A reuses `PlayerBar` but needs `source` convention. Option B needs schema change.

### 4. Archetype Level = Same Pattern

Same as nation: `PlayerArchetypeFaceProgress` or `PlayerBar` with `source: 'archetype_orientation_shaman'` etc.

### 5. Player Level = Same Pattern

Player overall level = same 6 faces. `PlayerBar` with `source: 'player_orientation_shaman'` or `PlayerFaceProgress`.

---

## Gaps Summary

| Gap | Current | Needed | Effort |
|-----|---------|--------|--------|
| **G1: Face → Hexagram** | `getFacesForHexagram` (reverse) | `FACE_CANONICAL_HEXAGRAM` | Low — add constant |
| **G2: Acquire BAR on completion** | No completion effect | `acquireBar` in `processCompletionEffects` | Low — add effect + create PlayerBar |
| **G3: Level tracking** | None | `PlayerNationFaceProgress` or `PlayerBar` + source convention | Medium — schema or convention |
| **G4: Orientation quests per face** | Face sub-packets exist | CustomBar per (dimension, face) with hexagramId | Medium — seed content |
| **G5: Nation/Archetype × Face content** | Generic face content | Content keyed by nationId + face, archetypeId + face | Medium–High — content generation |

---

## Implementation Path (BARs)

### Phase 1: Foundation

1. Add `FACE_CANONICAL_HEXAGRAM` to `iching-faces.ts`.
2. Add `acquireBar` completion effect: `{ type: 'acquireBar', barId: number }` or `fromInput`.
3. In `processCompletionEffects`, create `PlayerBar` with `source: 'orientation_{face}'` or from config.

### Phase 2: Level Tracking

**Minimal**: Use `PlayerBar` + source convention:

- `source: 'nation_orientation_shaman'` etc. → nation level
- `source: 'archetype_orientation_shaman'` etc. → archetype level
- `source: 'player_orientation_shaman'` etc. → player level

**Full**: Add `PlayerNationFaceProgress`, `PlayerArchetypeFaceProgress` if you want explicit level + barId + metadata.

### Phase 3: Orientation Quests as BARs

1. Create 6 CustomBars per dimension (nation, archetype, player): e.g. `nation-shaman-quest`, `nation-regent-quest`, …
2. Each has `hexagramId` = `FACE_CANONICAL_HEXAGRAM[face]`.
3. Completion effect: `acquireBar` + optional `advanceNationLevel` or equivalent.
4. Thread: Nation orientation = 6 quests in order; Archetype orientation = 6 quests in order.

### Phase 4: Content Generation

- Nation L1 (Shaman): Use existing Shaman face sub-packet, parameterized by nation.
- Nation L2 (Regent): Regent content for that nation.
- GM prompts: Pass `nationId`, `archetypeId`, `face` to generate dimension-specific copy.

---

## BAR as Kernel

From ARCHITECTURE.md: *"A BAR is the atomic seed object. It can link to multiple downstream artifacts."*

- **Bar** (hexagram) = kernel. The 64 are canonical.
- **Orientation quest** (CustomBar) = bloom from kernel. Links via `hexagramId`.
- **Completion** = player acquires the kernel (PlayerBar). The BAR is the proof of completion.

So: **Level 1 Nation = Shaman = Bar 2 = "Supportive Power"**. Completing the Nation Shaman orientation = acquiring Bar 2 with source `nation_orientation_shaman`. The BAR is the level token.

---

## Recommended Order

1. Add `FACE_CANONICAL_HEXAGRAM` and `acquireBar` completion effect.
2. Create 6 nation orientation quests (nation-shaman through nation-sage) with hexagramIds.
3. Use `PlayerBar` + source convention for level tracking (no schema change).
4. Add `PlayerNationFaceProgress` later if you need richer metadata.
5. Repeat for archetype and player dimensions.
