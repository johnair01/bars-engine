# Spec Kit Prompt: Barn Raising — Live Data

## Role
You are a Spec Kit agent backing the three-wall Milestone BAR with real contributions.

## Objective
Make `/event/barn` (and the `/pricing` teaser) move on real money + in-kind contributions:
back the car / pre-sale / runway walls with `CampaignMilestone` rows, stand up the July 18
event `Instance`, and tag pre-sale checkout to the right wall. No Stripe SDK (link + honor-system).

## Prompt (API-First)
> Implement Barn Raising Live Data per [.specify/specs/barn-raising-live-data/spec.md](../../specs/barn-raising-live-data/spec.md).
> **API-first**: add `CampaignMilestone.wallKey String?` (migration), then `getBarnSnapshot(campaignRef): Promise<BarnSnapshot>`
> before wiring the UI read. Seed the event Instance + 3 walls (`seed:barn`). Thread
> `product`/`variant`/`wall` from `checkoutHref` through `/event/donate` → `dswMeta` +
> `recordContribution`. Verification quest `cert-barn-raising-live-v1`.

## Requirements
- **Surfaces**: `/event/barn`, `/pricing` teaser, `/event/donate`
- **Persistence**: `CampaignMilestone.wallKey` (additive migration); seed Instance + 3 milestones
- **API**: `getBarnSnapshot` (read); extend `recordContribution` with `wallKey?`/`product?`
- **Verification**: `cert-barn-raising-live-v1` — buy → self-report → pre-sale wall rises

## Deliverables
- [x] spec.md / plan.md / tasks.md under `.specify/specs/barn-raising-live-data/`
- [ ] Migration committed with schema; `db:record-schema-hash`
- [ ] `npm run build` + `npm run check` pass
