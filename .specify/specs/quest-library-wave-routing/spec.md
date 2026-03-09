# Spec: Quest Library Wave Routing and Training

## Purpose

Route book-derived quests by move type (Wake Up, Clean Up, Grow Up, Show Up) to the surfaces where they are most useful. Train the quest grabber and validator so generated quests align with model quality. Automate admin review so most work is ensuring quests are available for players.

**Problem**: Book quests are published to Quest Library as a single thread. There is no routing by move type. EFA is for vibeulon-generating moves, not for learning moves. Admin manually reviews every quest. No automation to align generated quests with model exemplars or to suggest extending quests into adventures.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Routing by moveType** | After admin approves, quests are tagged with `questPool` (or equivalent) based on moveType. Clean Up → EFA pool; Grow Up → Dojo pool; Show Up → gameboard/domains; Wake Up → discovery/audit pool. |
| **EFA quest pool** | New concept. Clean Up quests that help players learn moves or increase skill at moves. Distinct from current EFA tools (vibeulon moves). Pool = queryable set of quests; EFA UI surfaces these when player needs move-learning content. |
| **Dojo pool** | Grow Up quests. Part of larger game map (future). For now: tag and store; Dojo UI deferred. |
| **Discovery pool** | Wake Up quests. Admin queue for review; eventual player-facing discovery with validation. |
| **Book quests → Quest Library** | Confirm: published book quests go to Quest Library (creatorType='library'), NOT marketplace. Marketplace = player-created. |
| **Auto-assign** | AI analysis already outputs moveClassifications. Add `sourceType: 'book'` or `bookType` to CustomBar. Auto-route to pool based on moveType. |
| **Auto-suggest / apply edits** | Compare generated quest to model quests; suggest edits (tone, structure, clarity). Admin can apply or reject. Phase 2+. |
| **Model quests** | Curated exemplars (high-quality quests) used as few-shot or fine-tuning data. Stored as reference; used in prompts. |
| **Extend to adventure** | Suggest: "This quest could become a branched adventure." Link to quest grammar / Twine flow. Phase 2+. |
| **Training** | Improve AI prompts (few-shot, model quests in context). Fine-tune quest models: deferred to infra phase. |

## Conceptual Model

| Move | Pool / Surface | Purpose |
|------|----------------|---------|
| **Wake Up** | Discovery / Audit pool | New quests to review; players discover aligned quests; validation |
| **Clean Up** | EFA quest pool | Learn moves, increase skill at moves (distinct from EFA vibeulon tools) |
| **Grow Up** | Dojo pool (Game Master Schools) | Skill capacity; part of larger game map |
| **Show Up** | Domains + gameboard | Actionable; available to take in domains and on gameboard |

**WHO**: Admin (reviewer, approver), Player (discoverer, puller)  
**WHAT**: CustomBar (quests), QuestPool (tagged sets)  
**WHERE**: Allyship domains; pool determines surface  
**Energy**: Vibeulons  
**Personal throughput**: 4 moves — routing key

## API Contracts (API-First)

### getQuestsByPool(pool: QuestPoolType)

**Input**: `{ pool: 'efa' | 'dojo' | 'discovery' | 'gameboard'; playerId?: string }`  
**Output**: `Promise<{ quests: QuestSummary[] } | { error: string }>`

- Returns quests tagged for that pool. Filter by player context when relevant.

### assignQuestToPool(questId: string, pool: QuestPoolType)

**Input**: `{ questId: string; pool: QuestPoolType }`  
**Output**: `Promise<{ success: true } | { error: string }>`

- Admin or system: assign quest to pool. Used after approval when auto-routing.

### getModelQuests(moveType?: PersonalMoveType)

**Input**: `{ moveType?: 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp' }`  
**Output**: `Promise<QuestSummary[]>`

- Returns curated model quests for prompt context or comparison.

### suggestQuestEdits(questId: string)

**Input**: `{ questId: string }`  
**Output**: `Promise<{ suggestions: EditSuggestion[] } | { error: string }>`

- Compare quest to model quests; return suggested edits. Phase 2.

## User Stories

### P1: Auto-route by move type

**As an admin**, when I approve a book-derived quest, it is automatically assigned to the correct pool (EFA, Dojo, Discovery, Gameboard) based on moveType, so I don't have to manually categorize.

**Acceptance**: On approve, quest gets `questPool` (or equivalent) set from moveType. Clean Up → efa; Grow Up → dojo; Show Up → gameboard; Wake Up → discovery.

### P2: EFA quest pool

**As a player**, I can access Clean Up quests that help me learn or improve at moves, so I build skill before Show Up.

**Acceptance**: EFA surface (or linked surface) shows quests from EFA pool. Distinct from current EFA tools (vibeulon moves).

### P3: Discovery pool (admin)

**As an admin**, I see Wake Up quests in a discovery/audit queue, so I can review and ensure quality before they surface to players.

**Acceptance**: Admin queue shows quests in discovery pool. Approve/reject or route to other pools.

### P4: Discovery pool (player, future)

**As a player**, I can discover aligned quests from the discovery pool and validate their quality, so the system improves and I find relevant content.

**Acceptance**: Deferred. Player discovery + validation is Phase 2+.

### P5: Model quest alignment

**As an admin**, I see suggested edits to make a generated quest more like our model quests, so I can approve with one click instead of manual rewriting.

**Acceptance**: Phase 2. suggestQuestEdits returns edits; admin can apply or reject.

### P6: Extend to adventure

**As an admin**, I see a suggestion to extend a quest into a branched adventure, so I can grow the content library efficiently.

**Acceptance**: Phase 2+. Link to quest grammar / Twine flow.

## Functional Requirements

### Phase 1: Routing and pool tagging

- **FR1**: Add `questPool` (or `sourcePool`) to CustomBar: `'efa' | 'dojo' | 'discovery' | 'gameboard' | null`. Default null for backward compat.
- **FR2**: On quest approve (book-quest-review), set `questPool` from moveType: cleanUp→efa, growUp→dojo, showUp→gameboard, wakeUp→discovery.
- **FR3**: Ensure book quests publish to Quest Library (creatorType='library'), not marketplace. Verify createThreadFromBook flow.
- **FR4**: `getQuestsByPool(pool)` — query CustomBar where questPool = pool, status = active, isSystem = true (or library source).

### Phase 2: EFA quest pool surface

- **FR5**: EFA quest pool = CustomBars where questPool='efa'. New concept: quests that help learn moves.
- **FR6**: Surface EFA pool quests in EFA UI or linked "Learn moves" section. Design: list/filter by move, allyship domain.
- **FR7**: Player can pull EFA pool quest to active journey (same as Quest Library pull).

### Phase 3: Discovery pool (admin queue)

- **FR8**: Admin discovery queue: quests where questPool='discovery'. Page or section in admin.
- **FR9**: Admin can approve (move to other pool or keep in discovery), reject, or edit before approval.
- **FR10**: New book quests with moveType=wakeUp default to discovery pool (audit before player-facing).

### Phase 4: Dojo pool (stub)

- **FR11**: Dojo pool = CustomBars where questPool='dojo'. Storage and query only. Dojo UI deferred (part of larger game map).

### Phase 5: Model quests and suggestions (Phase 2+)

- **FR12**: Model quests: curated CustomBars marked as `isModelQuest: true` or in separate table. Used for few-shot in prompts.
- **FR13**: suggestQuestEdits(questId): compare to model quests; return tone, structure, clarity suggestions.
- **FR14**: Admin can apply suggestions in bulk or one-by-one.
- **FR15**: Suggestion: "Extend to adventure" — link to quest grammar flow when quest has branching potential.

### Phase 6: Training (prompts and fine-tuning)

- **FR16**: Inject model quests into book analysis prompt (few-shot) to improve output quality.
- **FR17**: Fine-tune quest models: infra phase; document data requirements (model quests + approved book quests).

## Non-Functional Requirements

- Backward compatible: existing quests without questPool remain valid; null = legacy/unrouted.
- No background jobs for routing; derive at approve time.
- Model quests: small set (5–10 per move) for prompt efficiency.

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| AI calls | suggestQuestEdits: cache model embeddings; rate limit |
| Model quests | Store in DB or config; limit to ~40 total |
| Pool queries | Index questPool; filter by status |

## Verification Quest

- **ID**: `cert-quest-library-wave-routing-v1`
- **Steps**: (1) Create or use book with analyzed quests; (2) Approve quests; (3) Verify questPool set from moveType; (4) Query getQuestsByPool for each pool; (5) Confirm EFA pool quests surface in EFA or linked UI.
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [Book-to-Quest Library](.specify/specs/book-to-quest-library/spec.md) — PDF ingestion, Quest Library
- [Book Quest Draft and Admin Review](.specify/specs/book-quest-draft-review/spec.md) — approve flow
- Emotional First Aid (existing) — EFA tools; extend with quest pool
- Gameboard (existing) — Show Up quests surface

## References

- [src/actions/book-quest-review.ts](../../src/actions/book-quest-review.ts) — approve, publish
- [src/actions/book-to-thread.ts](../../src/actions/book-to-thread.ts) — createThreadFromBook
- [src/lib/emotional-first-aid.ts](../../src/lib/emotional-first-aid.ts) — EFA tools
- [prisma/schema.prisma](../../prisma/schema.prisma) — CustomBar
