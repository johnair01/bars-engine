# Tasks: Quest Wizard Template Alignment

## Task 1: Remove deprecated templates from QUEST_TEMPLATES

- Remove `party-logistics`, `connection`, `inner-external` from `QUEST_TEMPLATES` in [src/lib/quest-templates.ts](../../src/lib/quest-templates.ts).
- Verification: `QUEST_TEMPLATES.length === 3`

## Task 2: Refine dreams-and-schemes

- Update description: "Campaign-level quests: long-term vision, series of adventures, connected to Kotter Model Stages. Within a campaign, becomes a sub-campaign."
- Update examples: "Launch a collaborative project", "Build a multi-stage vision", "Create urgency for change"
- Add `categoryDisplay: 'CAMPAIGN'`
- Verification: Template shows CAMPAIGN label and new copy in wizard

## Task 3: Replace personal-play with personal-development

- Replace personal-play template with personal-development:
  - id: `personal-development`
  - title: "Personal Development"
  - description: "Grow Up quests — increase skill capacity through developmental lines. Experiment, learn, and build capacity."
  - examples: "Try something new", "Develop a skill", "Build capacity in an area"
  - categoryDisplay: 'GROW UP'
  - Keep lifecycleFraming and inputs (exploration, framing)
- Verification: Template shows GROW UP label and new copy

## Task 4: Update QuestTemplate type

- Change `category` union to `'dreams' | 'play' | 'custom'`
- Add `categoryDisplay?: string` to QuestTemplate type
- Verification: `npm run check` passes

## Task 5: Update QuestWizard to use categoryDisplay

- In template card: `{t.categoryDisplay ?? t.category}` for the category span
- Verification: Dreams & Schemes shows "CAMPAIGN"; Personal Development shows "GROW UP"; Custom shows "CUSTOM"

## Task 6: Reject deprecated template IDs in validateQuestData

- In [src/actions/quest-templates.ts](../../src/actions/quest-templates.ts): if templateId is `party-logistics`, `connection`, or `inner-external`, return `{ valid: false, error: 'Template deprecated' }`
- Verification: Attempting to create quest with deprecated ID fails validation

## Task 7: Seed verification quest cert-quest-wizard-templates-v1

- Add `cert-quest-wizard-templates-v1` to CERT_QUEST_IDS in seed-cyoa-certification-quests.ts
- Add seed block with Twine passages: START, STEP_1 (open wizard), STEP_2 (confirm 3 templates), STEP_3 (Dreams & Schemes), STEP_4 (Personal Development), STEP_5 (complete creation), END_SUCCESS, FEEDBACK
- CustomBar: isSystem, visibility public, reward 1
- Verification: `npx tsx scripts/seed-cyoa-certification-quests.ts` runs; quest appears on Adventures

## Task 8: Run build and check

- `npm run build`
- `npm run check`
- Verification: Both pass
