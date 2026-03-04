# Prompt: Restart Completed Adventures (Certification Testing)

**Use when implementing the ability for admins to restart completed certification adventures from the Adventures page.**

## Source

Certification feedback (cert-quest-grammar-v1 and other completed certs):

> When I click on Certification: Quest Grammar V1 when logged in as admin I am pushed to the market instead of being able to continue the adventure. I suspect that because the adventure is marked as completed it takes me to the quest page. I've confirmed this with other "completed" adventures.

## Prompt text

> Add a "Restart" button on the Adventures page for completed certification quests (admin only). When clicked, call `restoreCertificationQuest(questId)` then navigate to `/adventures/${storyId}/play?questId=${questId}`.
>
> Reuse `restoreCertificationQuest` from [src/actions/admin-certification.ts](../../src/actions/admin-certification.ts). Do not link completed certs only to Market; admins should be able to re-run directly from Adventures.
>
> See [.specify/specs/adventure-restart-completed/spec.md](../../specs/adventure-restart-completed/spec.md).

## Reference

- Spec: [.specify/specs/adventure-restart-completed/spec.md](../../specs/adventure-restart-completed/spec.md)
- Plan: [.specify/specs/adventure-restart-completed/plan.md](../../specs/adventure-restart-completed/plan.md)
- Tasks: [.specify/specs/adventure-restart-completed/tasks.md](../../specs/adventure-restart-completed/tasks.md)
