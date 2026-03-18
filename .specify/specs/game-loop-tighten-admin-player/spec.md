# Spec: Game Loop Tighten — Admin vs Player

## Purpose

Refine the core game loop by separating admin and player needs: admins generate player content with one click; players complete campaign quests; completion unlocks capacity for more content. Today admin tools and player flows are conflated, and there is no unified "generate from context" API or clear unlock signal when players complete quests.

**Problem**: Two user types (player, admin) with conflated needs. Far more admin tools than player experiences. Goal: Admin generates player content → players unlock opportunities → admin creates more. Content that matters: completing campaign quests. Admin need: one-button press to create easily editable, grammatical quests from context. Blockers (context input, grammar choice, editable output, campaign linkage, OPENAI_API_KEY) should be explored proactively.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Unified generation API** | Introduce `generateQuestFromContext(context)` — single entry point for admin one-click quest generation. Accepts campaignRef, kotterStage, slotId, domain, template. Reuses existing `compileQuestWithAI` / Epiphany Bridge grammar internally. |
| **Editable output** | Generated quests land as CustomBar (title, description, inputs) + optional Twine passages. Admin edits via existing Quest Grammar / pack pages. No new edit surface. |
| **Campaign linkage** | Generated quest auto-attaches to slot when `slotId` provided; otherwise returns draft for manual placement. Matches `generateGameboardAlignedQuest` behavior. |
| **Unlock hook** | Define explicit "player completed → admin capacity" signal: when a player completes a campaign quest, emit event/hook that can drive instance funding, Kotter stage advance, or new slot availability. Phase 2: implement hook; Phase 1: spec the contract. |
| **Admin vs player separation** | Admin quest-creation actions live in `/admin/*` or behind `checkAdmin()`. Player flows (dashboard, gameboard, Hand) do not embed admin-only generation buttons. Gate by role; consider moving "Generate grammatical quest" from gameboard to admin panel. |

## Conceptual Model (Game Language)

| Dimension | Meaning | Schema |
|-----------|---------|--------|
| **WHO** | Admin (creator), Player (completer), Campaign (instance) | Player, Instance |
| **WHAT** | Quest (CustomBar), Campaign slot, Thread | CustomBar, QuestThread |
| **WHERE** | Allyship domain | allyshipDomain |
| **Energy** | Vibeulons | Vibulon |
| **Personal throughput** | 4 moves (Wake Up, Clean Up, Grow Up, Show Up) | moveType |

**Admin flow**: Context (campaign, slot, domain) → `generateQuestFromContext` → grammatical quest → auto-attach to slot or draft.

**Player flow**: Discovery (gameboard, Market, threads) → complete quest → attestation → unlock signal → admin capacity.

**Unlock loop**: Admin creates → player completes → unlock (funding/stage/slot) → admin creates more.

## API Contracts (API-First)

### generateQuestFromContext

**Input**:
```ts
type GenerateQuestFromContextInput = {
  campaignRef: string
  kotterStage?: number
  slotId?: string
  slotQuestId?: string
  allyshipDomain?: string
  template?: 'epiphany_bridge' | 'kotter'
  moveType?: string
}
```

**Output**: `{ success: true; questId: string } | { error: string }`

- Admin-only. Uses `compileQuestWithAI` with context. When `slotId`/`slotQuestId` provided, auto-attaches quest to slot. Otherwise returns draft for manual placement.
- Server Action (`'use server'`).

### onPlayerQuestCompletion (unlock hook — Phase 2)

**Input**: `questId: string`, `playerId: string`, `campaignRef: string`  
**Output**: `{ success: true } | { error: string }`

- Called when player completes a campaign quest. Emits event/hook for: instance funding, Kotter stage advance, new slot availability. Phase 1: document contract; Phase 2: implement.

**When called** (Phase 2 implementation sites):
- `completeQuestForPlayer` in `src/actions/quest-engine.ts` — after successful completion, when quest has `campaignRef`
- All completion paths flow through `completeQuest` → `completeQuestForPlayer`: Quest wallet, AdventurePlayer (passage), PassageRenderer (twine), QuestDetailModal, TwineStoryReader, gameboard `markSlotComplete`, starter-quests
- Call hook only when `quest.campaignRef` is non-null and completion succeeds (before returning success)

**Downstream effects** (product decision; Phase 2):
- **Instance funding**: Increment instance vibeulon pool or ledger when campaign quest completed
- **Kotter stage advance**: Optionally advance `instance.kotterStage` when N completions reached (configurable threshold)
- **New slot availability**: Unlock a new gameboard slot or draw from deck when slot freed
- **Event/log**: Emit `PLAYER_CAMPAIGN_QUEST_COMPLETED` for analytics; log for admin visibility

## User Stories

### P1: Admin one-click quest from gameboard slot

**As an admin**, I want to generate a grammatical quest from a gameboard slot with one click, so I can quickly populate campaign content without multi-step unpacking.

**Acceptance**: From gameboard slot (or admin panel): one button → `generateQuestFromContext({ campaignRef, slotId, ... })` → quest created and attached to slot. Editable via existing Quest Grammar.

### P2: Admin one-click quest from campaign + domain

**As an admin**, I want to generate a quest from campaign + domain context (no slot), so I can create drafts for manual placement.

**Acceptance**: `generateQuestFromContext({ campaignRef, allyshipDomain })` → draft quest returned. Admin places via thread or gameboard.

### P3: Player completion unlocks admin capacity

**As an admin**, I want to know when a player completes a campaign quest, so I can advance Kotter stage, fund instance, or open new slots.

**Acceptance**: Unlock hook contract defined. When player completes campaign quest, hook fires. Phase 2: implement funding/stage/slot logic.

### P4: Admin tools separated from player flows

**As a player**, I want the dashboard and gameboard to show only player-relevant actions, so I am not confused by admin controls.

**Acceptance**: Admin-only generation buttons moved to `/admin/*` or hidden when not admin. Player flows stay clean.

## Functional Requirements

### Phase 1: Audit + Unified API

- **FR1**: Document every admin quest-creation path: input, output, grammar, edit surface, campaign linkage. Artifact: `ADMIN_QUEST_PATHS.md` in spec folder.
- **FR2**: Implement `generateQuestFromContext` Server Action. Reuse `compileQuestWithAI`; accept context input; auto-attach to slot when provided.
- **FR3**: Wire one-click button (gameboard slot or admin panel) to `generateQuestFromContext`.
- **FR4**: Define `onPlayerQuestCompletion` contract (signature, when called, downstream effects). Document in spec.

### Phase 2: Unlock Hook + Separation

- **FR5**: Implement `onPlayerQuestCompletion` hook. Call from `completeQuestForPlayer` or passage completion when quest has `campaignRef`.
- **FR6**: Move admin-only "Generate grammatical quest" from gameboard to admin panel, or gate by role with clear separation.
- **FR7**: Ensure OPENAI_API_KEY and rate-limit handling documented. Fallback to stub when disabled.

## Non-Functional Requirements

- Admin actions require `checkAdmin()` or equivalent.
- AI calls: cache, env model override, feature flags per [deftness-development/reference.md](.agents/skills/deftness-development/reference.md).
- Backward compatibility: existing paths (Quest Grammar, generateQuestFromReading, BAR proposals) remain functional.

## Scaling Checklist (AI)

| Touchpoint | Mitigation |
|------------|------------|
| AI calls | Cache via `generateObjectWithCache`; `QUEST_GRAMMAR_AI_ENABLED` flag |
| OPENAI_API_KEY | Document in `docs/ENV_AND_VERCEL.md`; graceful fallback when missing |
| Request body | Standard server action limits |

## Verification Quest

- **ID**: `cert-game-loop-tighten-v1`
- **Steps**: (1) Admin generates quest from gameboard slot via one click; (2) Quest appears under slot; (3) Admin edits via Quest Grammar; (4) Player completes quest; (5) Verify unlock hook fires (or stub).
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [game-loop-bars-quest-thread-campaign](.specify/specs/game-loop-bars-quest-thread-campaign/) — placement API, Hand extension
- Quest Grammar (`compileQuestWithAI`), gameboard (`generateGameboardAlignedQuest`)

## References

- `src/actions/quest-grammar.ts` — compileQuestWithAI, generateQuestOverviewWithAI
- `src/actions/generate-quest.ts` — generateQuestFromReading, generateGrammaticQuestFromReading
- `src/actions/gameboard.ts` — generateGameboardAlignedQuest, handleCreateQuestForAid
- `src/app/admin/quest-grammar/` — unpacking, compile, publish
- `src/app/campaign/board/GameboardClient.tsx` — handleCreateQuestForAid
- `src/lib/bar-quest-generation/` — BAR → proposal
- [STRAND_OUTPUT.md](STRAND_OUTPUT.md) — strand diagnostic
