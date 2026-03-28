# Spec: Agentic NPC Constitution System v0

## Purpose

Give important NPCs stable identity, bounded memory, constrained initiative, and relational continuity — without granting them sovereignty. All NPC constitutions are governed by the Regent Game Master Agent (Claude API with Regent persona). NPCs deliver CYOA dialogue Adventures as portals to story content and traverse the 4-lobby game map driven by story clock ticks and Kotter stage advancement.

**Problem**: The spatial world has anchor points for NPCs (`npc_slot` anchor type) but no system for governing who those NPCs are, what they can do, or how they evolve. Without constitution governance, NPCs are either static content or unbounded agents — neither is suitable for community-run gameplay.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Constitutional authority | Regent Claude API call governs ALL creation, activation, suspension, and mutation — no self-amendment |
| NPC initiative priority | Lowest: below world laws → campaign coherence → player growth → EA alignment → NPC constitutional integrity |
| First NPC | Giacomo (villain, Tier 4) — appears in Card Club / spatial world corner |
| Adventures as dialogue | NPCs trigger `linked Adventures` as CYOA portals to story content — existing system, extended |
| Reflection gate | `npc_reflections` status `pending|approved|rejected` — requires Regent review before active |
| Scene verbs | `reveal_lore`, `ask_question`, etc. → land in Adventures; artifact verbs → surface on dashboard |
| Vibeulons | Existing resource — NPC interactions award vibeulons; no new resource type |
| Location | `currentLocation: library|efa|dojos|gameboard|none` — updated on story clock tick + Kotter stage advance |
| Memory scope | `scene|campaign|relationship` — bounded, not infinite |

## Conceptual Model

| Dimension | Value |
|-----------|-------|
| **WHO** | NPC (constitution-governed); Regent (governance authority); Player (interacts, builds relationship) |
| **WHAT** | `NpcConstitution` + 5 supporting models; `linkedAdventures` as dialogue portals |
| **WHERE** | `/game-map` (location display); spatial world `npc_slot` anchors; player dashboard (artifact verbs) |
| **Energy** | Regent activation unlocks NPC; story clock advances location; player interactions deepen relationships |
| **Personal throughput** | Wake Up (player encounters NPC) → Grow Up (NPC challenge/reflection) → Show Up (artifact verbs on dashboard) |

## API Contracts (API-First)

### `activateNpcConstitution` (Server Action, Regent-gated)

**Input**: `{ npcId: string; constitutionJson: string }`
**Output**: `{ constitution: NpcConstitution }` — status set to `active`

```ts
function activateNpcConstitution(input: {
  npcId: string
  constitutionJson: string
}): Promise<{ constitution: NpcConstitution }>
```

Calls Regent Claude API to validate constitution before activation.

### `suspendNpcConstitution` (Server Action, Regent-gated)

**Input**: `{ npcId: string; reason: string }`
**Output**: `{ constitution: NpcConstitution }` — status set to `suspended`

### `submitNpcReflection` (Server Action)

**Input**: `{ npcId: string; reflectionContent: string; sceneContext?: string }`
**Output**: `{ reflection: NpcReflection }` — status `pending`, awaiting Regent review

### `reviewNpcReflection` (Server Action, admin/Regent)

**Input**: `{ reflectionId: string; decision: 'approve' | 'reject'; rationale?: string }`
**Output**: `{ reflection: NpcReflection }`

### `recordNpcAction` (Server Action)

**Input**: `{ npcId: string; verb: NpcActionVerb; payload: object; requiresRegentApproval: boolean }`
**Output**: `{ action: NpcAction }` — validated against constitution + world laws

### `advanceNpcLocation` (Server Action)

**Input**: `{ npcId: string }` — called on story clock tick or Kotter stage advance
**Output**: `{ constitution: NpcConstitution; newLocation: string }`

### `getNpcForAnchor` (Server Action)

**Input**: `{ anchorId: string }`
**Output**: `{ npc: NpcConstitution | null; linkedAdventureId: string | null }`

## User Stories

### P1: Giacomo is interactable on the game map

**As a player**, I want to see Giacomo (villain NPC, Tier 4) on the game map/spatial world and trigger his linked Adventure by walking up to him, so the story world feels inhabited.

**Acceptance**: Giacomo has an active Regent-governed constitution. He appears at a location in Card Club. `npc_slot` anchor links to his `linkedAdventures[0]`. Interacting launches Adventure.

### P1: Regent blocks unauthorized constitution mutation

**As the system**, I want to prevent NPCs from amending their own constitutions, so governance integrity is maintained.

**Acceptance**: `activateNpcConstitution` with `npcId === callingNpcId` is rejected. `recordNpcAction` with verb `amend_constitution` is blocked at action layer.

### P2: NPC reflection requires Regent review

**As a Tier 3/4 NPC**, I want to submit an offstage reflection, but only have it influence my next dialogue after Regent review, so my offstage processing stays governed.

**Acceptance**: `submitNpcReflection` creates `NpcReflection` with status `pending`. Reflection only surfaces in Adventures after `decision='approve'`.

### P3: NPC location advances on story clock

**As a player**, I want NPC locations to update as the story clock ticks, so the game world feels dynamic and I discover NPCs in new places.

**Acceptance**: `advanceNpcLocation` updates `NpcConstitution.currentLocation`. `/game-map` reflects new location within one page load.

## Functional Requirements

### Phase ANC-1: Schema + Migration

- **FR1**: 6 new Prisma models: `npc_constitutions`, `npc_constitution_versions`, `npc_memories`, `npc_reflections`, `npc_actions`, `npc_relationship_states`
- **FR2**: `NpcConstitution` core fields: `id`, `name`, `archetypeRole`, `tier` (1–4), `constitutionJson` (Text), `constitutionStatus` (`draft|active|suspended|archived`), `currentLocation` (`library|efa|dojos|gameboard|none`), `linkedAdventures` (JSON: string[]), `governedBy` (`regent_game_master`), timestamps

### Phase ANC-2: Regent governance service

- **FR3**: `src/lib/npc/regent-governance.ts` — Claude API call with Regent persona for constitution activation and suspension
- **FR4**: `activateNpcConstitution` calls Regent API to validate; if valid → `constitutionStatus: 'active'`; creates `NpcConstitutionVersion` (audit trail)
- **FR5**: NPCs cannot self-amend: server action rejects if `callerNpcId === npcId`

### Phase ANC-3: Giacomo seed

- **FR6**: `scripts/seed-giacomo-npc.ts` — seeds Giacomo's `NpcConstitution` (Tier 4, villain), links to a placeholder Adventure
- **FR7**: Giacomo appears as `npc_slot` anchor in Card Club spatial map seed

### Phase ANC-4: Reflection + action system

- **FR8**: `submitNpcReflection` creates `NpcReflection` with status `pending`
- **FR9**: Admin review queue at `/admin/npc-reflections` shows pending reflections; `reviewNpcReflection` approves/rejects
- **FR10**: `recordNpcAction` validates verb against constitution's `limits.can_initiate_scene_types`; stores `NpcAction`
- **FR11**: `offer_quest_seed` verb creates `QuestProposal` visible on player dashboard

### Phase ANC-5: Location + story clock wiring

- **FR12**: `advanceNpcLocation` called on story clock tick events + Kotter stage advancement
- **FR13**: `/game-map` reads `NpcConstitution.currentLocation` and renders NPC marker

### Phase ANC-6: Relational memory

- **FR14**: `NpcMemory` created/updated on NPC-player interactions; scope: `scene|campaign|relationship`
- **FR15**: `NpcRelationshipState` tracks trust/tension per player per NPC (-100 to 100)

## Non-Functional Requirements

- All NPC constitution activation and mutation routes through the Regent Claude API call
- NPC initiative is always the lowest priority (documented in constitution `limits` section)
- Non-Regent NPCs (Tier 1–2) use deterministic rule-based behavior; Regent API only for Tier 3–4
- `npm run build + npm run check` pass

## Persisted data & Prisma

| Check | Done |
|-------|------|
| All 6 models named in API Contracts | |
| `tasks.md` includes `npx prisma migrate dev --name add_npc_constitution_system` | |
| `npm run db:sync` after schema edit | |
| Human reviews migration SQL — all 6 tables are additive | |

**Core constitution model**:
```prisma
model NpcConstitution {
  id                  String   @id @default(cuid())
  name                String
  archetypeRole       String
  tier                Int      // 1-4
  constitutionJson    String   @db.Text
  constitutionStatus  String   @default("draft") // draft|active|suspended|archived
  currentLocation     String   @default("none")  // library|efa|dojos|gameboard|none
  linkedAdventures    String   @default("[]")    // JSON: string[]
  governedBy          String   @default("regent_game_master")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  memories            NpcMemory[]
  reflections         NpcReflection[]
  actions             NpcAction[]
  relationships       NpcRelationshipState[]
  versions            NpcConstitutionVersion[]

  @@map("npc_constitutions")
}
```

**Migration name**: `add_npc_constitution_system`

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| Regent API calls | Rate-limited; only on activation/suspension/reflection review — not on every interaction |
| Constitution JSON | `@db.Text`; max Tier 4 constitution ~3KB |

## Verification Quest

- **ID**: `cert-agentic-npc-constitution-v1`
- **Steps**:
  1. Navigate to `/admin/npc-constitutions` — verify Giacomo's constitution listed
  2. Attempt to activate Giacomo — verify Regent API call fires + status becomes `active`
  3. Navigate to Card Club spatial map — verify Giacomo appears at `npc_slot` anchor
  4. Interact with Giacomo — verify linked Adventure launches
  5. Submit a reflection from Giacomo — verify `pending` status in admin review queue
  6. Approve reflection in admin — verify it influences next Adventure dialogue
- **Narrative**: "Validate the NPC constitution system so Giacomo can inhabit the Card Club at the April residency."

## Dependencies

- `1.25 AES` phases 1–4 — scene vector targeting
- Spatial world (built) — `npc_slot` anchor type in `AnchorModal.tsx`
- `src/app/adventure/[id]/play/` — Adventure player (linked Adventures trigger)
- `src/lib/spatial-world/pixi-room.ts` — `npc_slot` anchor rendering

## References

- Seed: [seed-agentic-npc-constitution.yaml](../../../seed-agentic-npc-constitution.yaml)
- Ambiguity: 0.14 | Interview: ooo interview — agentic-npc-constitution — 2026-03-13
- BAR Lobby World spec: [bar-lobby-world/spec.md](../bar-lobby-world/spec.md) (Giacomo in Card Club)
- NPC Action Verbs: `reveal_lore` · `ask_question` · `challenge_player` · `affirm_player` · `offer_quest_seed` · `reflect_bar` · `redirect_scene` · `deepen_scene` · `handoff_to_other_npc`
