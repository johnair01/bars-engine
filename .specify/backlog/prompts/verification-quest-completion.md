# Prompt: Verification Quest Completion Display

**Use this prompt when verification/certification quests are not showing as completed on the Adventures page.**

## Prompt text

> Verification quests played from Adventures must show as completed when the player finishes them. Ensure `getOrCreateRun` auto-assigns a `PlayerQuest` (status `assigned`) when starting or resuming a quest-scoped run, so `autoCompleteQuestFromTwine` can mark it complete when the player reaches an END passage. The Adventures page uses `quest.assignments[0].status === 'completed'` to show the Completed badge. See [.specify/specs/verification-quest-completion/spec.md](../../specs/verification-quest-completion/spec.md).

## Checklist for new verification quests

- [ ] Quest is linked to a CustomBar with `twineStoryId` (appears on Adventures)
- [ ] Play URL includes `questId` (e.g. `/adventures/{storyId}/play?questId={questId}`)
- [ ] Story has at least one END passage (name starts with `END_` or has no outgoing links)
- [ ] `getOrCreateRun` assigns the quest when questId is present (already implemented)

## Future: Backlog integration

When implementing "completed verification quests update backlog": add metadata to link quest → backlog prompt/spec, and define the update format. See Part 2 of the spec.
