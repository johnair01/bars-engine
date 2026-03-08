# Tasks: Auto Flow Chained Initiation

## Phase 1: Character Creation Packet

- [x] Create `src/lib/quest-grammar/characterCreationPacket.ts`
- [x] Implement `compileCharacterCreationPacket` with lens/nation/playbook/domain branching
- [x] Lens: 3 choices (cognitive, emotional, action) → SetLens_* → converge
- [x] Nation: accept nationIds/playbookIds as input (pure); create `getCharacterCreationPacket` server action that fetches from DB and calls compiler
- [x] Playbook: same pattern
- [x] Domain: use ALLYSHIP_DOMAINS keys

## Phase 2: Moves/GM Packet

- [x] Create `src/lib/quest-grammar/movesGMPacket.ts`
- [x] Implement `compileMovesGMPacket` with 4 moves + GM selection
- [x] Moves_Intro, Moves_WakeUp, Moves_CleanUp, Moves_GrowUp, Moves_ShowUp (heuristic text)
- [x] ChooseGM hub: 6 face choices → SetGM_* → Commit → Signup

## Phase 3: Intro Packet

- [x] Add `spineLength: 'short'` to compileQuest input, or create `compileIntroPacket`
- [x] When short: 4 beats only; last node terminal for append

## Phase 4: Publish Chained

- [x] Implement `publishChainedInitiationAdventure` in quest-grammar.ts
- [x] Create adventure with intro packet
- [x] appendQuestToAdventure(charPacket)
- [x] appendQuestToAdventure(movesGMPacket)
- [x] Set linkedQuestId on last passage when sourceQuestId provided

## Phase 5: State Persistence

- [x] In adventures API route: when serving nodeId matching `char_set_nation_*`, `char_set_playbook_*`, `char_set_domain_*`, `char_set_lens_*`, parse value and update Player.storyProgress
- [x] Merge into state: developmentalHint, nationId, playbookId, campaignDomainPreference

## Phase 6: Admin Trigger

- [x] Add `scripts/seed-chained-initiation.ts` — run `npm run seed:chained-initiation` to publish
- [x] Add `skipAdminCheck` to publishChainedInitiationAdventure and appendQuestToAdventure for script context

## Verification

- [x] `npm run build` passes
- [x] `npm run check` passes
- [ ] Manual: Admin publishes chained initiation; player plays through intro → character creation (branching) → moves/GM → signup; state persists
