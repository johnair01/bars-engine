# Tasks: Creator Milestone Interview

## Spec kit
- [x] `spec.md`
- [x] `plan.md`
- [x] `tasks.md`
- [ ] Register in `.specify/backlog/BACKLOG.md` (row CMI, priority 1.63)
- [ ] Run `npm run backlog:seed`

## CMI-1: Schema + Migration

- [ ] Add `MilestoneInterviewTemplate` + `CampaignMilestone` to `prisma/schema.prisma`
- [ ] Run `npx prisma migrate dev --name add_milestone_interview_schema`
- [ ] Commit `prisma/migrations/[ts]_add_milestone_interview_schema/` with `schema.prisma`
- [ ] Run `npm run db:sync` — verify Prisma client regenerates
- [ ] Run `npm run check` — 0 errors

## CMI-2: Server Actions + BAR Generator

- [ ] Create `src/lib/milestone-interview/generate-bars.ts` — `generateBarsFromAnswers(answers, archetypeKey): BarSeed[]`
- [ ] Create `src/actions/milestone-interview.ts`:
  - [ ] `getMilestoneInterviewTemplate(campaignArchetype)`
  - [ ] `createMilestoneInterview(input)` — seeds BARs + creates/upserts `CampaignMilestone`
  - [ ] `retakeMilestoneInterview(input)` — additive, increments `retakeCount`
  - [ ] `getMilestoneInterviewTemplates()` (admin)
  - [ ] `upsertMilestoneInterviewTemplate(input)` (admin)
- [ ] Unit test: `createMilestoneInterview` with 3 answers seeds ≥1 BAR

## CMI-3: Interview Wizard UI

- [ ] Create `src/app/campaign/[campaignRef]/interview/page.tsx` — server component, fetches template
- [ ] Create `src/app/campaign/[campaignRef]/interview/InterviewWizard.tsx` — client step wizard:
  - [ ] Progress bar (`Step N of M`)
  - [ ] Back navigation
  - [ ] Session storage preserve on anonymous access
  - [ ] Completion screen: seeded BARs list + "Continue to campaign hub →" CTA
- [ ] Test: complete wizard end-to-end → `CampaignMilestone` created + BARs seeded

## CMI-4: Admin Template Editor

- [ ] Create `src/app/admin/interview-templates/page.tsx` — list templates with archetype key + status
- [ ] Create `src/app/admin/interview-templates/[archetypeKey]/page.tsx` — edit view:
  - [ ] Add/remove/reorder questions
  - [ ] Select-type question option editor
  - [ ] Publish/unpublish toggle
- [ ] Verify admin can create + edit a template; changes reflected in wizard

## CMI-5: Seed + Verification

- [ ] Create `scripts/seed-milestone-interview-templates.ts` — seeds default templates
- [ ] Add `npm run seed:milestone-interview-templates` to `package.json`
- [ ] Seed certification quest `cert-creator-milestone-interview-v1` (Twine + `CustomBar`)
- [ ] Add `npm run seed:cert:creator-milestone-interview` to `package.json`

## Verification

- [ ] `npm run build` passes
- [ ] `npm run check` passes (0 TypeScript errors)
- [ ] Full wizard flow: load → answer → submit → BARs seeded → completion screen
- [ ] Retake: prior BARs persist, new BARs added
- [ ] Admin: create template → publish → visible in wizard
