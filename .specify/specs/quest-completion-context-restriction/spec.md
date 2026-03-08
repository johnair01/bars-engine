# Spec: Quest Completion Context Restriction — Campaign vs Personal vs CYOA

## Purpose

Restrict quest completion so that campaign quests can only be completed on the gameboard, personal and public quests remain completable from dashboard and quest wallet, and CYOA map nodes never trigger quest completion. Currently, ending a Twine passage triggers quest completion globally; completion must be limited by quest type and completion context.

## Context / Goal

The game map (CYOA exploring the campaign) has nodes where BARs are created, BARs are played on quests, or players are routed to the gameboard. These nodes are **not** completion points. Campaign quests advance the campaign and must be completed on the gameboard. Personal and public quests can be completed from the dashboard and quest wallet. The system must enforce these distinctions.

## Conceptual Model (Game Language)

- **WHO**: Player (completer), Campaign (quest source)
- **WHAT**: Quest completion — marking a quest done and granting rewards
- **WHERE**: Completion context — dashboard, quest wallet, Twine end passage, Adventure completion passage, gameboard
- **Energy**: Vibeulons — granted on completion (when allowed)
- **Personal throughput**: Campaign quests → gameboard only; personal/public → dashboard, wallet, Twine; CYOA nodes → no completion

## User Stories

### P1: Campaign quests only on gameboard

**As a player**, I want campaign quests to complete only when I'm on the gameboard, so that campaign progress is tied to the shared game space.

**Acceptance**: When I reach an END passage in Twine or a completion passage in an Adventure for a campaign quest, the quest does **not** auto-complete. I see guidance to complete on the gameboard.

### P2: Personal and public quests from dashboard and wallet

**As a player**, I want to complete personal and public quests from the dashboard and quest wallet, so that I can finish self-allyship and communal work without going to the gameboard.

**Acceptance**: QuestDetailModal and StarterQuestBoard continue to allow completion for non-campaign quests. Twine end passages and Adventure completion passages also allow completion for non-campaign quests.

### P3: CYOA map nodes do not complete quests

**As a player**, I want map nodes to be places for BAR creation, BAR play, and routing—not quest completion—so that the map is exploration, not a completion shortcut.

**Acceptance**: CampaignReader and BruisedBananaTwinePlayer do not trigger quest completion when reaching end nodes. (CampaignReader already has no questId; BruisedBananaTwinePlayer is client-side only.)

## Functional Requirements

### FR1: Campaign quest detection

- A quest is a **campaign quest** if it belongs to a `ThreadQuest` whose `QuestThread` has `adventureId` set and that `Adventure` has `campaignRef` set.
- Provide `isCampaignQuest(questId): Promise<boolean>` (or equivalent) using existing schema.

### FR2: Completion source in context

- Extend `QuestCompletionContext` with `source?: 'dashboard' | 'quest_wallet' | 'twine_end' | 'adventure_passage' | 'gameboard'`.
- All callers of `completeQuest` / `completeQuestForPlayer` must pass `source` when known.

### FR3: Restrict autoCompleteQuestFromTwine

- In `advanceRun`, when `questId && isEndPassage`, call `isCampaignQuest(questId)` first.
- If true, do **not** call `autoCompleteQuestFromTwine`. Return `questCompleted: false`.

### FR4: Restrict completeQuestForPlayer for campaign quests

- If quest is a campaign quest and `context?.source !== 'gameboard'`, return `{ error: 'Campaign quests can only be completed on the gameboard.' }`.
- Personal and public quests: allow all sources.

### FR5: Caller source mapping

| Caller | Source |
|--------|--------|
| QuestDetailModal | `dashboard` |
| StarterQuestBoard / completeStarterQuest | `quest_wallet` |
| PassageRenderer.handleEnd (inputs) | `twine_end` |
| AdventurePlayer (completion passage) | `adventure_passage` |
| Future gameboard UI | `gameboard` |

### FR6: AdventurePlayer campaign-quest handling

- When `completeQuest` is rejected for a campaign quest, show message: "This campaign quest must be completed on the gameboard" and a link/button to `/campaign` (or future gameboard route).

### FR7: Gameboard completion (deferred → CV)

- This iteration: implement the restriction. Campaign quests are blocked from non-gameboard sources.
- Follow-up: [Gameboard and Campaign Deck](gameboard-campaign-deck/spec.md) (CV) — gameboard UI, campaign deck draws, completion with source: gameboard.

## Non-functional Requirements

- No schema changes. Use existing relations: CustomBar → ThreadQuest → QuestThread → Adventure (adventureId) → campaignRef.
- Quest not in any thread: treated as personal/public (completable from dashboard/wallet/Twine).
- Thread has adventureId but adventure has no campaignRef: treated as non-campaign.

## Non-goals (this iteration)

- Full gameboard completion UI → see [gameboard-campaign-deck](gameboard-campaign-deck/spec.md)
- Schema changes for quest scope
- Changes to CampaignReader or BruisedBananaTwinePlayer (already correct)

## Reference

- Plan: [.specify/specs/quest-completion-context-restriction/plan.md](plan.md)
- Tasks: [.specify/specs/quest-completion-context-restriction/tasks.md](tasks.md)
- Key files: [src/actions/twine.ts](../../src/actions/twine.ts), [src/actions/quest-engine.ts](../../src/actions/quest-engine.ts), [src/app/adventure/[id]/play/AdventurePlayer.tsx](../../src/app/adventure/[id]/play/AdventurePlayer.tsx)
