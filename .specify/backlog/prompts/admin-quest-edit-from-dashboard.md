# Prompt: Admin Quest Edit from Dashboard

**Use when implementing admin edit link for quests viewed from the player dashboard.**

## Source

User request:

> Desired behavior: when I reach a quest while logged in in admin I'm given the option to edit the quest from the dashboard even if the quest is embedded in a journey. I should then be able to extend the quest into a CYOA experience.
>
> Perceived behavior: when logged in as admin I can bring up a quest but I don't see a link to update the quest.

## Prompt text

> Implement admin quest edit from dashboard: when an admin views a quest (from the player dashboard, including quests embedded in journeys), show an "Edit quest" link in the quest modal that navigates to `/admin/quests/[id]`. From there the admin can extend the quest into a CYOA via the existing Upgrade to CYOA flow. See [.specify/specs/admin-quest-edit-from-dashboard/spec.md](../../specs/admin-quest-edit-from-dashboard/spec.md).

## Reference

- Spec: [.specify/specs/admin-quest-edit-from-dashboard/spec.md](../../specs/admin-quest-edit-from-dashboard/spec.md)
- Plan: [.specify/specs/admin-quest-edit-from-dashboard/plan.md](../../specs/admin-quest-edit-from-dashboard/plan.md)
- Tasks: [.specify/specs/admin-quest-edit-from-dashboard/tasks.md](../../specs/admin-quest-edit-from-dashboard/tasks.md)
