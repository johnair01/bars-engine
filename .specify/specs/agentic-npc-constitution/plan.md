# Plan: Agentic NPC Constitution System + Emotional Alchemy Scene Library
### Regent + Architect Implementation Plan

---

## Agent Roles in This Plan

| Agent | Domain |
|-------|--------|
| **Regent** | Constitutional governance: validation rules, behavioral enforcement, narrative coherence, Regent priority ordering, reflection review policy |
| **Architect** | Structural design: schema, API endpoints, data flow, type system, service boundaries, integration wiring |

---

## Dependency Order

```
AES Phase 1: Alchemy State Model
        ↓
AES Phase 2: Scene Template Seed + Selection
        ↓
ANC Phase 1: NPC Schema + Constitution CRUD
        ↓
ANC Phase 2: Regent Governance Service
        ↓
ANC Phase 3: NPC Memory Layer
        ↓
ANC Phase 4: Reflection Layer (Regent-gated)
        ↓
ANC Phase 5: Action Verb Layer
        ↓
ANC Phase 6: Admin UI (Regent oversight)
```

---

## AES Phase 1: Alchemy State Model
**Owner: Architect**

Add altitude to the existing emotion system.

### Schema additions (`prisma/schema.prisma`)

```prisma
model AlchemyPlayerState {
  id        String   @id @default(cuid())
  playerId  String   @unique
  channel   String   // fear | anger | sadness | joy | neutrality
  altitude  String   // dissatisfied | neutral | satisfied
  updatedAt DateTime @updatedAt

  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade)
  @@map("alchemy_player_states")
}

model AlchemySceneEvent {
  id          String   @id @default(cuid())
  playerId    String
  templateId  String
  choiceKey   String?
  outcome     String?  // altitude reached
  createdAt   DateTime @default(now())

  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade)
  @@index([playerId])
  @@map("alchemy_scene_events")
}
```

### Types (`src/lib/alchemy/types.ts`)

```ts
export type AlchemyAltitude = 'dissatisfied' | 'neutral' | 'satisfied'
export type EmotionChannel = 'fear' | 'anger' | 'sadness' | 'joy' | 'neutrality'
// extend, do not duplicate charge-quest-generator/types.ts
```

### Actions (`src/actions/alchemy.ts`)

- `getPlayerAlchemyState(playerId)` → channel + altitude
- `setPlayerAlchemyState(playerId, channel, altitude)` → upsert
- `advancePlayerAltitude(playerId)` → step toward satisfied
- Called from: BAR creation, 321 completion, scene resolution

---

## AES Phase 2: Scene Template Seed + Selection
**Owner: Architect (structure) + Regent (template quality review)**

### Schema

```prisma
model AlchemySceneTemplate {
  id             String  @id @default(cuid())
  channel        String
  altitudeFrom   String
  altitudeTo     String
  title          String
  situation      String
  friction       String
  invitation     String
  choices        String  // JSON: [{key, label, isGrowth}]
  advice         String?
  archetypeBias  String? // JSON: archetype slugs that prefer this template
  nationBias     String? // JSON: nation slugs

  @@index([channel, altitudeFrom])
  @@map("alchemy_scene_templates")
}
```

### Seed (`seed-alchemy-scenes.yaml`)

10 vectors × 2 templates minimum (20 templates from ingested library).
Seed in YAML, imported via existing seed script pattern.

### Service (`src/lib/alchemy/select-scene.ts`)

```ts
selectScene(playerId: string, opts?: { archetypeSlug?, nationSlug?, campaignPhase? })
  → AlchemySceneTemplate | null
```

Priority weights: player BAR history > archetype bias > nation bias > campaign phase.
Never random. Always relevant.

---

## ANC Phase 1: NPC Schema + Constitution CRUD
**Owner: Architect**

### Schema additions

```prisma
model NpcConstitution {
  id                   String   @id @default(cuid())
  name                 String
  archetypalRole       String
  tier                 Int      @default(1) // 1-4
  constitutionVersion  String   @default("1.0")
  identity             String   // JSON: core_nature, voice_style, worldview, mask_type
  values               String   // JSON: protects[], longs_for[], refuses[]
  function             String   // JSON: primary_scene_role, quest_affinities[], bar_affinities[]
  limits               String   // JSON: can_initiate[], cannot_do[], requires_regent_approval_for[]
  memoryPolicy         String   // JSON: scope, retention_rules[]
  reflectionPolicy     String   // JSON: allowed, frequency, max_outputs
  governedBy           String   @default("regent_game_master")
  status               String   @default("draft") // draft|active|suspended|archived
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  versions     NpcConstitutionVersion[]
  memories     NpcMemory[]
  reflections  NpcReflection[]
  actions      NpcAction[]
  relationships NpcRelationshipState[]

  @@map("npc_constitutions")
}

model NpcConstitutionVersion {
  id               String   @id @default(cuid())
  npcId            String
  version          String
  snapshot         String   // JSON full constitution at this version
  changedBy        String   // regent_game_master | admin
  createdAt        DateTime @default(now())

  npc NpcConstitution @relation(fields: [npcId], references: [id], onDelete: Cascade)
  @@index([npcId])
  @@map("npc_constitution_versions")
}

model NpcMemory {
  id          String   @id @default(cuid())
  npcId       String
  playerId    String?
  campaignId  String?
  memoryType  String   // scene | relationship | campaign
  summary     String
  tags        String   @default("[]") // JSON
  isCanon     Boolean  @default(false)
  createdAt   DateTime @default(now())

  npc    NpcConstitution @relation(fields: [npcId], references: [id], onDelete: Cascade)
  player Player?         @relation(fields: [playerId], references: [id], onDelete: SetNull)
  @@index([npcId])
  @@index([npcId, playerId])
  @@map("npc_memories")
}

model NpcReflection {
  id           String   @id @default(cuid())
  npcId        String
  campaignId   String?
  inputSummary String
  outputs      String   // JSON: stance_update, possible_hooks[], bar_affinity_shift[]
  status       String   @default("pending") // pending|approved|rejected
  reviewedBy   String?
  reviewedAt   DateTime?
  createdAt    DateTime @default(now())

  npc NpcConstitution @relation(fields: [npcId], references: [id], onDelete: Cascade)
  @@index([npcId, status])
  @@map("npc_reflections")
}

model NpcAction {
  id                     String   @id @default(cuid())
  npcId                  String
  sceneId                String?
  verb                   String   // reveal_lore | ask_question | challenge_player | etc.
  payload                String   // JSON
  requiresRegentApproval Boolean  @default(false)
  status                 String   @default("executed") // executed|blocked|pending
  reason                 String?
  createdAt              DateTime @default(now())

  npc NpcConstitution @relation(fields: [npcId], references: [id], onDelete: Cascade)
  @@index([npcId])
  @@map("npc_actions")
}

model NpcRelationshipState {
  id         String   @id @default(cuid())
  npcId      String
  playerId   String
  campaignId String?
  trust      Int      @default(0) // -100 to 100
  tension    Int      @default(0) // 0 to 100
  state      String   @default("{}") // JSON: freeform relational metadata
  updatedAt  DateTime @updatedAt

  npc    NpcConstitution @relation(fields: [npcId], references: [id], onDelete: Cascade)
  player Player          @relation(fields: [playerId], references: [id], onDelete: Cascade)
  @@unique([npcId, playerId])
  @@map("npc_relationship_states")
}
```

### Actions (`src/actions/npc-constitution.ts`)

- `createNpcConstitution(data)` → creates in draft status, records v1
- `getNpcConstitution(npcId)`
- `listNpcConstitutions(filter?: { status, tier })`
- `requestConstitutionUpdate(npcId, proposedChanges)` → creates version bump, status=pending_regent_review

---

## ANC Phase 2: Regent Governance Service
**Owner: Regent**

Core of the constitutional system. All activation and mutation gated here.

### Service (`src/lib/regent-gm.ts`)

```ts
// Validates constitution against schema + system laws
validateNpcConstitution(constitution): ValidationResult

// Activates constitution — only called by Regent logic
activateNpcConstitution(npcId): Promise<void>

// Suspends NPC whose behavior drifts
suspendNpcConstitution(npcId, reason): Promise<void>

// Regent priority order enforcement
// 1. canonical world laws → 2. campaign coherence → 3. player growth
// → 4. EA alignment → 5. NPC constitutional integrity → 6. NPC initiative
checkRegentPriority(action, context): 'allowed' | 'blocked' | 'requires_review'
```

### Validation Rules (Regent domain)

- `limits.cannot_do` must never include bypasses of: vibeulon minting, privacy rules, scene DSL, campaign phase
- `governance.governed_by` must always be `"regent_game_master"`
- Tier 3/4 constitutions require explicit `reflectionPolicy.background_reflection_allowed`
- `requires_regent_approval_for` must include any sovereign-adjacent actions

### API Routes (`src/app/api/npc-constitutions/`)

```
POST   /api/npc-constitutions                         → createNpcConstitution
GET    /api/npc-constitutions/[id]                    → getNpcConstitution
POST   /api/npc-constitutions/[id]/validate           → validateNpcConstitution (Regent)
POST   /api/npc-constitutions/[id]/activate           → activateNpcConstitution (Regent-only)
POST   /api/npc-constitutions/[id]/request-update     → requestConstitutionUpdate
POST   /api/npc-constitutions/[id]/suspend            → suspendNpcConstitution (Regent-only)
```

---

## ANC Phase 3: NPC Memory Layer
**Owner: Architect (storage) + Regent (pruning policy)**

### Actions (`src/actions/npc-memory.ts`)

- `addNpcMemory(npcId, playerId, summary, type, tags)`
- `getNpcMemories(npcId, playerId?, type?)`
- `pruneNpcMemories(npcId)` — apply retention_rules from constitution (Regent policy)
- `markMemoryCanon(memoryId)` — Regent marks as permanent

Memory is capped by `memoryPolicy.retention_rules`. Default: last 10 scene memories, 5 relationship memories, 3 campaign memories per NPC per player.

---

## ANC Phase 4: Reflection Layer
**Owner: Regent (approval gating)**

### Actions (`src/actions/npc-reflection.ts`)

- `generateNpcReflection(npcId, inputSummary)` → creates pending reflection
- `reviewNpcReflection(reflectionId, action: 'approve'|'reject', notes?)` → Regent-only
- `getApprovedReflections(npcId)` → feed into NPC context

Reflection outputs: `stance_update`, `possible_hooks[]` (≤2), `bar_affinity_shift[]`.
No reflection output is active until approved.

---

## ANC Phase 5: Action Verb Layer
**Owner: Architect (structure) + Regent (validation rules)**

### Service (`src/lib/npc-action-validator.ts`)

```ts
validateNpcAction(action: NpcActionInput, constitution: NpcConstitution, context): ValidationResult
// Checks: verb in can_initiate_scene_types? requires_regent_approval? system laws?
```

### Execution (`src/actions/npc-actions.ts`)

- `executeNpcAction(npcId, sceneId, verb, payload)` → validate → execute or block
- Verbs map to scene grammar functions:
  - `offer_quest_seed` → generates QuestProposal (Regent-reviewed)
  - `reflect_bar` → surfaces BAR content to player
  - `reveal_lore` → injects lore passage

---

## ANC Phase 6: Admin UI (Regent oversight console)
**Owner: Regent (governance UI)**

### Pages

- `/admin/npcs` — list constitutions by tier/status
- `/admin/npcs/[id]` — constitution editor (create/edit/activate/suspend)
- `/admin/npcs/[id]/reflections` — pending reflection review queue
- `/admin/npcs/[id]/memories` — memory viewer with prune controls

Activate/suspend buttons only available to admin (maps to Regent authority).

---

## Wiring AES → ANC

| AES Output | ANC Consumer |
|------------|-------------|
| `selectScene(playerId)` | NPC action: `deepen_scene` uses scene vector to guide response |
| Player altitude advance | Triggers NPC reflection: positive stance update |
| Scene channel (e.g. anger:frustration) | NPC constitution `function.quest_affinities` biases action verb choice |
| Composite state (Dread, Awe) | Tints NPC `identity.mask_type` in scene copy |

---

## Implementation Order Summary

| Phase | Owner | Key Deliverable |
|-------|-------|-----------------|
| AES-1 | Architect | AlchemyPlayerState + AlchemySceneEvent schema + actions |
| AES-2 | Architect + Regent | Scene templates seeded, selectScene() |
| ANC-1 | Architect | NpcConstitution schema + CRUD actions |
| ANC-2 | Regent | regent-gm.ts validation + activation + API routes |
| ANC-3 | Architect + Regent | NPC memory + pruning policy |
| ANC-4 | Regent | Reflection generate + review flow |
| ANC-5 | Architect + Regent | Action verb validation + execution |
| ANC-6 | Regent | Admin oversight console |

---

## Start Small Protocol (from spec)

1. Implement one Tier-1 NPC (static, constitution-lite) end-to-end first.
2. Add one Tier-4 NPC (e.g. existing Daemon pattern) as the first full-constitution case.
3. Only then scaffold Tier 2/3 relational + reflective paths.
4. Do not build the full admin UI before the governance service is proven.
