# Tasks: Campaign Onboarding Feature Merge

## Phase 1: Developmental Lens in Main Flow

- [x] **1.1** Adventures API: BB_ShowUp primary choice → BB_Developmental_Q1 (not BB_ChooseNation).
- [x] **1.2** Adventures API: BB_Developmental_Q1 node with 3 options (Understanding / Connecting / Acting). Store developmentalHint in campaignState; choices → BB_ChooseNation.
- [x] **1.3** Adventures API: Remove "Quick personalization first" side branch; developmental is required in main path.

## Phase 2: Nation Info Nodes

- [x] **2.1** Adventures API: Add handler for BB_NationInfo_<nationId>. Fetch Nation; return description + 4 moves. Choices: "Choose this nation" → BB_SetNation_<id>, "Back to list" → BB_ChooseNation.
- [x] **2.2** Adventures API: BB_ChooseNation choices → BB_NationInfo_<id> for each nation (user reads, then chooses or goes back).
- [x] **2.3** Adventures API: BB_SetNation_<id> handler exists; set nation in campaignState; transition to BB_ChoosePlaybook.

## Phase 3: Playbook Info Nodes

- [x] **3.1** Adventures API: Add handler for BB_PlaybookInfo_<playbookId>. Fetch Playbook; return description + 4 moves. Choices: "Choose this archetype" → BB_SetPlaybook_<id>, "Back to list" → BB_ChoosePlaybook.
- [x] **3.2** Adventures API: BB_ChoosePlaybook choices → BB_PlaybookInfo_<id> for each playbook.
- [x] **3.3** Adventures API: BB_SetPlaybook_<id> handler exists; set playbook in campaignState; transition to BB_ChooseDomain.

## Verification

- [x] **V1** Add cert quest steps: cert-two-minute-ride-v1 STEP_3a (developmental lens + nation/archetype info); cert-lore-cyoa-onboarding-v1 STEP_3 updated.
- [ ] **V2** Manual: Play /campaign?ref=bruised-banana; verify full flow with developmental lens and info nodes.
