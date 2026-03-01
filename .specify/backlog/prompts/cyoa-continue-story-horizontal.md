# Spec Kit Prompt: CYOA Continue Story Horizontal

## Role

You are a Spec Kit agent implementing the emergent fix: "Continue" should advance both content (slides) and story horizontally.

## Objective

Unify slide "Next" with story "Continue" so one button moves through long content and then advances the narrative. Prefer graph structure (split nodes) where feasible; fallback to unified Continue in UI.

## Requirements

- **Surfaces**: CampaignReader (campaign CYOA), PassageRenderer (certification quests)
- **Mechanics**: Single "Continue" button: on non-final slide, advance slide; on final slide, advance story (handleChoice / fetchNode)
- **Structure (Phase B)**: Split BB_Intro into BB_Intro_1, BB_Intro_2, ... in adventures API when content exceeds threshold
- **Verification**: Cert quest step confirming Continue advances story

## Deliverables

- [x] Phase A: Unify Continue in CampaignReader and PassageRenderer; remove Prev/Next
- [x] Phase B: Split BB_Intro and BB_ShowUp into graph nodes in API; remove client chunking for those nodes
- [x] Verification quest step (cert-two-minute-ride-v1 STEP_1)

## Reference

- Spec: [.specify/specs/cyoa-continue-story-horizontal/spec.md](../../.specify/specs/cyoa-continue-story-horizontal/spec.md)
- Plan: [.specify/specs/cyoa-continue-story-horizontal/plan.md](../../.specify/specs/cyoa-continue-story-horizontal/plan.md)
- Tasks: [.specify/specs/cyoa-continue-story-horizontal/tasks.md](../../.specify/specs/cyoa-continue-story-horizontal/tasks.md)
