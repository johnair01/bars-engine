# Prompt: Gameboard UI Update — Completion Validation, Admin Edit, Add Quest Modal

**Use this prompt when implementing gameboard UX improvements: completion validation, admin edit, merged add-quest modal, and gameboard-context quest creation.**

## Context

The gameboard shows campaign quests. We need: (1) confirmation before completing to prevent accidents, (2) admin Edit link on quest cards, (3) single "Add quest" button that opens a modal with Attach existing / Create new (Quick subquest, Full wizard, Admin generate grammatical), (4) quest wizard to accept gameboard context and redirect appropriately, (5) admin-only server action to generate grammatical quests aligned with nation, playbook, and gameboard state.

## Prompt text

> Implement the Gameboard UI Update spec per [.specify/specs/gameboard-ui-update/spec.md](../specs/gameboard-ui-update/spec.md). Add completion confirmation; pass isAdmin and show Edit link; merge Add buttons into modal with Attach/Create options; extend quest wizard with gameboardContext; add generateGameboardAlignedQuest (admin-only) using generateRandomUnpacking + compileQuestWithAI with gameboard theme.

## Checklist

- [ ] Phase 1: Completion validation + Admin edit
- [ ] Phase 2: Add quest modal
- [ ] Phase 3: Quest wizard context + grammatical generation
- [ ] Phase 4: Build, check, manual tests

## Reference

- Spec: [.specify/specs/gameboard-ui-update/spec.md](../specs/gameboard-ui-update/spec.md)
- Plan: [.specify/specs/gameboard-ui-update/plan.md](../specs/gameboard-ui-update/plan.md)
- Tasks: [.specify/specs/gameboard-ui-update/tasks.md](../specs/gameboard-ui-update/tasks.md)
- Related: [gameboard-quest-generation](gameboard-quest-generation.md), [gameboard-campaign-deck](gameboard-campaign-deck.md)
