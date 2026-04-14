# Plan: Campaign Self-Serve (CSS)

## Goal

Ship L1 (wizard) + L2 (skinning) together. BB backfilled as reference. L3 schema-ready.

## Phases

### Phase 1 — Schema + Migration (no UI)

- Add `CampaignTheme` model to Prisma schema
- Add self-serve fields to Instance (`selfServeStatus`, `selfServeCreatedBy`, `selfServeApprovedBy`, `questTemplateConfig`, `inviteConfig`)
- Migration: `20260404_campaign_self_serve`
- Extend `getCampaignSkin()` to check DB (`CampaignTheme`) before code-defined skins
- Backfill BB: write migration/seed that populates `CampaignTheme` for BB instance with current hardcoded values

### Phase 2 — Server Actions (API layer)

- `createCampaignDraft` — creates Instance in draft state, validates Steward+ permission
- `configureCampaignQuest` — instantiates quest from template with overrides
- `configureCampaignTheme` — upserts CampaignTheme row
- `submitCampaignForApproval` — transitions draft → pending_approval
- `approveCampaign` — admin transitions pending_approval → active
- `getCampaignSkinFromDb` — DB-first lookup, code fallback
- All actions follow existing patterns (cookie auth, revalidatePath, Zod validation)

### Phase 3 — L1 Wizard UI

- `/campaign/create` — step wizard (5 steps)
- Step 1: Name & purpose (name, description, domain dropdown)
- Step 2: Story (Wake Up + Show Up textarea)
- Step 3: Quest template picker + customizer (select type, edit copy)
- Step 4: Invite config (capacity, welcome message)
- Step 5: Review + submit for approval
- Reuse character-creator step wizard pattern
- Permission gate: redirect non-Steward+ to `/` with message

### Phase 4 — Admin Approval UI

- `/admin/campaigns` — list of draft/pending campaigns
- Review view: preview campaign page as it would render
- Approve / reject buttons
- Rejection includes optional feedback message

### Phase 5 — L2 Skinning UI

- `/campaign/[ref]/settings` — campaign owner settings page
- Color pickers for bg gradient, 3 accent colors
- Font selector (dropdown of approved fonts)
- Image upload for poster/banner
- Live preview panel
- Saves to `CampaignTheme` via `configureCampaignTheme`

### Phase 6 — BB Backfill + Integration

- Migrate BB's hardcoded skin values into `CampaignTheme` DB row
- Update `getCampaignSkin()` to read from DB first
- Verify BB event page renders identically after migration
- Remove hardcoded BB skin from `campaign-skin.ts` (DB is now source of truth)
- Update `/event` page to use DB-driven skin

### Phase 7 — Polish + Verification

- Verification quest: `cert-campaign-self-serve-v1`
- End-to-end test: create → approve → visit → invite → play
- Mobile responsiveness on wizard and settings
- Error handling on all server actions
- `npm run check` + `npm run build`

## File Impacts

| Area | Files |
|------|-------|
| Schema | `prisma/schema.prisma` (CampaignTheme + Instance fields) |
| Migration | `prisma/migrations/20260404_campaign_self_serve/` |
| Actions | `src/actions/campaign-self-serve.ts` (new) |
| Skin | `src/lib/ui/campaign-skin.ts` (extend with DB lookup) |
| Wizard | `src/app/campaign/create/` (new — 5-step wizard) |
| Admin | `src/app/admin/campaigns/` (new — approval UI) |
| Settings | `src/app/campaign/[ref]/settings/` (new — L2 skinning) |
| BB seed | `prisma/migrations/...backfill_bb_theme/` or seed script |

## Success Criteria

- Steward creates campaign without developer help
- Admin approves in one click
- Player completes full loop (discover → join → play)
- BB is indistinguishable from before, but now DB-driven
- New campaign with custom skin renders correctly
- L3 fields exist in schema but have no UI
