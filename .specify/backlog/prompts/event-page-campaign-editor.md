# Prompt: Event Page Campaign Editor

**Use this prompt when implementing the event page campaign editor for the Bruised Banana Residency. High priority: unblocks invitation-to-donate flow.**

## Prompt text

> Implement the Event Page Campaign Editor per [.specify/specs/event-page-campaign-editor/spec.md](../specs/event-page-campaign-editor/spec.md). Add editable Wake Up and Show Up content to the Instance model; enable admins to edit campaign copy directly from the event page (Edit button + modal) and from Admin Instances. This allows pasting content from ChatGPT directly into the app before sending invitations. Use game language: Wake Up = learn the story; Show Up = contribute to the campaign.

## Checklist

- [ ] Schema: Instance.wakeUpContent, Instance.showUpContent
- [ ] updateInstanceCampaignCopy server action (admin-only)
- [ ] Event page: Edit button (admin) + modal with form
- [ ] Event page: render instance.wakeUpContent, instance.showUpContent (fallback to defaults)
- [ ] Admin Instances: add wakeUpContent, showUpContent to form
- [ ] upsertInstance persists new fields
- [ ] Verification quest cert-event-campaign-editor-v1

## Reference

- Spec: [.specify/specs/event-page-campaign-editor/spec.md](../specs/event-page-campaign-editor/spec.md)
- Plan: [.specify/specs/event-page-campaign-editor/plan.md](../specs/event-page-campaign-editor/plan.md)
- Tasks: [.specify/specs/event-page-campaign-editor/tasks.md](../specs/event-page-campaign-editor/tasks.md)
