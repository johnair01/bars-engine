# Tasks: Demo Orientation Preview

## Schema

- [x] **T1** Add `DemoOrientationLink` model (token, publicSlug, adventureId, startNodeId, campaignRef, instanceId, inviteId, maxSteps, endNodeId, expiresAt, revokedAt, label)
- [x] **T2** Migration `20260318150000_demo_orientation_preview` — run `prisma migrate deploy` (prod) / `migrate dev` locally

## Core

- [x] **T3** `resolveDemoOrientationLink` — `src/lib/demo-orientation/resolve.ts`
- [x] **T4** Route `/demo/orientation` + `not-found` for bad token/slug
- [x] **T5** `CampaignReader` + `demoHandoff` (step cap, end node, signup JSON handoff)
- [x] **T6** Demo: privileged server actions not invoked from reader; signup uses `CampaignAuthForm` + `campaignState` (see spec)

## Handoff

- [x] **T7** `campaignState` includes `demoOrientationToken`, `ref`, `inviteId` for signup
- [x] **T8** “Preview complete” panel + donate/home links

## Ops

- [x] **T9** `npm run seed:demo-orientation` — `scripts/seed-demo-orientation-link.ts`
- [ ] **T10** Rate limit on token resolve (middleware or edge) — optional follow-up

## Verification

- [ ] **T11** Manual: incognito `/demo/orientation?...` → preview → signup
- [ ] **T12** `npm run build` + `npm run check` after DB migration applied
- [x] **T13** Fix mid-preview 404: API requires `slug=bruised-banana` for BB graph — `resolve` + seed prefer that adventure
