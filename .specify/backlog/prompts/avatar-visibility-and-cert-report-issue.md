# Prompt: Avatar Visibility Fix + Certification Report Issue

**Use this prompt when fixing avatar not appearing after Build Your Character, and ensuring Report Issue on all certification quests.**

## Context

Existing players (admin, pre-avatar characters) complete the "Build Your Character" quest but their avatar does not appear. Root cause: `autoCompleteQuestFromTwine` (used when completing via Twine player) does NOT call `processCompletionEffects`, so `deriveAvatarFromExisting` never runs. Additionally, certification quests must have Report Issue on every step per certification-quest-ux FR5.

## Prompt text

> Fix avatar visibility: autoCompleteQuestFromTwine must call processCompletionEffects so deriveAvatarFromExisting runs when Build Your Character is completed via Twine. Export runCompletionEffectsForQuest from quest-engine (or equivalent) and invoke from autoCompleteQuestFromTwine. Pass threadId through advanceRun so advanceThreadForPlayer runs when completing a thread quest. Add Report Issue to Build Your Character. Audit all certification quests for missing Report Issue links and add them.

## Checklist

- [ ] processCompletionEffects runs when completing via Twine (autoCompleteQuestFromTwine)
- [ ] threadId passed through advanceRun, advanceThreadForPlayer called
- [ ] Build Your Character has FEEDBACK passage and Report Issue link
- [ ] All cert quests have Report Issue on every step

## Reference

- Spec: [.specify/specs/avatar-visibility-and-cert-report-issue/spec.md](../specs/avatar-visibility-and-cert-report-issue/spec.md)
- Twine: [src/actions/twine.ts](../../src/actions/twine.ts)
- Quest engine: [src/actions/quest-engine.ts](../../src/actions/quest-engine.ts)
