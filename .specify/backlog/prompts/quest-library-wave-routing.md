# Spec Kit Prompt: Quest Library Wave Routing and Training

## Role

You are a Spec Kit agent implementing the Quest Library Wave Routing feature: route book-derived quests by move type to EFA pool, Dojo pool, Discovery pool, and Gameboard. Train the quest grabber and validator so generated quests align with model quality.

## Objective

Route book quests to the right surfaces based on move type. Clean Up → EFA quest pool (learn moves); Grow Up → Dojo pool; Show Up → gameboard/domains; Wake Up → discovery/audit pool. Automate admin review so most work is ensuring quests are available. Eventually: model quest alignment, auto-suggest edits, extend to adventure.

## Prompt (API-First)

> Implement Quest Library Wave Routing per [.specify/specs/quest-library-wave-routing/spec.md](../specs/quest-library-wave-routing/spec.md). **API-first**: define getQuestsByPool(pool), assignQuestToPool(questId, pool) before UI. Add questPool to CustomBar; set on approve from moveType. Surface EFA pool in EFA UI. Admin discovery queue for Wake Up quests.

## Requirements

- **Schema**: questPool on CustomBar (efa, dojo, discovery, gameboard)
- **Routing**: On approve, set questPool from moveType
- **API**: getQuestsByPool(pool), assignQuestToPool(questId, pool)
- **Surfaces**: EFA quest pool section, admin discovery queue
- **Verification**: cert-quest-library-wave-routing-v1

## Checklist (API-First Order)

- [ ] Schema: questPool on CustomBar
- [ ] API: getQuestsByPool, assignQuestToPool
- [ ] book-quest-review: set questPool on approve
- [ ] EFA UI: surface EFA pool quests
- [ ] Admin: discovery queue
- [ ] Verification quest
- [ ] npm run build and npm run check

## Deliverables

- [ ] .specify/specs/quest-library-wave-routing/spec.md
- [ ] .specify/specs/quest-library-wave-routing/plan.md
- [ ] .specify/specs/quest-library-wave-routing/tasks.md
- [ ] Implementation per tasks
