# Prompt: Quest Wizard Template Alignment

**Use when aligning Quest Wizard templates with game moves.**

## Source

User request: Align Quest Wizard to accurately reflect available moves. Dreams & Schemes = campaign-level; deprecate Party Prep, Connection Quest, Inner↔External; Personal Development = Grow Up; keep Custom Quest.

## Prompt text

> Implement Quest Wizard Template Alignment per [.specify/specs/quest-wizard-template-alignment/spec.md](../specs/quest-wizard-template-alignment/spec.md). (1) Remove party-logistics, connection, inner-external from QUEST_TEMPLATES; (2) Refine dreams-and-schemes (campaign-level, categoryDisplay: CAMPAIGN); (3) Replace personal-play with personal-development (Grow Up framing, categoryDisplay: GROW UP); (4) Add categoryDisplay to QuestTemplate; (5) Update QuestWizard to use categoryDisplay; (6) Reject deprecated template IDs in validateQuestData; (7) Seed cert-quest-wizard-templates-v1. Run `npm run build` and `npm run check`.

## Reference

- Spec: [.specify/specs/quest-wizard-template-alignment/spec.md](../specs/quest-wizard-template-alignment/spec.md)
- Plan: [.specify/specs/quest-wizard-template-alignment/plan.md](../specs/quest-wizard-template-alignment/plan.md)
- Tasks: [.specify/specs/quest-wizard-template-alignment/tasks.md](../specs/quest-wizard-template-alignment/tasks.md)
