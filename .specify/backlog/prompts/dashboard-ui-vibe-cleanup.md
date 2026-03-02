# Spec Kit Prompt: Dashboard UI Vibe Cleanup

## Role

Implement the Dashboard UI Vibe Cleanup per [.specify/specs/dashboard-ui-vibe-cleanup/spec.md](../specs/dashboard-ui-vibe-cleanup/spec.md).

## Objective

Simplify dashboard and related UI: remove unused features (MovementFeed, Attunement, Special/Elemental Moves, 4-move buttons), fix copy (Sponsor→Donate), hide/deprecate threads (Welcome Conclave, Build Character, Rookie Essentials), improve active quest UX (default closed, remove vision/approach/kotter), add guiding quests (Library, BARs, EFA, Four Moves).

## Requirements

- **Surfaces**: Dashboard (page.tsx), StarterQuestBoard, QuestDetailModal, conclave/onboarding, event page
- **Mechanics**: Remove/hide components; filter threads; default closed; new orientation quests
- **Verification**: Manual: dashboard loads without removed sections; active quests closed by default; Donate not Sponsor

## Deliverables

- [ ] .specify/specs/dashboard-ui-vibe-cleanup/spec.md
- [ ] .specify/specs/dashboard-ui-vibe-cleanup/plan.md
- [ ] .specify/specs/dashboard-ui-vibe-cleanup/tasks.md
- [ ] Implementation in phases

## Reference

- Spec: [.specify/specs/dashboard-ui-vibe-cleanup/spec.md](../specs/dashboard-ui-vibe-cleanup/spec.md)
- Plan: [.specify/specs/dashboard-ui-vibe-cleanup/plan.md](../specs/dashboard-ui-vibe-cleanup/plan.md)
