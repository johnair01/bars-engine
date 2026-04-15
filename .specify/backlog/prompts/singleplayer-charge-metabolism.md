# Spec Kit Prompt: Singleplayer Charge Metabolism

## Role

You are a Spec Kit agent implementing the singleplayer charge-metabolism loop. Charge from 321 can become a BAR, a quest, or fuel the system. Subquests capture friction; one key subquest completion cascades to unblock the whole cluster. The system learns which charge types are most metabolizable.

## Objective

Implement per [.specify/specs/singleplayer-charge-metabolism/spec.md](../specs/singleplayer-charge-metabolism/spec.md). **API-first**: define createQuestFrom321Metadata, fuelSystemFrom321, persist321Session, and extended createSubQuest before UI. Spec: [spec.md](../specs/singleplayer-charge-metabolism/spec.md).

## Requirements

- **Charge routing**: Post-321 prompt adds "Turn into Quest" and "Fuel System" alongside Create BAR / Skip
- **createQuestFrom321Metadata**: Uses extractCreationIntent + generateCreationQuest; assigns quest to player
- **fuelSystemFrom321**: Persists Shadow321Session with outcome fueled_system
- **persist321Session**: Shadow321Session for all 321 outcomes (bar_created, quest_created, fueled_system, skipped)
- **Friction subquest**: createSubQuest accepts frictionNote, sourceChargeBarId
- **Tetris key-unlock**: isKeyUnblocker on CustomBar; cascade on key completion; blocked status for root + siblings
- **321 data pipeline**: Shadow321Session; questCompletedAt when linked quest completed; getMetabolizabilityReport

## Checklist (API-First Order)

- [ ] API contracts defined in spec
- [ ] Shadow321Session model; CustomBar isKeyUnblocker, status blocked
- [ ] charge-metabolism.ts: persist321Session, createQuestFrom321Metadata, fuelSystemFrom321
- [ ] quest-nesting.ts: extend createSubQuest (frictionNote, sourceChargeBarId, isKeyUnblocker)
- [ ] quest-engine.ts: cascade unblock on key completion
- [ ] Shadow321Form + EFA: post-321 Turn into Quest, Fuel System
- [ ] QuestNestingActions: friction field, key checkbox
- [ ] Verification quest cert-singleplayer-charge-metabolism-v1
- [ ] Run `npm run build` and `npm run check` — fail-fix

## Deliverables

- [ ] .specify/specs/singleplayer-charge-metabolism/spec.md
- [ ] .specify/specs/singleplayer-charge-metabolism/plan.md
- [ ] .specify/specs/singleplayer-charge-metabolism/tasks.md
- [ ] src/actions/charge-metabolism.ts
- [ ] src/lib/321-metabolizability.ts
- [ ] Schema: Shadow321Session, CustomBar.isKeyUnblocker, status
- [ ] UI: post-321 routing, friction subquest, key-unlock UX
- [ ] Verification quest seed

## Reference

- Spec: [.specify/specs/singleplayer-charge-metabolism/spec.md](../specs/singleplayer-charge-metabolism/spec.md)
- Plan: [.specify/specs/singleplayer-charge-metabolism/plan.md](../specs/singleplayer-charge-metabolism/plan.md)
- Tasks: [.specify/specs/singleplayer-charge-metabolism/tasks.md](../specs/singleplayer-charge-metabolism/tasks.md)
- 321 EFA Integration: [.specify/specs/321-efa-integration/spec.md](../specs/321-efa-integration/spec.md)
- Creation Quest Bootstrap: [.specify/specs/creation-quest-bootstrap/spec.md](../specs/creation-quest-bootstrap/spec.md)
