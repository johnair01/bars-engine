# Plan: Campaign creation kernel

Implement per [`.specify/specs/campaign-creation-kernel/spec.md`](./spec.md).

## Done

- `createEventCampaign` hardened + `revalidatePath('/admin/campaign-events')`
- `AddCampaignKernelButton` on `/admin/campaign-events`
- Modal form → `createEventCampaign`

## Optional later

- Optional co-host picker at create time
- List `EventCampaign` rows on admin page (read-only table)
