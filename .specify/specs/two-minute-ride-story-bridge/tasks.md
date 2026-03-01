# Tasks: 2-Minute Ride — Story Bridge + UX Expansion

## Schema and Campaign Ref

- [x] Add `Instance.campaignRef` (optional string) to prisma/schema.prisma
- [x] Run `npm run db:sync` after schema change
- [x] Campaign page: fetch active instance; use `instance.campaignRef` when `searchParams.ref` is absent
- [x] Dashboard "Begin the Journey" link: ensure it uses `/campaign` (ref will come from instance)

## Story Bridge Copy

- [x] EventCampaignEditor: add story bridge copy field (or document use of wakeUpContent)
- [x] Instance: add optional `storyBridgeCopy` if new field; otherwise use wakeUpContent
- [x] BB_Intro or BB_ShowUp: render story bridge copy when present

## 2-Minute Ride UX

- [x] BB nodes API: return step index (e.g. node order in BB flow)
- [x] CampaignReader: display progress indicator (e.g. "Step 3 of 8")
- [x] BB_Moves_ShowUp: add vibeulon payoff preview copy ("Complete this flow to earn 3 starter vibeulons")
- [x] BB_ShowUp: add optional donate link when instance has donate URL
- [x] CampaignReader: error recovery — retry + "Continue later" UI when fetch fails

## Verification Quest

- [x] Add `cert-two-minute-ride-v1` to seed-cyoa-certification-quests.ts
- [x] Steps: story bridge visible, Dashboard → BB flow, progress indicator, vibeulon preview, donation link, error recovery

## Backlog

- [x] Add AH to BACKLOG.md
- [x] Mark T superseded by fundraiser-landing-refactor
- [ ] Update bruised-banana-onboarding-flow Phase 3 with Phase 3.1 reference

## Verification

- [ ] Landing: Dashboard "Begin the Journey" shows BB flow (not Center_Witness)
- [ ] Event: story bridge copy editable and visible in CYOA
- [ ] Campaign: progress indicator displays
- [ ] Campaign: vibeulon preview before sign-up
- [ ] Campaign: donate link when configured
- [ ] `npm run seed:cert:cyoa` seeds cert-two-minute-ride-v1
