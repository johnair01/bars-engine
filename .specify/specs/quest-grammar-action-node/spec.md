# Spec: Quest Grammar Action Node Refactor

## Purpose

Generalize "donation node" to "action node" so the quest grammar is campaign-agnostic and reusable. Donation is one specific action—the basic move for a fundraising campaign (Show Up = receive donations). Other campaigns have different actions: signup, complete quest, publish, study at sect.

**High-leverage deftness**: One schema change propagates through types, compiler, tests, and unlocks [Quest Quality Automation](../../.cursor/plans/quest_quality_automation_25128b01.plan.md) with campaign-aware scoring. Reduces special-case logic; increases token economy and reuse.

## Conceptual Model (Game Language)

- **Action node** = The Epiphany Bridge beat (transcendence) or Kotter beat (wins) where the player commits to a concrete next step. The *action* is configurable per campaign.
- **Basic moves per campaign**:
  - Wake Up (Raise Awareness) — Tell a story, draw another grammatical quest
  - Clean Up — Inner work (Emotional First Aid)
  - Grow Up — Domain skills (Study at sect, dojo)
  - Show Up — Direct action (complete quest, donate, sign up)
- **Fundraiser**: Donation = Show Up action. Receive more donations is the basic move.
- **Onboarding**: Sign up = Show Up action.
- **Other**: Complete quest, publish, study, etc.

## User Stories

### P1: Terminology and schema

**As a developer**, I want `isDonationNode` renamed to `isActionNode` with optional `actionType`, so the quest grammar supports multiple campaign types without special-casing donation.

**Acceptance**:
- `QuestNode.isActionNode` replaces `isDonationNode` (or extends it with backward compat)
- `QuestNode.actionType?: 'donation' | 'signup' | 'complete' | 'generic'` when `isActionNode` is true
- `QuestCompileInput.campaignId` maps to default `actionType` (bruised-banana → donation, onboarding → signup)

### P2: Campaign-aware action node

**As a campaign owner**, I want the transcendence/wins node to reflect the campaign's primary action, so visitors see the right commitment moment (donate, sign up, complete, etc.).

**Acceptance**:
- compileQuest accepts `campaignId`; when present, sets `actionType` on the action node
- Default: `actionType: 'donation'` for backward compat (bruised-banana, fundraiser)
- Template structure: ritual + transaction framing + action-specific CTA (configurable per actionType)

### P3: Deftness integration

**As an AI agent or developer**, I want this refactor documented in the deftness skill and spec kit, so future implementations apply campaign-agnostic patterns.

**Acceptance**:
- Spec exists; plan and tasks are actionable
- Deftness skill reference.md or checklist mentions "action node over donation node" for quest grammar work
- Quest Quality Automation plan references this spec for campaign-aware scorer

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR1 | Rename `isDonationNode` → `isActionNode` in `QuestNode` (types.ts). Add `actionType?: ActionType` when true. |
| FR2 | Define `ActionType = 'donation' | 'signup' | 'complete' | 'generic'`. Default `'donation'` when `campaignId` is fundraiser/bruised-banana. |
| FR3 | compileQuestCore: Set `actionType` on transcendence/wins nodes based on `campaignId` or input override. |
| FR4 | TelemetryHooks: Keep `donationClicked`, `donationCompleted` for fundraiser; document as action-specific. Optional: add `actionCompleted` for generic use. |
| FR5 | Update questGrammarSpec.md, compileQuest.test.ts assertions. All existing tests pass. |
| FR6 | No schema/DB changes. Types and compiler only. |

## Non-Functional

- **Backward compat**: Existing Bruised Banana / fundraiser flows unchanged. Default actionType = donation.
- **Token economy**: Clearer terminology reduces explanation tokens in future specs and prompts.
- **Verification**: `npm run test:quest-grammar` passes; `npm run build` succeeds.

## References

- [Quest Grammar Compiler](../quest-grammar-compiler/spec.md)
- [Quest Quality Automation](../../.cursor/plans/quest_quality_automation_25128b01.plan.md)
- [Deftness Development Skill](../../.agents/skills/deftness-development/SKILL.md)
- [questGrammarSpec.md](../../src/lib/quest-grammar/questGrammarSpec.md)
