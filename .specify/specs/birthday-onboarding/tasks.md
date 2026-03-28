# Tasks: Birthday Onboarding

## Spec kit
- [x] `spec.md`
- [x] `plan.md`
- [x] `tasks.md`
- [ ] Register in `.specify/backlog/BACKLOG.md` (row BO, priority 1.68)
- [ ] Run `npm run backlog:seed`

## BO-1: Schema + Migration

- [ ] Extend `Instance` in `prisma/schema.prisma`: add `vibeData String?`, `goalData String?`, `sourceInstanceId String?`
- [ ] Add `instanceId String?` FK to `Nation` + `Archetype`
- [ ] Add `InstanceExportRequest` model (`id`, `instanceId`, `requestedByPlayerId`, `status`, `configBundle?`, `requestedAt`, `resolvedAt?`)
- [ ] Run `npx prisma migrate dev --name add_birthday_onboarding`
- [ ] Commit migration + schema
- [ ] Run `npm run db:sync` + `npm run check`

## BO-2: Actions + AI Generators

- [ ] Create `src/lib/birthday-onboarding/generate-instance-bars.ts` — `generateInstanceBars(vibeData, goalData): DraftBar[]` via `gpt-4o-mini`
- [ ] Create `src/lib/birthday-onboarding/generate-guest-content.ts` — `generateNationContent`, `generateArchetypeContent`
- [ ] Create `src/actions/birthday-onboarding.ts`:
  - [ ] `createInstance(input)` — creates `Instance` + calls AI to generate 3-5 draft `CustomBar` records + returns invite link
  - [ ] `onboardGuest(input)` — creates `Player` + instance-scoped `Nation` + `Archetype` + assigns personal BARs
  - [ ] `claimForkBar(instanceId)` — creates `InstanceExportRequest(status: 'pending')`
  - [ ] `approveExportRequest(exportRequestId)` — generates config JSON bundle (no player data), sets `configBundle` + `resolvedAt`
  - [ ] `exportNationToGlobal(nationId)` — sets `nation.instanceId = null`
- [ ] Add `copyInstance(instanceId)` to `src/actions/instances.ts` — config-only copy with `sourceInstanceId`

## BO-3: Game Lobby (`/lobby`)

- [ ] Create `src/app/lobby/layout.tsx` — gate: `admin` role AND `ENABLE_LOBBY=true`; redirect to `/` if either missing
- [ ] Create `src/app/lobby/page.tsx` — list instances with player count, status, pending export requests
- [ ] Wire "Copy + reset" button → `copyInstance`
- [ ] Wire "Approve export" button → `approveExportRequest`; show download link

## BO-4: Instance Creation Wizard (`/lobby/new`)

- [ ] Create `src/app/lobby/new/page.tsx`
- [ ] Create `src/app/lobby/new/InstanceCreationWizard.tsx` — 3-step wizard:
  - Step 1: Vibe interview (`birthdayPersonName`, `vibeWords`, `desiredFeeling`, `energyLevel`)
  - Step 2: Campaign goals (`primaryGoal`, `secondaryGoals`, `domainType`, `campaignDuration`)
  - Step 3: Review + create → call `createInstance` → show invite link
- [ ] Test: submit wizard → `Instance` created + 3-5 draft `CustomBar` records in DB

## BO-5: Guest Onboarding (`/join/[instanceSlug]`)

- [ ] Create `src/app/join/[instanceSlug]/page.tsx` — load instance or 404
- [ ] Create `src/app/join/[instanceSlug]/GuestOnboardingWizard.tsx` — 4-step wizard:
  - Step 1: Vibe check
  - Step 2: Custom nation (AI-assisted description)
  - Step 3: Custom archetype (AI-assisted description + moves)
  - Step 4: Confirmation — show nation, archetype, personal BARs; link to dashboard
- [ ] Test: complete wizard → `Nation` + `Archetype` created with `instanceId`; BARs assigned

## BO-6: Fork This Game BAR + Wiki

- [ ] Create `scripts/seed-fork-bar.ts` — seeds "Fork This Game" BAR in global quest library
- [ ] Add `npm run seed:fork-bar` to `package.json`
- [ ] Wire BAR claim → `claimForkBar(instanceId)` → `InstanceExportRequest` created
- [ ] Create `src/app/wiki/fork-your-instance/page.tsx` — 5 sections: prerequisites, fork repo, env vars, deploy, import config
- [ ] Create `src/app/fork-wizard/page.tsx` — 5-step in-game wizard with checkboxes + config import field

## BO-7: Certification Quest

- [ ] Seed `cert-birthday-onboarding-v1` Twine + `CustomBar`
- [ ] Add `npm run seed:cert:birthday-onboarding` to `package.json`

## Verification

- [ ] `npm run build` passes
- [ ] `npm run check` passes (0 TypeScript errors)
- [ ] Set `ENABLE_LOBBY=true`; navigate to `/lobby` as admin — instance list loads
- [ ] Run Instance Creation Wizard — Instance + 3-5 draft BARs created
- [ ] Navigate to `/join/[slug]` — complete 4-step onboarding — custom nation + archetype created with `instanceId`
- [ ] Claim "Fork This Game" BAR — `InstanceExportRequest` appears in `/lobby`
- [ ] Approve export → config JSON download link appears (no player data in bundle)
- [ ] Navigate to `/wiki/fork-your-instance` — all 5 sections render
- [ ] Non-admin user navigating to `/lobby` → redirected to `/`
