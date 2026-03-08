# Prompt: Adventure Completion Record (Deferred)

**Use this prompt when adventure completion emerges as a blocker—e.g. UI needs "adventures I've completed", badges, or campaign progress display.**

## Context

Currently, thread completion awards vibeulons and sets `ThreadProgress.completedAt`. There is no explicit "adventure completed" record. Players may want a record when they complete an adventure (collection of quests).

## Prompt text

> Implement Adventure Completion Record per [.specify/specs/adventure-completion-record/spec.md](../specs/adventure-completion-record/spec.md). Either: (A) Add `AdventureCompletion` model (playerId, adventureId, completedAt) and populate when `advanceThreadForPlayer` completes a thread with `adventureId`; or (B) Add helper `hasCompletedAdventure(playerId, adventureId)` that queries ThreadProgress where thread.adventureId matches. Choose based on whether we need a denormalized record or query-only. Support UI for "adventures I've completed" if required.

## Reference

- Spec: [.specify/specs/adventure-completion-record/spec.md](../specs/adventure-completion-record/spec.md)
- Related: [quest-completion-context-restriction](quest-completion-context-restriction.md)
