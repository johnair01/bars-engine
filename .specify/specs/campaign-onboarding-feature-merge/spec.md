# Spec: Campaign Onboarding Feature Merge

## Purpose

Merge the features of the wake-up campaign and guided onboarding into the Bruised Banana campaign flow. The campaign flow (`/campaign?ref=bruised-banana`) currently lacks: (1) developmental lens selection before nation/archetype, and (2) the ability to read about nations and archetypes before choosing.

## Root cause

- **Bruised Banana flow** (BB_*): Intro → ShowUp → [optional Developmental] → Choose Nation (names only) → Choose Playbook (names only) → Choose Domain → Moves → Signup.
- **Wake-up campaign** (Center_*): Center_Witness → Center_ChooseLens (6 Faces / developmental lens) → altitude paths → Onboarding_Start (nation/archetype).
- **Guided flow** (StoryReader): Uses `nation_info_<id>` and `playbook_info_<id>` nodes with full descriptions, moves, and "Choose this" / "Back" options.

The BB flow skips developmental lens in the main path and shows nation/playbook as bare choice lists without info nodes.

## User story

**As a player**, I want the Bruised Banana campaign to offer the same onboarding depth as the wake-up and guided flows: choose a developmental lens before nation and archetype, and read detailed descriptions of each nation and archetype before committing to a choice.

**Acceptance**:
1. Developmental lens selection is in the main flow, before nation/archetype selection.
2. When choosing nation, I can open an info view for each nation (description, moves) before confirming.
3. When choosing archetype, I can open an info view for each archetype (description, moves) before confirming.

## Functional requirements

- **FR1**: Developmental lens MUST appear in the main BB flow before BB_ChooseNation. Order: BB_Intro → BB_ShowUp → BB_Developmental_Lens → BB_ChooseNation → BB_ChoosePlaybook → BB_ChooseDomain → BB_Moves_* → Signup.
- **FR2**: Developmental lens MAY use the existing BB_Developmental_Q1 pattern (Understanding / Connecting / Acting) or align with wake-up's 6 Faces (Shaman, Challenger, Regent, Architect, Diplomat, Sage). Spec recommends starting with BB's simpler 3-option; 6 Faces can be a follow-up.
- **FR3**: BB_ChooseNation MUST offer a way to read about each nation before choosing. Options: (a) Add BB_NationInfo_<id> nodes with description + moves + "Choose this nation" / "Back to list"; (b) Link each nation choice to wiki page; (c) Expandable inline description. Spec recommends (a) for parity with guided flow.
- **FR4**: BB_ChoosePlaybook MUST offer a way to read about each archetype before choosing. Add BB_PlaybookInfo_<id> nodes with description + moves + "Choose this archetype" / "Back to list".
- **FR5**: CampaignReader MUST support the new node types (BB_NationInfo_*, BB_PlaybookInfo_*). Content format: markdown with nation/playbook description and 4 moves. Choices: "Choose this nation/archetype", "Back to list".
- **FR6**: Adventures API ([src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)) MUST return BB_NationInfo_<id> and BB_PlaybookInfo_<id> nodes when ref=bruised-banana. Use Nation and Playbook schema (description, wakeUp, cleanUp, growUp, showUp).

## Non-functional requirements

- Reuse existing Nation and Playbook schema; no new models.
- CampaignReader already fetches nodes by targetId; new nodes integrate with existing choice flow.
- Verification quest: Add or update cert-two-minute-ride-v1 step to confirm developmental lens and nation/archetype info flow.

## Reference

- Wake-up campaign: [content/campaigns/wake_up/Center_ChooseLens.json](../../content/campaigns/wake_up/Center_ChooseLens.json)
- Guided flow nation/playbook info: [src/lib/story-content.ts](../../src/lib/story-content.ts) (nation_info_*, playbook_info_*)
- BB flow: [src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)
- Lore CYOA spec: [.specify/specs/lore-cyoa-onboarding/spec.md](../lore-cyoa-onboarding/spec.md)
