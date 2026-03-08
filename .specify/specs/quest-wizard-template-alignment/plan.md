# Plan: Quest Wizard Template Alignment

## Objective

Align Quest Wizard templates with game moves: deprecate 3, refine 2, keep 1. Add verification quest.

## File Impacts

| File | Change |
|------|--------|
| [src/lib/quest-templates.ts](../../src/lib/quest-templates.ts) | Remove party-logistics, connection, inner-external; refine dreams-and-schemes; replace personal-play with personal-development; add categoryDisplay; update QuestTemplate type |
| [src/components/quest-creation/QuestWizard.tsx](../../src/components/quest-creation/QuestWizard.tsx) | Use `t.categoryDisplay ?? t.category` for template card category label |
| [src/actions/quest-templates.ts](../../src/actions/quest-templates.ts) | validateQuestData: reject deprecated template IDs |
| [scripts/seed-cyoa-certification-quests.ts](../../scripts/seed-cyoa-certification-quests.ts) | Add cert-quest-wizard-templates-v1 entry and seed block |

## API Surface

- **getQuestTemplates()**: No signature change; returns filtered list (3 templates).
- **validateQuestData(templateId, data)**: Returns `{ valid: false, error: 'Template deprecated' }` when templateId is `party-logistics`, `connection`, or `inner-external`.

## Verification Quest

- **ID**: `cert-quest-wizard-templates-v1`
- **Twine passages**: START → STEP_1 (open wizard) → STEP_2 (confirm 3 templates) → STEP_3 (Dreams & Schemes copy) → STEP_4 (Personal Development copy) → STEP_5 (complete creation) → END_SUCCESS. FEEDBACK node for Report Issue.
- **CustomBar**: `isSystem: true`, `visibility: 'public'`, `reward: 1`, slug `cert-quest-wizard-templates-v1`
- **Seed**: Add to seed-cyoa-certification-quests.ts; add to CERT_QUEST_IDS

## Implementation Order

1. Update quest-templates.ts (remove deprecated, refine kept, add categoryDisplay)
2. Update QuestWizard to use categoryDisplay
3. Update validateQuestData for deprecated IDs
4. Add verification quest to seed script
5. Run `npm run build` and `npm run check`
