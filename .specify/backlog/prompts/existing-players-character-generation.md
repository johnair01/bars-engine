# Prompt: Existing Players Character Generation (Orientation Quest)

**Use this prompt when implementing the ability for existing players to generate their avatar from stored nation/archetype choices.**

## Context

Players who completed onboarding before `avatarConfig` was introduced have `nationId` and `playbookId` but no `avatarConfig`. The JRPG sprite avatar requires `avatarConfig` to render. New players get it from CYOA signup or guided flow; existing players need a path. An orientation quest "Build Your Character" provides that path.

## Prompt text

> Implement an orientation quest that lets existing players generate their avatar from stored nation and archetype. Add completion effect `deriveAvatarFromExisting` to the quest engine: fetch player's nationId/playbookId, resolve Nation/Playbook names, call deriveAvatarConfig, update player.avatarConfig. Create orientation quest "Build Your Character" (id: build-character-quest) with minimal Twine story and this completion effect. Create orientation thread "Build Your Character" (id: build-character-thread) assigned via assignOrientationThreads. Add verification quest cert-existing-players-character-v1. Use game language: WHO (nation, archetype) maps to visual identity.

## Checklist

- [ ] Completion effect `deriveAvatarFromExisting` in processCompletionEffects
- [ ] Quest build-character-quest with completionEffects
- [ ] Orientation thread build-character-thread
- [ ] Seed in seed-onboarding-thread.ts
- [ ] Verification quest cert-existing-players-character-v1 in seed-cyoa-certification-quests.ts

## Reference

- Spec: [.specify/specs/existing-players-character-generation/spec.md](../specs/existing-players-character-generation/spec.md)
- Avatar utils: [src/lib/avatar-utils.ts](../../src/lib/avatar-utils.ts)
- Quest engine: [src/actions/quest-engine.ts](../../src/actions/quest-engine.ts)
- Orientation seed: [scripts/seed-onboarding-thread.ts](../../scripts/seed-onboarding-thread.ts)
