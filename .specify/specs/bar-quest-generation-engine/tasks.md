# Tasks: BAR → Quest Generation Engine v0

## Phase 1: Schema + Eligibility

- [x] **T1.1** Add QuestProposal model to Prisma (proposal_id, bar_id, campaign_id, player_id, title, description, domain, quest_type, completion_conditions, emotional_alchemy JSON, review_status, confidence_score)
- [x] **T1.2** Implement checkBarEligibilityForQuestGeneration(barId)
- [x] **T1.3** Add bar_converted_to_quest tracking (field on CustomBar or separate table)

## Phase 2: Interpretation + Grammar

- [x] **T2.1** Implement interpretBarForQuestGeneration(bar)
- [x] **T2.2** Define quest type selection logic (resource, coordination, awareness, action, reflection)
- [x] **T2.3** Integrate emotional alchemy resolution (resolveMove or equivalent)
- [x] **T2.4** Implement buildQuestProposalFromInterpretation(interpretation, alchemyResult)

## Phase 3: Admin Review + Publication

- [x] **T3.1** Server action: generateQuestProposalFromBar(barId)
- [x] **T3.2** Server action: listQuestProposals(filters)
- [x] **T3.3** Server action: reviewQuestProposal(proposalId, action, editedFields)
- [x] **T3.4** Server action: publishQuestProposal(proposalId)
- [x] **T3.5** Admin UI: /admin/quest-proposals page (list + detail)
- [x] **T3.6** Publication: create CustomBar from proposal, set campaignRef, allyshipDomain, moveType

## Phase 4: Optional

- [ ] **T4.1** Campaign phase awareness (phase_1_opening_momentum)
- [ ] **T4.2** Twine IR bridge for approved quests
