# Prompt: Onboarding Quest Generation Unblock

**Use this prompt when implementing the onboarding quest generation unblock spec.**

## Context

The onboarding quest generation flow is brittle and inflexible. Blockers: no I Ching in flow, no feedback loop, no grammatical examples, no skeleton-first phase. The spec unblocks testing with quick wins.

## Prompt text

> Implement the Onboarding Quest Generation Unblock per [.specify/specs/onboarding-quest-generation-unblock/spec.md](../specs/onboarding-quest-generation-unblock/spec.md). **Phase 1** (quick wins): Add I Ching draw step to GenerationFlow (STEPS array; Cast/Select/Random options). Store hexagramId; pass ichingContext to compileQuestWithPrivileging. Add feedback text input on generate step; pass adminFeedback to buildQuestPromptContext on regenerate. Add grammatical example (orientation_linear_minimal.json structure) to compileQuestWithAI system prompt. Wire Regenerate button to use adminFeedback. Run `npm run build` and `npm run check`. Add cert-onboarding-quest-generation-unblock-v1 to seed-cyoa-certification-quests.ts.

## Checklist

- [ ] Add iching step to STEPS
- [ ] I Ching step UI (Cast, Select, Random)
- [ ] ichingContext passed to compileQuest
- [ ] Feedback input on generate step
- [ ] adminFeedback passed on regenerate
- [ ] buildQuestPromptContext accepts adminFeedback
- [ ] Grammatical example in system prompt
- [ ] Regenerate uses adminFeedback
- [ ] Build and check pass
- [ ] Cert quest added

## Reference

- Spec: [.specify/specs/onboarding-quest-generation-unblock/spec.md](../specs/onboarding-quest-generation-unblock/spec.md)
- Plan: [.specify/specs/onboarding-quest-generation-unblock/plan.md](../specs/onboarding-quest-generation-unblock/plan.md)
- Tasks: [.specify/specs/onboarding-quest-generation-unblock/tasks.md](../specs/onboarding-quest-generation-unblock/tasks.md)
- Analysis: [docs/architecture/onboarding-quest-generation-unblock.md](../../docs/architecture/onboarding-quest-generation-unblock.md)
