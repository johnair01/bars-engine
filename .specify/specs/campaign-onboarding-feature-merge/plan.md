# Plan: Campaign Onboarding Feature Merge

## Architecture

### Phase 1: Developmental Lens in Main Flow

**Adventures API** ([src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)):
- BB_ShowUp: change primary choice from BB_ChooseNation to BB_Developmental_Lens.
- Add BB_Developmental_Lens node: 3 options (Understanding / Connecting / Acting) or 6 Faces. Store developmentalHint in campaignState.
- BB_Developmental_Lens choices → BB_ChooseNation.
- Remove or repurpose "Quick personalization first" side branch; developmental is now required in main path.

### Phase 2: Nation Info Nodes

**Adventures API**:
- Add handler for `BB_NationInfo_<nationId>`: fetch Nation by id; return text = description + 4 moves; choices = "Choose this nation" (→ BB_SetNation_<id>), "Back to list" (→ BB_ChooseNation).
- BB_ChooseNation: change choices from direct "Choose [Nation]" to "Read about [Nation]" (→ BB_NationInfo_<id>). Or: each nation as choice → BB_NationInfo_<id> (user reads, then chooses or goes back).
- BB_SetNation_<id>: sets nation in campaignState; transitions to BB_ChoosePlaybook.

### Phase 3: Playbook Info Nodes

**Adventures API**:
- Add handler for `BB_PlaybookInfo_<playbookId>`: fetch Playbook by id; return text = description + 4 moves; choices = "Choose this archetype" (→ BB_SetPlaybook_<id>), "Back to list" (→ BB_ChoosePlaybook).
- BB_ChoosePlaybook: change choices to link to BB_PlaybookInfo_<id>.
- BB_SetPlaybook_<id>: sets playbook in campaignState; transitions to BB_ChooseDomain.

### CampaignReader

- No structural changes. CampaignReader already fetches nodes by targetId and renders choices. New nodes (BB_NationInfo_*, BB_PlaybookInfo_*) render like any other passage.

## File Impacts

| File | Change |
|------|--------|
| route.ts (adventures API) | BB_ShowUp flow; BB_Developmental_Lens; BB_NationInfo_*; BB_PlaybookInfo_*; BB_ChooseNation/BB_ChoosePlaybook choice targets |
| seed-cyoa-certification-quests.ts | Add/update cert step for developmental lens + nation/archetype info |

## Verification

- Cert quest: Add step to cert-two-minute-ride-v1 or cert-lore-cyoa-onboarding-v1: "Confirm developmental lens appears before nation selection" and "Confirm you can read about each nation and archetype before choosing."
- Manual: /campaign?ref=bruised-banana; verify flow: Intro → ShowUp → Developmental Lens → Choose Nation → (read nation info) → Choose Playbook → (read playbook info) → Domain → Moves → Signup.
