# Tasks: Branched Path Orientation

## Phase 1: Choice Count (2–4)

- [x] Update nation-playbook-choice-privileging spec FR4
- [x] Update move-assignment.ts selectPrivilegedChoices limit to 4
- [x] Update compileQuestCore, choice-privileging-context
- [x] Update quest-grammar prompts, questGrammarSpec, wiki, UI

## Phase 2: generateBranchedPath API

- [x] Define BranchedQuestPacket type (`src/lib/quest-grammar/branchedPath.ts`)
- [x] Implement generateBranchedPath (wraps `compileQuest` / `compileQuestWithPrivileging`; heuristic-first)
- [x] Add token budget and max depth options (`branchedPathMeta`)
