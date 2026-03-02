# Spec Kit Prompt: K-Space Librarian Post-Onboarding (Basic Quest)

## Role

You are a Spec Kit agent implementing K-Space Librarian as a basic post-onboarding quest so players can help improve the app and knowledge base.

## Objective

Implement per [.specify/specs/k-space-librarian-post-onboarding/spec.md](../specs/k-space-librarian-post-onboarding/spec.md). Add an orientation thread "Help the Knowledge Base" that teaches the Request from Library flow. Auto-assign spawned DocQuests to the requestor so they appear in Active Quests.

## Requirements

- **Surfaces**: Orientation thread in Journeys, LibraryRequestModal (existing), dashboard Active Quests
- **Mechanics**: assignOrientationThreads (no change; thread auto-assigned), submitLibraryRequest (add PlayerQuest creation when spawned)
- **Persistence**: PlayerQuest creation when request spawns; QuestThread, CustomBar, TwineStory for orientation quest
- **Verification**: Orientation quest completes when player submits Library Request and confirms result; cert-k-space-librarian-v1 for admins (existing)

## Deliverables

- [ ] src/actions/library.ts — create PlayerQuest for requestor when status is spawned
- [ ] scripts/seed-onboarding-thread.ts — add K-Space Librarian story, quest, thread
- [ ] src/components/LibraryRequestModal.tsx — update spawned link to dashboard, add copy
- [ ] .specify/specs/k-space-librarian-post-onboarding/spec.md (done)
- [ ] .specify/specs/k-space-librarian-post-onboarding/plan.md (done)
- [ ] .specify/specs/k-space-librarian-post-onboarding/tasks.md (done)

## Checklist

- [ ] Auto-assign spawned DocQuest to requestor in submitLibraryRequest
- [ ] Orientation quest k-space-librarian-quest with Twine story (player-only steps)
- [ ] Orientation thread k-space-librarian-thread
- [ ] Seed in seed-onboarding-thread.ts
- [ ] LibraryRequestModal: link to dashboard when spawned, copy about Active Quests

## Reference

- Spec: [.specify/specs/k-space-librarian-post-onboarding/spec.md](../specs/k-space-librarian-post-onboarding/spec.md)
- Base K-Space Librarian: [.specify/specs/k-space-librarian/spec.md](../specs/k-space-librarian/spec.md)
- Orientation seed: [scripts/seed-onboarding-thread.ts](../../scripts/seed-onboarding-thread.ts)
- Library actions: [src/actions/library.ts](../../src/actions/library.ts)
