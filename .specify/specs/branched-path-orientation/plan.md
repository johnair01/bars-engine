# Plan: Branched Path Orientation

## Summary

Choice limit expanded from 2–3 to 2–4. Full `generateBranchedPath` API deferred; heuristic choice selection already supports limit 4 via move-assignment and compileQuestCore.

## Phase 1: Choice Count Expansion (Done)

- Update nation-playbook-choice-privileging FR4
- Update move-assignment.ts limit default to 4
- Update compileQuestCore, choice-privileging-context, quest-grammar prompts, wiki, UI

## Phase 2: generateBranchedPath (Deferred)

- Define BranchedQuestPacket type
- Implement heuristic branch selection with altitude/domain context
- Add token budget param; integrate with ai-deftness-token-strategy
