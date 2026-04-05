# Implementation Plan: Daemon Seeds, BAR Capture, and Charge Routing

## 1. Existing Structures Found

### 1.1 3-2-1 / Shadow Work

| File | Contents | Extension Point |
|------|----------|-----------------|
| `src/components/shadow/Shadow321Form.tsx` | Full 3→2→1 flow (Face It, Talk to It, Be It); `deriveMetadata321`; post-321 actions: Create BAR, Turn into Quest, Fuel System, Skip | Add routing panel: Turn into Daemon Seed, Convert to Vibeulon, Allocate to Quest, Attach to Quest/BAR |
| `src/app/shadow/321/page.tsx` | Route for 321 flow | No change |
| `src/lib/quest-grammar/deriveMetadata321.ts` | Deterministic Metadata321 from phase3/phase2/phase1 | Extend Metadata321 with chargeAmount, isRoutable if needed |
| `src/actions/charge-metabolism.ts` | `persist321Session`, `createQuestFrom321Metadata`, `fuelSystemFrom321`; Shadow321Session persistence | Add `createDaemonSeedFromBar`, `routeBarToVibeulon`, `routeBarToQuest`, `attachBarToBar`, `attachBarToQuest` |
| `prisma/schema.prisma` → `Shadow321Session` | id, playerId, phase3Snapshot, phase2Snapshot, outcome, linkedBarId, linkedQuestId, questCompletedAt | Extend outcome enum: add `daemon_seed_created`, `routed_to_quest`, etc. or keep outcome and add routing events |
| `.specify/specs/321-shadow-process/spec.md` | BAR creation from 321; metadata321; vibeulon mint to BAR creator on quest completion | Align daemon routing with this flow |

### 1.2 BAR / CustomBar

| File | Contents | Extension Point |
|------|----------|-----------------|
| `prisma/schema.prisma` → `CustomBar` | type (charge_capture, insight, vibe, quest), source321SessionId, sourceBarId, barCandidateId, parentId, completionEffects, inputs | Add `originType` (THREE_TWO_ONE, MANUAL, QUEST_REFLECTION) or use completionEffects JSON; add `isRoutable` or derive from type+inputs |
| `src/actions/charge-capture.ts` | `createChargeBar`, `run321FromCharge`, charge_capture BAR creation | Extend createChargeBar to accept source321SessionId; add routing actions |
| `src/actions/create-bar.ts` | createCustomBar with metadata321 | Store source321SessionId when from 321; set completionEffects for charge provenance |
| `src/features/bar-system/types/index.ts` | barType: charge_capture \| insight \| vibe | No change; charge_capture already exists |

### 1.3 Vibeulon / Economy

| File | Contents | Extension Point |
|------|----------|-----------------|
| `prisma/schema.prisma` → `Vibulon` | ownerId, creatorId, originSource, originId, originTitle, generation, stakedOnBarId | Use originSource='bar_charge_routing', originId=sourceBarId for BAR→vibeulon conversions |
| `prisma/schema.prisma` → `VibulonEvent` | playerId, source, amount, notes, questId | Add source='bar_charge_conversion'; extend notes for sourceBarId |
| `prisma/schema.prisma` → `VibeulonLedger` | playerId, amount, type (MINT, ATTUNE, SPEND, TRANSMUTE), metadata | Add BAR_CHARGE_CONVERSION or use MINT with metadata: { sourceBarId, sourceType } |
| `src/actions/vibeulon-map.ts` | Vibeulon mapping logic | Integrate BAR charge conversion |
| `.agent/context/vibeulons_schema.md` | Provenance spec | Extend for bar_charge_routing provenance |

### 1.4 Lineage / Provenance

| File | Contents | Extension Point |
|------|----------|-----------------|
| `prisma/schema.prisma` → `SourceLineageEdge` | fromEntityType, fromEntityId, toEntityType, toEntityId, relationType | Use for BAR→DaemonSeed, BAR→Quest, BAR→BAR; relationType: ROUTED_TO_DAEMON_SEED, ALLOCATED_TO_QUEST, ATTACHED_TO_BAR, etc. |
| `src/services/source-lineage-service.ts` | createEdge, getLineage | Extend for charge routing lineage |
| `CustomBar.sourceBarId`, `source321SessionId` | Quest from BAR; Quest from 321 | Reuse pattern for BAR→Quest attachment |

### 1.5 Quest / Gameboard

| File | Contents | Extension Point |
|------|----------|-----------------|
| `CustomBar.parentId` | Quest tree (subquests) | BAR attachment to quest: use completionEffects or new BarAttachment model |
| `src/actions/quest-engine.ts` | completeQuest, quest completion | On completion: mint vibeulons; extend for BAR-derived allocations |
| Gameboard / face-up quests | GameboardSlot, campaign deck | Use for "allocate to face-up quest" — list eligible quests |

### 1.6 Daemon / Part / Seed

| Search Result | Finding |
|---------------|---------|
| `daemon`, `daimon`, `demon` | No existing models or types. Only generic words (demonstrate, etc.) |
| `shadow` | Shadow321Form, shadow work, shadow_walker (nation), shadowSignposts | No DaemonSeed or daemon entity |
| `part` | No relevant model |
| `seed` | QuestSeed, BarCandidate, "seeds with provenance" (FOUNDATIONS.md), seed-utils | No DaemonSeed. "Seed" used for BARs as seeds, quest seeds |

**Conclusion**: DaemonSeed, BarChargeCapture, BarRoutingEvent, BarAttachment, QuestChargeAllocation are **net-new** models. Extend Shadow321Form, charge-metabolism, CustomBar (via completionEffects or minimal new fields), Vibulon/VibulonEvent, and SourceLineageEdge.

---

## 2. Recommended Schema Changes or Extensions

### 2.1 New Models (Prisma)

```prisma
model DaemonSeed {
  id               String   @id @default(cuid())
  createdById      String
  sourceBarId      String
  name             String
  description      String?
  status           String   @default("SEED")  // SEED | OBSERVED | ENGAGED | ALLIED | ARCHIVED
  chargeSignature  String?
  shadowFunction   String?
  giftPotential    String?
  archetypeTags    String   @default("[]")   // JSON array
  domainTags       String   @default("[]")  // JSON array
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  createdBy  Player    @relation(fields: [createdById], references: [id], onDelete: Cascade)
  sourceBar  CustomBar @relation(fields: [sourceBarId], references: [id], onDelete: Cascade)

  @@index([createdById])
  @@index([sourceBarId])
  @@index([status])
  @@map("daemon_seeds")
}

model BarChargeCapture {
  id              String    @id @default(cuid())
  barId           String    @unique
  sourceType      String    // THREE_TWO_ONE | MANUAL | QUEST_REFLECTION
  sourceSessionId String?   // Shadow321Session.id when from 321
  chargeAmount    Int       @default(1)
  chargeType      String?   // anger | joy | sadness | fear | neutrality (from inputs)
  insightSummary  String?
  isRoutable      Boolean   @default(true)
  routedAt        DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  bar CustomBar @relation(fields: [barId], references: [id], onDelete: Cascade)

  @@index([barId])
  @@index([sourceType])
  @@map("bar_charge_captures")
}

model BarRoutingEvent {
  id                 String   @id @default(cuid())
  sourceBarId        String
  routeType          String   // CREATE_DAEMON_SEED | ALLOCATE_TO_QUEST | ATTACH_TO_QUEST | ATTACH_TO_BAR | CONVERT_TO_VIBEULON
  targetEntityType   String   // daemon_seed | quest | bar
  targetEntityId     String
  chargeAmountRouted Int?
  createdById        String
  createdAt          DateTime @default(now())

  sourceBar  CustomBar @relation(fields: [sourceBarId], references: [id], onDelete: Cascade)
  createdBy  Player    @relation(fields: [createdById], references: [id], onDelete: Cascade)

  @@index([sourceBarId])
  @@index([targetEntityType, targetEntityId])
  @@map("bar_routing_events")
}

model BarAttachment {
  id               String   @id @default(cuid())
  sourceBarId      String
  targetEntityType String   // bar | quest
  targetEntityId   String
  attachmentType   String   // SUPPORTING_CONTEXT | CHARGE_SOURCE | INSIGHT_LINK | DAEMON_TRACE
  createdById      String
  createdAt        DateTime @default(now())

  sourceBar  CustomBar @relation(fields: [sourceBarId], references: [id], onDelete: Cascade)
  createdBy  Player    @relation(fields: [createdById], references: [id], onDelete: Cascade)

  @@index([sourceBarId])
  @@index([targetEntityType, targetEntityId])
  @@map("bar_attachments")
}

model QuestChargeAllocation {
  id                  String   @id @default(cuid())
  questId             String
  sourceBarId         String?
  sourceDaemonSeedId  String?
  allocatedById       String
  amount              Int
  allocationType      String   // VIBEULON | CHARGE | DAEMON_ENERGY
  createdAt           DateTime @default(now())

  quest             CustomBar  @relation(fields: [questId], references: [id], onDelete: Cascade)
  sourceBar         CustomBar? @relation("QuestAllocationFromBar", fields: [sourceBarId], references: [id], onDelete: SetNull)
  sourceDaemonSeed  DaemonSeed? @relation(fields: [sourceDaemonSeedId], references: [id], onDelete: SetNull)
  allocatedBy       Player     @relation(fields: [allocatedById], references: [id], onDelete: Cascade)

  @@index([questId])
  @@index([sourceBarId])
  @@map("quest_charge_allocations")
}
```

### 2.2 CustomBar Extensions

Add to CustomBar:

```prisma
// In CustomBar
barChargeCapture    BarChargeCapture?
routingEvents       BarRoutingEvent[]
attachmentsAsSource BarAttachment[]
questAllocationsFromBar QuestChargeAllocation[] @relation("QuestAllocationFromBar")
daemonSeedsFromBar  DaemonSeed[]
```

### 2.3 Player Extensions

```prisma
// In Player
daemonSeeds         DaemonSeed[]
barRoutingEvents    BarRoutingEvent[]
barAttachments      BarAttachment[]
questChargeAllocations QuestChargeAllocation[]
```

---

## 3. Migration / Compatibility Plan

1. **Phase 1 — Schema**: Add new models; add relations to CustomBar and Player. Run `npm run db:sync`.
2. **Phase 2 — Backfill**: No backfill required. New BARs from 321 get BarChargeCapture when created with charge.
3. **Phase 3 — Existing BARs**: BARs created before this feature have no BarChargeCapture; `isRoutable` is false by default for those. Only BARs with BarChargeCapture can be routed.
4. **Shadow321Session**: Keep as-is. When BAR is created from 321, create BarChargeCapture with sourceSessionId = Shadow321Session.id (from persist321Session or createCustomBar flow).

---

## 4. Service Architecture

| Service | Location | Methods |
|---------|----------|---------|
| daemon-seed-service | `src/services/daemon-seed-service.ts` | `createFromBar(barId, name, description?, playerId)`, `getById(id)`, `listByPlayer(playerId)` |
| bar-charge-service | `src/services/bar-charge-service.ts` | `captureFrom321(barId, sessionId, chargeAmount?, chargeType?)`, `getByBarId(barId)`, `markRouted(barId)` |
| bar-routing-service | `src/services/bar-routing-service.ts` | `routeToDaemonSeed(barId, playerId)`, `convertToVibeulon(barId, playerId, amount?)`, `allocateToQuest(barId, questId, playerId, amount)`, `attachToQuest(barId, questId, playerId, attachmentType)`, `attachToBar(barId, targetBarId, playerId, attachmentType)` |
| bar-attachment-service | `src/services/bar-attachment-service.ts` | `attach(sourceBarId, targetEntityType, targetEntityId, attachmentType, playerId)`, `listAttachments(barId)`, `listAttachmentsTo(targetEntityType, targetEntityId)` |
| quest-allocation-service | `src/services/quest-allocation-service.ts` | `allocateFromBar(questId, sourceBarId, amount, playerId)`, `getAllocationsForQuest(questId)` |

---

## 5. API / Procedure Changes

### 5.1 Server Actions (extend `src/actions/charge-metabolism.ts` and new file)

| Action | Signature | Purpose |
|--------|-----------|---------|
| `createDaemonSeedFromBar` | `(barId: string, name: string, description?: string) => Promise<{ success, daemonSeedId } \| { error }>` | Create DaemonSeed from BAR; create BarRoutingEvent; mark BarChargeCapture routed |
| `convertBarChargeToVibeulon` | `(barId: string, amount?: number) => Promise<{ success, vibeulonAmount } \| { error }>` | Convert captured charge to vibeulon; mint Vibulon/VibulonEvent; mark routed |
| `allocateBarChargeToQuest` | `(barId: string, questId: string, amount: number) => Promise<{ success } \| { error }>` | Create QuestChargeAllocation; optionally mint vibeulon to quest; mark routed |
| `attachBarToQuest` | `(sourceBarId: string, questId: string, attachmentType: string) => Promise<{ success } \| { error }>` | Create BarAttachment |
| `attachBarToBar` | `(sourceBarId: string, targetBarId: string, attachmentType: string) => Promise<{ success } \| { error }>` | Create BarAttachment |
| `getEligibleFaceUpQuests` | `(playerId: string) => Promise<CustomBar[]>` | List quests on gameboard / assigned to player that are face-up |

### 5.2 createCustomBar / createChargeBar Extensions

- When `metadata321` present and BAR created: create `BarChargeCapture` with sourceType=THREE_TWO_ONE, sourceSessionId from persist321Session.
- When `createChargeBar` used: create BarChargeCapture with sourceType=MANUAL or CHARGE_CAPTURE.

---

## 6. UI Changes

### 6.1 Post-321 BAR Outcome Panel (extend Shadow321Form)

After "Create BAR" is chosen and user returns from Forge with a new BAR, OR in a new post-321 panel when BAR is created inline:

- **Save BAR** (existing)
- **Turn into Daemon Seed** → `createDaemonSeedFromBar`; redirect to daemon seed detail
- **Convert to Vibeulon** → `convertBarChargeToVibeulon`; show success
- **Allocate to Face-Up Quest** → modal with `getEligibleFaceUpQuests`; select quest; `allocateBarChargeToQuest`
- **Attach to Quest** → quest picker; `attachBarToQuest`
- **Attach to BAR** → BAR picker; `attachBarToBar`

### 6.2 BAR Detail View (`/bars/[id]`)

- Show `BarChargeCapture` if present: charge amount, source type, isRoutable, routedAt
- Show routing history (BarRoutingEvent)
- Show linked DaemonSeed if any
- Show attached quests/BARs (BarAttachment)

### 6.3 Daemon Seed Detail View (new route `/daemon-seeds/[id]`)

- name, description, status, source BAR link
- chargeSignature, shadowFunction, giftPotential (optional display)

### 6.4 Quest Detail / Board View

- Show QuestChargeAllocation from BAR-derived energy
- Show BarAttachment (supporting BARs)
- Quick action: "Allocate from BAR" when player has routable BARs

---

## 7. Deftness Hooks and Event Surfaces

| Hook | Location | Purpose |
|------|----------|---------|
| `evaluateDaemonIdentification` | `src/services/deftness-service.ts` (stub) | 321 process quality |
| `evaluateBarCapture` | bar-charge-service | BAR capture quality |
| `evaluateChargeRouting` | bar-routing-service | Routing decision quality |
| `evaluateQuestAllocation` | quest-allocation-service | Allocation alignment |
| `evaluateLineageIntegrity` | lineage-service (extend SourceLineageEdge) | Chain coherence |

Events (log to console or telemetry):

- `three_two_one.completed`
- `bar.created_from_shadow_work`
- `bar.routed`
- `daemon_seed.created`
- `quest.charge_allocated`
- `bar.attached`

---

## 8. Tests

| Test | File | Scope |
|------|------|-------|
| BAR created from 321 has BarChargeCapture | `bar-charge-service.test.ts` | captureFrom321 creates record |
| BAR routed to daemon seed | `bar-routing-service.test.ts` | routeToDaemonSeed creates DaemonSeed + BarRoutingEvent |
| Daemon seed links to source BAR | `daemon-seed-service.test.ts` | createFromBar links sourceBarId |
| BAR converted to vibeulon | `bar-routing-service.test.ts` | convertToVibeulon mints, marks routed |
| Quest allocation preserves source BAR | `quest-allocation-service.test.ts` | allocateFromBar creates QuestChargeAllocation |
| BAR attached to quest | `bar-attachment-service.test.ts` | attachToQuest creates BarAttachment |
| BAR attached to BAR | `bar-attachment-service.test.ts` | attachToBar creates BarAttachment |
| Duplicate routing prevented | `bar-routing-service.test.ts` | routed BAR cannot route again |
| Face-up quest eligibility | `quest-allocation-service.test.ts` | only eligible quests accepted |
| Lineage queryable | `source-lineage-service.test.ts` | createEdge for routing; getLineage returns chain |

---

## 9. Assumptions / TODOs

1. **Face-up quests**: Use `PlayerQuest` assigned + `CustomBar` status=active on gameboard or campaign. Exact eligibility TBD from gameboard logic.
2. **Charge amount**: Default 1 for MVP; can derive from 321 phase2Snapshot or inputs.emotion_channel intensity later.
3. **Partial routing**: v1 supports full route only; no splitting charge across multiple targets.
4. **Deftness**: Stub implementations; no full evaluation logic in v1.
5. **Admin Agent Forge**: Spec exists (admin-agent-forge); daemon routing for admins can integrate later.
6. **321 EFA Integration**: Spec CM (321 EFA Integration) — gold star vibeulon for 321 completion. Align with BAR→vibeulon conversion.
