# Prompt: Certification Quest — Onboarding Quest Generation Unblock

**Use this prompt when adding the verification quest for the onboarding quest generation unblock feature.**

## Context

The onboarding-quest-generation-unblock spec (Phases 1–4) is implemented: I Ching step, feedback field, skeleton-first, lens as first choice, CYOA process. A certification quest is required to validate the flow. Add `cert-onboarding-quest-generation-unblock-v1` to the seed script.

## Prompt text

> Implement the cert-onboarding-quest-generation-unblock spec per [.specify/specs/cert-onboarding-quest-generation-unblock/spec.md](../specs/cert-onboarding-quest-generation-unblock/spec.md). Add `cert-onboarding-quest-generation-unblock-v1` to `CERT_QUEST_IDS` and create the seed block in `scripts/seed-cyoa-certification-quests.ts`. Passages: START, STEP_1 (open admin quest grammar, CYOA tab), STEP_2 (complete unpacking + I Ching), STEP_3 (Generate Skeleton or Generate with AI), STEP_4 (feedback + Regenerate), STEP_5 (confirm structural validity), STEP_6 (Publish or Export .twee), FEEDBACK, END_SUCCESS. Use markdown links per cert-quest-passage-links. Run `npm run seed:cert:cyoa` to verify.

## Checklist

- [ ] Add to CERT_QUEST_IDS
- [ ] Create TwineStory + CustomBar seed block
- [ ] Define 6 steps + FEEDBACK + END_SUCCESS
- [ ] Markdown links in passage text
- [ ] Run seed:cert:cyoa; confirm quest appears

## Reference

- Spec: [.specify/specs/cert-onboarding-quest-generation-unblock/spec.md](../specs/cert-onboarding-quest-generation-unblock/spec.md)
- Plan: [.specify/specs/cert-onboarding-quest-generation-unblock/plan.md](../specs/cert-onboarding-quest-generation-unblock/plan.md)
- Tasks: [.specify/specs/cert-onboarding-quest-generation-unblock/tasks.md](../specs/cert-onboarding-quest-generation-unblock/tasks.md)
- Feature spec: [.specify/specs/onboarding-quest-generation-unblock/spec.md](../specs/onboarding-quest-generation-unblock/spec.md)
