# Spec: Quest Wizard Template Alignment

## Purpose

Align the Quest Wizard templates with the game's canonical moves and quest types. The wizard currently shows six templates; three are deprecated (Party Prep, Connection Quest, Inner↔External). The remaining three (Dreams & Schemes, Personal Development, Custom Quest) must accurately reflect campaign-level work, Grow Up moves, and custom creation.

**Problem**: Quest templates no longer match the game's ontology. Party Prep is obsolete; Connection Quest and Inner↔External are means-to-an-end covered by generic types. Dreams & Schemes needs campaign/Kotter framing; Personal Exploration should be framed as Grow Up.

**Practice**: Deftness Development — spec kit first, deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Deprecation | Remove party-logistics, connection, inner-external from `QUEST_TEMPLATES`. No DB migration; existing quests unaffected. |
| Dreams & Schemes | Refine as campaign-level; description mentions sub-campaign, Kotter stages, series of adventures. Category display: "CAMPAIGN". |
| Personal Development | Rename from Personal Exploration; frame as Grow Up quests. New id: `personal-development`. Category display: "GROW UP". |
| Custom Quest | Keep unchanged. |
| Category type | Simplify to `'dreams' | 'play' | 'custom'`. Remove logistics, social, transformation. |
| validateQuestData | Reject deprecated template IDs on create; return `{ valid: false, error: 'Template deprecated' }`. |

## Conceptual Model

| Dimension | Meaning |
|-----------|---------|
| **WHAT** | Quests — Dreams & Schemes (campaign), Personal Development (Grow Up), Custom |
| **Personal throughput** | 4 moves: Wake Up, Clean Up, Grow Up, Show Up |
| **Campaign** | Dreams & Schemes = campaign-level; within campaign = sub-campaign; Kotter stages |

Reference: [conceptual-model.md](../memory/conceptual-model.md)

## User Stories

### P1: Template selection reflects game moves

**As a player**, I want the Quest Wizard to show only templates that match the game's available moves, so I create quests aligned with campaign work, Grow Up, or custom goals.

**Acceptance**: Wizard shows exactly three templates: Dreams & Schemes (CAMPAIGN), Personal Development (GROW UP), Custom Quest (CUSTOM).

### P2: Dreams & Schemes is campaign-level

**As a player**, I want Dreams & Schemes to clearly indicate it's for campaign-level work (sub-campaigns, Kotter stages, series of adventures), so I use it appropriately.

**Acceptance**: Description mentions campaign, sub-campaign, Kotter Model Stages. Examples include collaborative project, multi-stage vision.

### P3: Personal Development is Grow Up

**As a player**, I want Personal Development to frame quests as Grow Up (skill capacity, developmental lines), so I create quests that build capacity.

**Acceptance**: Description mentions Grow Up; examples include developing skills, building capacity.

## Functional Requirements

### FR1: Deprecate Party Preparation, Connection Quest, Inner↔External

- Remove `party-logistics`, `connection`, `inner-external` from `QUEST_TEMPLATES` in [src/lib/quest-templates.ts](../src/lib/quest-templates.ts).
- `getQuestTemplates()` returns only the three kept templates.
- `validateQuestData(templateId, data)` returns `{ valid: false, error: 'Template deprecated' }` for deprecated IDs.

### FR2: Refine Dreams & Schemes

- **Category**: `dreams`; display as "CAMPAIGN" (add `categoryDisplay?: string` to template; QuestWizard uses it when present).
- **Description**: "Campaign-level quests: long-term vision, series of adventures, connected to Kotter Model Stages. Within a campaign, becomes a sub-campaign."
- **Examples**: "Launch a collaborative project", "Build a multi-stage vision", "Create urgency for change"
- **Inputs**: Keep vision, approach (Freeform/Kotter), kotterStage select.

### FR3: Rename Personal Exploration → Personal Development

- **ID**: `personal-development`
- **Category**: `play`; display as "GROW UP"
- **Title**: "Personal Development"
- **Description**: "Grow Up quests — increase skill capacity through developmental lines. Experiment, learn, and build capacity."
- **Examples**: "Try something new", "Develop a skill", "Build capacity in an area"
- **Inputs**: Keep exploration/framing; lifecycle framing options (Wake Up, Clean Up, Grow Up, Show Up).

### FR4: QuestTemplate type and categoryDisplay

- Update `QuestTemplate.category` to `'dreams' | 'play' | 'custom'`.
- Add `categoryDisplay?: string` — when present, QuestWizard displays this instead of `category` in the template card.

### FR5: Verification quest

- Seed `cert-quest-wizard-templates-v1` — Twine story with steps to verify template selection, Dreams & Schemes copy, Personal Development copy, and quest creation completion.

## Non-Functional Requirements

- Backward compatibility: Existing quests created from deprecated templates remain valid. No DB migration.
- `validateQuestData` rejects deprecated template IDs for new quest creation.

## Verification Quest (required for UX features)

- **ID**: `cert-quest-wizard-templates-v1`
- **Steps**: (1) Open quest creation flow; (2) Confirm only 3 templates: Dreams & Schemes; Personal Development; Custom Quest; (3) Select Dreams & Schemes, verify description mentions campaign/Kotter; (4) Select Personal Development, verify Grow Up framing; (5) Complete quest creation; (6) Mint reward (no link on final passage).
- Reference: [cyoa-certification-quests](cyoa-certification-quests/)

## Dependencies

- None.

## References

- [src/lib/quest-templates.ts](../../src/lib/quest-templates.ts)
- [src/components/quest-creation/QuestWizard.tsx](../../src/components/quest-creation/QuestWizard.tsx)
- [src/actions/quest-templates.ts](../../src/actions/quest-templates.ts)
- [scripts/seed-cyoa-certification-quests.ts](../../scripts/seed-cyoa-certification-quests.ts)
