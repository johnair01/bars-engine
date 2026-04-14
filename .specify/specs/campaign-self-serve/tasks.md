# Tasks: Campaign Self-Serve (CSS)

## CSS-1 — Schema + Migration

- [ ] **CSS-1.1** Add `CampaignTheme` model to `prisma/schema.prisma` (id, instanceId, bgGradient, titleColor, accentPrimary, accentSecondary, accentTertiary, fontDisplayKey, posterImageUrl, narrativeConfig JSON, timestamps)
- [ ] **CSS-1.2** Add self-serve fields to Instance model: `selfServeStatus`, `selfServeCreatedBy`, `selfServeApprovedBy`, `questTemplateConfig` (Json), `inviteConfig` (Json)
- [ ] **CSS-1.3** Create migration: `npx prisma migrate dev --name campaign_self_serve`
- [ ] **CSS-1.4** `npm run db:generate` — verify Prisma Client regenerates cleanly
- [ ] **CSS-1.5** `npm run check` passes

## CSS-2 — Server Actions

- [ ] **CSS-2.1** Create `src/actions/campaign-self-serve.ts` with Zod schemas for all inputs
- [ ] **CSS-2.2** Implement `createCampaignDraft(instanceId, name, description, domain, wakeUp, showUp)` — validates Steward+ permission, creates Instance child or updates fields, sets status=draft
- [ ] **CSS-2.3** Implement `configureCampaignQuest(instanceId, templateType, overrides)` — instantiates quest from template, stores in `questTemplateConfig`
- [ ] **CSS-2.4** Implement `configureCampaignTheme(instanceId, themeData)` — upserts `CampaignTheme` row
- [ ] **CSS-2.5** Implement `submitCampaignForApproval(instanceId)` — transitions draft → pending_approval
- [ ] **CSS-2.6** Implement `approveCampaign(instanceId)` — admin-only, transitions → active
- [ ] **CSS-2.7** Implement `rejectCampaign(instanceId, feedback?)` — admin-only, transitions → draft with feedback
- [ ] **CSS-2.8** Extend `getCampaignSkin()` to check `CampaignTheme` DB row before code-defined fallback
- [ ] **CSS-2.9** `npm run check` passes

## CSS-3 — L1 Wizard UI

- [ ] **CSS-3.1** Create `/campaign/create/page.tsx` — permission gate (Steward+ only)
- [ ] **CSS-3.2** Create `CampaignWizard.tsx` client component — 5-step state machine
- [ ] **CSS-3.3** Step 1: Name & purpose — name input, description textarea, domain dropdown (4 allyship domains)
- [ ] **CSS-3.4** Step 2: Story — Wake Up content + Show Up content textareas with placeholder defaults
- [ ] **CSS-3.5** Step 3: Quest template — template picker (orientation CYOA, invite bingo, check-in, 321 shadow) + customize copy panel
- [ ] **CSS-3.6** Step 4: Invite config — capacity input, welcome message textarea
- [ ] **CSS-3.7** Step 5: Review — preview card showing all choices, submit button
- [ ] **CSS-3.8** Wire wizard to server actions (createCampaignDraft → configureCampaignQuest → submitCampaignForApproval)
- [ ] **CSS-3.9** Success state: "Campaign submitted for approval" + link to preview
- [ ] **CSS-3.10** Mobile-responsive, follows character-creator step wizard pattern
- [ ] **CSS-3.11** `npm run check` + `npm run build` passes

## CSS-4 — Admin Approval UI

- [ ] **CSS-4.1** Create `/admin/campaigns/page.tsx` — list view of all campaigns by status (pending, active, draft, archived)
- [ ] **CSS-4.2** Create `/admin/campaigns/[id]/page.tsx` — detail view with campaign preview
- [ ] **CSS-4.3** Approve button — calls `approveCampaign`, redirects to list
- [ ] **CSS-4.4** Reject button — optional feedback textarea, calls `rejectCampaign`
- [ ] **CSS-4.5** Add "Campaigns" link to admin navigation
- [ ] **CSS-4.6** `npm run check` passes

## CSS-5 — L2 Skinning UI

- [ ] **CSS-5.1** Create `/campaign/[ref]/settings/page.tsx` — campaign owner only
- [ ] **CSS-5.2** Color pickers for: bgGradient start/end, accentPrimary, accentSecondary, accentTertiary
- [ ] **CSS-5.3** Font selector dropdown (Press Start 2P, Silkscreen, Geist Mono, system default)
- [ ] **CSS-5.4** Image upload for poster/banner (save to `/public/images/campaigns/[ref]/`)
- [ ] **CSS-5.5** Live preview panel — renders a mini campaign page card with current settings
- [ ] **CSS-5.6** Save button → `configureCampaignTheme` server action
- [ ] **CSS-5.7** `npm run check` + `npm run build` passes

## CSS-6 — BB Backfill

- [ ] **CSS-6.1** Write seed/migration to create `CampaignTheme` row for BB instance with current hardcoded values from `BRUISED_BANANA_SKIN`
- [ ] **CSS-6.2** Populate BB Instance self-serve fields (status=active, createdBy=admin, questTemplateConfig from existing setup)
- [ ] **CSS-6.3** Update `getCampaignSkin()` — DB lookup first, code fallback second
- [ ] **CSS-6.4** Verify BB `/event` page renders identically after migration
- [ ] **CSS-6.5** Remove hardcoded `BRUISED_BANANA_SKIN` from `campaign-skin.ts` — DB is source of truth
- [ ] **CSS-6.6** `npm run check` + `npm run build` passes

## CSS-7 — Polish + Verification

- [ ] **CSS-7.1** Create verification quest: `cert-campaign-self-serve-v1`
- [ ] **CSS-7.2** End-to-end manual test: Steward creates → admin approves → player visits → joins → plays first quest
- [ ] **CSS-7.3** Mobile responsiveness audit on wizard + settings + campaign page
- [ ] **CSS-7.4** Error handling: all server actions return structured errors, wizard shows inline validation
- [ ] **CSS-7.5** Link wizard from dashboard action buttons and admin nav
- [ ] **CSS-7.6** Update wiki `/wiki/rules` page to reference campaign creation
- [ ] **CSS-7.7** `npm run check` + `npm run build` passes
- [ ] **CSS-7.8** PR with reviewer-friendly summary

## CSS-8 — Ship

- [ ] **CSS-8.1** Final `npm run check` + `npm run build`
- [ ] **CSS-8.2** Human summary (what / why / how to try) for PR
- [ ] **CSS-8.3** QA checklist as PR comment or GitHub issue
