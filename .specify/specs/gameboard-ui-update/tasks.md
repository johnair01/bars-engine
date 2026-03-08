# Tasks: Gameboard UI Update

## Phase 1: Completion validation + Admin edit

- [x] Add confirm() before completeGameboardQuest in handleComplete
- [x] Use getCurrentPlayerSafe in gameboard page; pass isAdmin to GameboardClient
- [x] Add isAdmin prop to GameboardClient; render Edit link when admin and slot has quest

## Phase 2: Add quest modal

- [x] Replace two Add buttons with one "Add quest (1v)" button
- [x] Create AddQuestModal with Attach existing / Create new sections
- [x] Attach existing: list campaign quests, call attachQuestToSlot on select
- [x] Create new: Quick subquest form (title, description) → createSubQuest
- [x] Create new: Full wizard link to /quest/create with query params
- [x] Create new (admin): Generate grammatical button → generateGameboardAlignedQuest

## Phase 3: Quest wizard context + grammatical generation

- [x] /quest/create: read searchParams (from, questId, slotId, campaignRef)
- [x] Pass gameboardContext to QuestWizard
- [x] QuestWizard: show banner when gameboardContext; pre-fill campaignRef/campaignGoal; redirect to gameboard after create
- [x] Add generateGameboardAlignedQuest to gameboard actions (admin-only)
- [x] Extend buildQuestPromptContext with optional gameboardContext
- [x] generateGameboardAlignedQuest: fetch player, parent quest, instance; random unpacking; compileQuestWithAI; create quest; assign; return questId

## Phase 4: Verification

- [x] npm run build and check
- [x] Manual: Complete confirm; Admin Edit; Add quest modal; Wizard context; Admin generate
