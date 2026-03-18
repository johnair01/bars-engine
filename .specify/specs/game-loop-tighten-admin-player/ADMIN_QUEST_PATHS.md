# Admin Quest Creation Paths — Audit

**Spec**: [game-loop-tighten-admin-player](spec.md)  
**Task**: T0.1 — Document every admin quest-creation path.

---

## Summary Table

| Path | Location | One-click? | Grammatical? | Editable? | Campaign linkage |
|------|----------|------------|--------------|------------|------------------|
| upsertQuest | admin.ts, pack/thread pages | No | No | Yes (form) | Manual |
| Quest Grammar | /admin/quest-grammar | No (multi-step) | Yes (Epiphany Bridge/Kotter) | Yes (passages) | Manual |
| generateQuestFromReading | generate-quest.ts, DashboardCaster | Yes | Yes (Epiphany Bridge) | Yes (adventure) | Player thread |
| generateQuestProposalFromBar | bar-quest-generation | Yes | Structured | Yes after publish | Via proposal |
| Quest Proposals | /admin/quest-proposals | Yes (generate) + review | From BAR interpretation | Yes (edit before publish) | Via publishProposal |
| Book analysis | book-analyze.ts | Yes (per book) | AI-extracted | Yes (CustomBar) | None (library) |
| Gameboard createSubQuest | GameboardClient handleCreateQuestForAid | Yes | No | Yes (title+desc) | Auto (parentId) |
| Gameboard grammatical | GameboardClient + gameboard.ts | Yes (preview→accept→publish) | Yes (Epiphany Bridge) | Yes (Quest Grammar) | Auto (slot) |

---

## Path Details

### 1. upsertQuest

| Field | Value |
|-------|-------|
| **Location** | `src/actions/admin.ts`, `src/app/admin/quests/[id]/page.tsx`, `src/app/admin/journeys/thread/[id]/page.tsx`, `src/app/admin/journeys/pack/[id]/page.tsx` |
| **Input** | `{ id?, title, description?, reward?, type, inputs (JSON), allowedNations?, allowedTrigrams? }` |
| **Output** | `{ id: questId }` |
| **Grammar** | None — raw CustomBar fields |
| **Edit surface** | Admin form (title, description, inputs JSON) |
| **Campaign linkage** | None — quest is standalone. Admin manually assigns to thread/pack via updateThreadQuests / updatePackQuests |
| **One-click?** | No — manual form fill |
| **Auth** | `checkAdmin()` |

---

### 2. Quest Grammar

| Field | Value |
|-------|-------|
| **Location** | `src/app/admin/quest-grammar/` (UnpackingForm, GenerationFlow), `src/actions/quest-grammar.ts` |
| **Input** | Unpacking answers (Q1–Q6), alignedAction, segment, questModel (personal/communal), targetNationId, targetArchetypeIds, developmentalLens, hexagramId (optional) |
| **Output** | `SerializableQuestPacket` → `publishQuestPacketToPassages` (Twine passages) or `appendQuestToAdventure` |
| **Grammar** | Epiphany Bridge (personal) or Kotter (communal) — `compileQuestWithAI` / `compileQuestWithPrivilegingAction` |
| **Edit surface** | Twine passages (pack pages), Quest Outline Review (preview before publish) |
| **Campaign linkage** | Manual — publish creates CustomBar + passages; admin assigns to campaign/thread elsewhere |
| **One-click?** | No — multi-step: unpack → compile → review → publish |
| **Auth** | `checkAdmin()` (implicit via admin route) |

---

### 3. generateQuestFromReading

| Field | Value |
|-------|-------|
| **Location** | `src/actions/generate-quest.ts`, `src/components/DashboardCaster.tsx`, `src/components/QuestDetailModal.tsx` |
| **Input** | `hexagramId: number` |
| **Output** | `{ success, quest, adventureId?, questId?, threadId? }` or `{ error }` |
| **Grammar** | Epiphany Bridge — `compileQuestWithAI` with I Ching context, `generateRandomUnpacking` |
| **Edit surface** | Adventure (Twine) — created via `publishIChingQuestToPlayer` |
| **Campaign linkage** | Player thread (orientation-quest-3 completion); quest lands in player's adventure |
| **One-click?** | Yes — single button from hexagram cast |
| **Auth** | Player (not admin-only) — used in onboarding / I Ching flow |
| **Note** | Completes orientation-quest-3 regardless of result; player-facing, not admin content creation |

---

### 4. generateQuestProposalFromBar

| Field | Value |
|-------|-------|
| **Location** | `src/lib/bar-quest-generation/generate.ts`, `src/actions/quest-proposals.ts` |
| **Input** | `barId: string`, `options?: { allowRepeat? }` |
| **Output** | `{ success: true, proposalId, reviewStatus }` or `{ success: false, reason }` |
| **Grammar** | Structured proposal — eligibility → interpretation → emotional alchemy → proposal builder. No Epiphany Bridge/Kotter prose |
| **Edit surface** | QuestProposal record — admin edits title, description, completionConditions before publish |
| **Campaign linkage** | Via `publishQuestProposal` — creates CustomBar with `campaignRef`, `sourceBarId` from proposal |
| **One-click?** | Yes — `generateProposalFromBar(barId)` from `/admin/quest-proposals` |
| **Auth** | `checkAdmin()` |

---

### 5. Quest Proposals (publish flow)

| Field | Value |
|-------|-------|
| **Location** | `src/actions/quest-proposals.ts`, `src/lib/bar-quest-generation/publish.ts` |
| **Input** | `proposalId: string` (after admin approves + optionally edits) |
| **Output** | `{ success: true, questId }` or `{ success: false, reason }` |
| **Grammar** | Proposal fields (title, description) — no AI prose |
| **Edit surface** | Admin edits proposal before publish |
| **Campaign linkage** | `publishQuestProposal` creates CustomBar with `campaignRef`, `allyshipDomain`, `sourceBarId` |
| **One-click?** | Yes — publish button after review |
| **Auth** | `checkAdmin()` |

---

### 6. Book analysis

| Field | Value |
|-------|-------|
| **Location** | `src/actions/book-analyze.ts`, `src/app/admin/books/` |
| **Input** | `bookId: string`, `options?: { filters?: AnalysisFilters }` |
| **Output** | `{ success: true, questsCreated, chunkCount, ... }` or `{ error }` |
| **Grammar** | AI-extracted (schema: title, description, moveType, allyshipDomain, nation, archetype, kotterStage, lockType). No Epiphany Bridge |
| **Edit surface** | CustomBar — admin edits via quest detail / pack |
| **Campaign linkage** | None — quests go to library (`completionEffects: { source: 'library', bookId }`) |
| **One-click?** | Yes — one trigger per book (Analyze button) |
| **Auth** | `requireAdmin()` |
| **Env** | `BOOK_ANALYSIS_AI_ENABLED`, `BOOK_ANALYSIS_MODEL` |

---

### 7. Gameboard — createSubQuest (handleCreateQuestForAid)

| Field | Value |
|-------|-------|
| **Location** | `src/app/campaign/board/GameboardClient.tsx`, `src/actions/quest-nesting.ts` |
| **Input** | `slotId`, `{ title, description }` (from aid form) |
| **Output** | `{ questId }` or `{ error }` |
| **Grammar** | None — raw title + description. Player pays 1 Vibeulon |
| **Edit surface** | CustomBar title, description |
| **Campaign linkage** | Auto — `parentId = slot.quest.id` |
| **One-click?** | Yes — but requires manual title/description input |
| **Auth** | Player (not admin-only) — any player can create subquest for 1v |
| **Note** | This is the "Create quest (1v)" flow — NOT the grammatical flow |

---

### 8. Gameboard — Generate grammatical quest (admin)

| Field | Value |
|-------|-------|
| **Location** | `src/app/campaign/board/GameboardClient.tsx`, `src/actions/gameboard.ts` |
| **Input** | Slot context: `parentQuestId`, `slotId`, `campaignRef`. Preview: `previewGameboardAlignedQuest`. Publish: `publishGameboardQuestFromPreview(packet, parentQuestId, slotId, campaignRef)` |
| **Output** | Preview: `{ packet, unpacking }`. Publish: `{ success: true, questId }` |
| **Grammar** | Epiphany Bridge — `compileQuestWithAI` with `gameboardContext` (parent quest, Kotter stage, instance, campaignRef). `generateRandomUnpacking` for nation/archetype |
| **Edit surface** | QuestOutlineReview (preview) → accept → publish. Editable via Quest Grammar after publish |
| **Campaign linkage** | Auto — `publishGameboardAlignedQuestToPlayer` attaches to slot, sets `campaignRef`, `parentId` |
| **One-click?** | Yes (with review) — Generate → Preview → Accept → Add to gameboard. ~30–90s |
| **Auth** | Admin only (`isAdmin` check) |
| **Env** | `QUEST_GRAMMAR_AI_ENABLED` |
| **Note** | Closest to "one-click from context" — uses slot + campaign + parent quest |

---

## Shared Logic

| Component | Used by |
|-----------|---------|
| `compileQuestWithAI` | Quest Grammar, generateQuestFromReading, Gameboard grammatical |
| `generateRandomUnpacking` | generateQuestFromReading, Gameboard grammatical |
| `publishQuestPacketToPassages` | Quest Grammar (UnpackingForm) |
| `publishIChingQuestToPlayer` | generateQuestFromReading |
| `publishGameboardAlignedQuestToPlayer` | generateGameboardAlignedQuest, publishGameboardQuestFromPreview |
| `appendQuestToAdventure` | Quest Grammar (GenerationFlow) |

---

## Blockers (from strand)

1. **Context input** — No unified "generate from context" API. Gameboard grammatical has slot + campaign; others have hexagram, BAR, or manual unpacking.
2. **Grammar choice** — Epiphany Bridge vs Kotter. Quest Grammar supports both; generateQuestFromReading and Gameboard use Epiphany Bridge only.
3. **Editable output** — CustomBar (title, description) vs Twine passages vs both. Mixed.
4. **Campaign linkage** — Gameboard grammatical auto-attaches; others manual or none.
5. **OPENAI_API_KEY** — Required for `compileQuestWithAI`. `QUEST_GRAMMAR_AI_ENABLED=false` disables AI paths.
