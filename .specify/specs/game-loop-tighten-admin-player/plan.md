# Plan: Game Loop Tighten — Admin vs Player

## Overview

Refine the game loop by (1) unifying admin quest generation behind `generateQuestFromContext`, (2) defining the player-completion unlock hook, and (3) separating admin tools from player flows. Phase 1: audit existing paths, implement unified API, document unlock contract. Phase 2: implement unlock hook, move admin controls to admin panel.

## Phases

### Phase 1: Audit + Unified API

**Goal**: Document all admin quest-creation paths and implement a single one-click entry point.

1. **Audit** — Map every admin quest-creation path. Create `ADMIN_QUEST_PATHS.md` in spec folder. Document: input, output, grammar, edit surface, campaign linkage. Paths: upsertQuest, Quest Grammar, generateQuestFromReading, generateQuestProposalFromBar, book analysis, gameboard handleCreateQuestForAid, Quest Proposals.

2. **Unified API** — Add `generateQuestFromContext` in `src/actions/quest-generation.ts` (or extend `quest-grammar.ts`). Reuse `compileQuestWithAI`; accept `GenerateQuestFromContextInput`; when `slotId`/`slotQuestId` provided, call `publishGameboardAlignedQuestToPlayer` or equivalent. Otherwise return draft.

3. **Wire UI** — One-click button on gameboard slot (or admin panel) calls `generateQuestFromContext`. Reuse or replace `handleCreateQuestForAid` / `generateGameboardAlignedQuest` flow.

4. **Unlock contract** — Document `onPlayerQuestCompletion(questId, playerId, campaignRef)` in spec. Define when it fires (completeQuestForPlayer, passage completion) and downstream effects (funding, stage, slot). No implementation yet.

**File impacts**:
- `.specify/specs/game-loop-tighten-admin-player/ADMIN_QUEST_PATHS.md` (new) — audit artifact
- `src/actions/quest-generation.ts` (new) or `src/actions/quest-grammar.ts` — `generateQuestFromContext`
- `src/app/campaign/board/GameboardClient.tsx` — wire one-click to new API (or keep existing, call new API)
- `src/app/admin/` — optional admin panel page for "Generate from context"

### Phase 2: Unlock Hook + Separation

**Goal**: Implement player-completion unlock and reduce admin/player UX conflation.

1. **Unlock hook** — Implement `onPlayerQuestCompletion` in `src/actions/quest-completion.ts` or similar. Call from `completeQuestForPlayer` when quest has `campaignRef`. Downstream: emit event, update instance funding, advance Kotter stage, or open new slot (per product decision).

2. **Separation** — Move "Generate grammatical quest" from gameboard to admin panel, or ensure it is clearly gated (admin-only badge, separate route). Player flows (dashboard, gameboard, Hand) do not show admin generation controls to non-admins.

3. **Verification quest** — Create `cert-game-loop-tighten-v1`: admin one-click generation, player completion, unlock hook (or stub).

**File impacts**:
- `src/actions/quest-completion.ts` or `src/actions/gameboard.ts` — `onPlayerQuestCompletion` hook
- `src/app/campaign/board/GameboardClient.tsx` — move or gate admin generation UI
- `src/app/admin/` — admin panel for quest generation from context
- `scripts/seed-cyoa-certification-quests.ts` — add cert-game-loop-tighten-v1

## Dependencies

- Quest Grammar (`compileQuestWithAI`, `publishGameboardAlignedQuestToPlayer`)
- Gameboard (`generateGameboardAlignedQuest`, slot structure)
- [game-loop-bars-quest-thread-campaign](.specify/specs/game-loop-bars-quest-thread-campaign/) — placement API

## Verification

- Admin: one click → quest generated and attached to slot
- Admin: generate from campaign + domain → draft for manual placement
- Player: complete campaign quest → unlock hook fires (Phase 2)
- Player: dashboard/gameboard clean of admin controls when not admin
- Verification quest: cert-game-loop-tighten-v1
