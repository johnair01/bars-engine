# Spec Kit Prompt: Game Master Face Sentences

## Role

You are a Spec Kit agent implementing the face sentences that send players into the CYOA at each game master altitude.

## Objective

Define and implement one sentence per face (Shaman, Challenger, Regent, Architect, Diplomat, Sage) that invites players into the Bruised Banana story at that altitude. The choices (Understanding/Connecting/Acting, nations, playbooks, domains) stay the same structurally but are translated for the face. Quests output are connected to that developmental level.

## Requirements

- **Surfaces**: Path_*_Start nodes (wake-up flow), or equivalent when 6 Faces are integrated into BB flow
- **Content**: Canonical face sentences per spec table — residency + Wendell's technology framed per altitude
- **State**: Set `$active_face` on selection; available for template resolution in subsequent nodes
- **Quest alignment**: Face completion flags (`completed_shaman`, etc.) drive face-aligned quest assignment when available

## Deliverables

- [ ] Create `src/lib/face-sentences.ts` (or equivalent) with canonical sentences keyed by face
- [ ] Update Path_Sh_Start, Path_Ch_Start, Path_Re_Start, Path_Ar_Start, Path_Di_Start, Path_Sa_Start with face sentences
- [ ] When BB integrates 6 Faces: ensure face sentence displayed and `$active_face` set for template resolution
- [ ] Verification: Play wake-up flow; confirm each face shows its sentence

## Reference

- Spec: [.specify/specs/game-master-face-sentences/spec.md](../specs/game-master-face-sentences/spec.md)
- Plan: [.specify/specs/game-master-face-sentences/plan.md](../specs/game-master-face-sentences/plan.md)
- Tasks: [.specify/specs/game-master-face-sentences/tasks.md](../specs/game-master-face-sentences/tasks.md)
- Wake-up Path nodes: [content/campaigns/wake_up/](../../content/campaigns/wake_up/)
- Unified plan: [.cursor/plans/unified_onboarding_campaign_12029a4e.plan.md](../../.cursor/plans/unified_onboarding_campaign_12029a4e.plan.md)
