# Plan: Auto Flow Chained Initiation

## Overview

Chain three quest packets (intro, character creation, moves/GM) into a single initiation adventure. Character creation has branching at lens, nation, playbook, domain. Reuse `appendQuestToAdventure` for chaining.

## Phase 1: Character Creation Packet

### New file: `src/lib/quest-grammar/characterCreationPacket.ts`

- `compileCharacterCreationPacket(opts?)` returns `SerializableQuestPacket`
- Structure:
  - `char_lens` (hub): 3 choices → `char_set_cognitive`, `char_set_emotional`, `char_set_action`
  - Each Set: single choice "Continue" → `char_nation`
  - `char_nation` (hub): choices from nations (need to pass or fetch). For v1, use fixed list or `db.nation.findMany` in a server-side wrapper.
  - `char_set_nation_{id}`: "Continue" → `char_playbook`
  - `char_playbook` (hub): choices from playbooks
  - `char_set_playbook_{id}`: "Continue" → `char_domain`
  - `char_domain` (hub): 4 choices (ALLYSHIP_DOMAINS)
  - `char_set_domain_{key}`: "Continue" → terminal (no internal targets; append will add "Continue to next quest")

- **DB access**: `compileCharacterCreationPacket` cannot call Prisma (pure module). Create `getCharacterCreationPacket(segment)` server action that fetches nations/playbooks, builds choices, calls pure compiler with choice data.

### Node ID scheme

- `char_lens`, `char_set_cognitive`, `char_set_emotional`, `char_set_action`
- `char_nation`, `char_set_nation_{nationId}` (use cuid-safe substring)
- `char_playbook`, `char_set_playbook_{playbookId}`
- `char_domain`, `char_set_domain_{domainKey}`

## Phase 2: Moves/GM Packet

### New file: `src/lib/quest-grammar/movesGMPacket.ts`

- `compileMovesGMPacket(opts?)` returns `SerializableQuestPacket`
- Structure:
  - `moves_intro`: "The Four Moves" — heuristic text
  - `moves_wakeup`, `moves_cleanup`, `moves_growup`, `moves_showup`: one per move
  - `gm_choose`: "Choose your Game Master face" — 6 choices → `gm_set_shaman`, etc.
  - `gm_set_{face}`: FACE_SENTENCES[face]; "Continue" → `moves_commit`
  - `moves_commit`: transcendence beat (heuristic)
  - `moves_signup`: consequence; single choice "Create my account" → targetId `signup`

- Text from existing content (Moves from BB seed, GM from FACE_SENTENCES)

## Phase 3: Intro Packet

### Option A: New `compileIntroPacket`

- In `src/lib/quest-grammar/compileQuestCore.ts` or new file
- Same as Epiphany but only first 4 beats: orientation, rising_engagement, tension, integration
- Last node (`node_3`) has choices: depth branches (existing) or single "Continue" — but for chaining, we need it to be terminal. So: last node has empty choices or single placeholder; `appendQuestToAdventure` will add "Continue to next quest" to the terminal passage.

### Option B: Add `spineLength` to compileQuest

- `compileQuest(input)` accepts `spineLength?: 'short' | 'full'`
- When `spineLength === 'short'`, only generate first 4 beats, last node is terminal

## Phase 4: Publish Chained Adventure

### New action: `publishChainedInitiationAdventure`

In `src/actions/quest-grammar.ts`:

1. Admin check
2. Create Adventure (slug, title, startNodeId = intro packet's startNodeId)
3. Create Passages for intro packet (same as publishQuestPacketToPassages but without QuestThread/quest creation — or create a minimal quest for the thread)
4. Call `appendQuestToAdventure(charPacket, adventureId)`
5. Call `appendQuestToAdventure(movesGMPacket, adventureId)`
6. If sourceQuestId: find last passage (consequence/signup), set linkedQuestId
7. Set status ACTIVE
8. Create QuestThread + ThreadQuest if sourceQuestId provided
9. Return `{ success: true, adventureId, passageCount }`

### First packet publish

- Need a variant of `publishQuestPacketToPassages` that creates Adventure + Passages only, without creating a source quest. Or: create a "container" quest for the initiation, use it as sourceQuestId for the last passage.

## Phase 5: State Persistence (Character Creation)

- Each Set passage (`char_set_nation_X`, etc.) should update player state when reached.
- **Option A**: Passage has `linkedQuestId` → CustomBar. CustomBar has `completionEffects` JSON. When player reaches passage (completion passage with no choices), completeQuest runs, processCompletionEffects applies.
- **Option B**: Passage has choices; when player clicks "Continue", we need to capture the choice. The choice targetId encodes the selection (e.g. `char_set_nation_abc123`). The adventure API could, when serving that node, persist the choice to storyProgress. But that's on view, not on continue.
- **Option C**: Create a CustomBar per Set passage. Passage.linkedQuestId = bar.id. Passage has no choices (isCompletionPassage). When player navigates TO the Set passage... but they navigate by clicking a choice from the hub. So the flow is: hub → Set passage. The Set passage shows "You chose X. Continue." with one choice to next hub. When they click Continue, we go to next hub. The "set" happens when we enter the Set passage. So we need: when the API serves `char_set_nation_X`, we parse the nationId from nodeId and update storyProgress. Similar to face accumulation in depth nodes.

- **Recommendation**: Use the same pattern as face accumulation. When serving a passage with nodeId matching `char_set_nation_*`, `char_set_playbook_*`, `char_set_domain_*`, `char_set_lens_*`, parse the value and update Player.storyProgress.state.

## File Impacts

| File | Change |
|------|--------|
| `src/lib/quest-grammar/characterCreationPacket.ts` | New: pure compiler for character creation branching |
| `src/lib/quest-grammar/movesGMPacket.ts` | New: pure compiler for moves + GM |
| `src/lib/quest-grammar/compileQuestCore.ts` | Add spineLength: 'short' option (optional) |
| `src/actions/quest-grammar.ts` | Add getCharacterCreationPacket (server), publishChainedInitiationAdventure |
| `src/app/api/adventures/[slug]/[nodeId]/route.ts` | Add state persistence for char_set_* nodeIds |
| Admin UI | Add "Generate full initiation" flow (optional for v1) |
