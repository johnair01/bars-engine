# Spec Kit Prompt: Campaign Onboarding Feature Merge

## Role

You are a Spec Kit agent implementing the emergent fix: merge wake-up and guided onboarding features into the Bruised Banana campaign flow.

## Objective

The campaign flow (`/campaign?ref=bruised-banana`) lacks features present in the wake-up campaign and guided flow:
1. **Developmental lens before nation/archetype** — Wake-up has Center_ChooseLens (6 Faces); BB has developmental as optional side branch. Make it part of the main flow, before nation selection.
2. **Read about nations and archetypes** — Guided flow has nation_info_*, playbook_info_* nodes with full descriptions. BB shows names only. Add info nodes so players can read before choosing.

## Requirements

- **Surfaces**: CampaignReader (campaign CYOA), Adventures API (BB nodes)
- **Flow change**: BB_ShowUp → BB_Developmental_Lens (required) → BB_ChooseNation → BB_NationInfo_<id> (optional drill-down) → BB_ChoosePlaybook → BB_PlaybookInfo_<id> (optional drill-down) → BB_ChooseDomain → BB_Moves_* → Signup
- **Developmental lens**: Use existing BB_Developmental_Q1 pattern (Understanding / Connecting / Acting) in main flow, or optionally align with wake-up 6 Faces. Store developmentalHint in campaignState for assignOrientationThreads.
- **Nation/archetype info**: Add BB_NationInfo_<id> and BB_PlaybookInfo_<id> nodes. Each returns: text = description + 4 moves (from Nation/Playbook schema); choices = "Choose this nation/archetype" (→ BB_SetNation_<id> or BB_SetPlaybook_<id>), "Back to list" (→ BB_ChooseNation or BB_ChoosePlaybook).
- **BB_ChooseNation**: Change choices to "Read about [Nation]" → BB_NationInfo_<id>, or "Choose [Nation]" → BB_SetNation_<id>. Or: each nation as choice → BB_NationInfo_<id> (user reads, then "Choose" or "Back").
- **BB_ChoosePlaybook**: Same pattern for playbooks.

## Deliverables

- [ ] Adventures API: Insert BB_Developmental_Lens in main flow (after ShowUp, before ChooseNation). Remove "Quick personalization first" side branch; make developmental required.
- [ ] Adventures API: Add BB_NationInfo_<id> nodes returning nation description + moves. Choices: "Choose this nation" → BB_SetNation_<id>, "Back to list" → BB_ChooseNation.
- [ ] Adventures API: Add BB_PlaybookInfo_<id> nodes returning playbook description + moves. Choices: "Choose this archetype" → BB_SetPlaybook_<id>, "Back to list" → BB_ChoosePlaybook.
- [ ] BB_ChooseNation: Update choices so each nation links to BB_NationInfo_<id> (user reads, then chooses or goes back).
- [ ] BB_ChoosePlaybook: Same for playbooks.
- [ ] Verification: Add or update cert quest step for developmental lens + nation/archetype info flow.

## Reference

- Spec: [.specify/specs/campaign-onboarding-feature-merge/spec.md](../specs/campaign-onboarding-feature-merge/spec.md)
- Plan: [.specify/specs/campaign-onboarding-feature-merge/plan.md](../specs/campaign-onboarding-feature-merge/plan.md)
- Tasks: [.specify/specs/campaign-onboarding-feature-merge/tasks.md](../specs/campaign-onboarding-feature-merge/tasks.md)
- Nation/playbook info pattern: [src/lib/story-content.ts](../../src/lib/story-content.ts) lines 230-269 (nation_info_), 400-437 (playbook_info_)
- BB API: [src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)
- Wake-up lens: [content/campaigns/wake_up/Center_ChooseLens.json](../../content/campaigns/wake_up/Center_ChooseLens.json)
