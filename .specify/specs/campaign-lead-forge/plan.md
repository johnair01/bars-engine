# Campaign Lead Forge — Implementation Plan

**Spec**: [spec.md](spec.md) · **Status**: Building MVP

## Phase 1 — Data + contracts
1.1 `prisma/schema.prisma`: add `model CampaignLead` (see spec) + back-relations on `Player`, `Invite`, `LatentAllyshipIntake`.
1.2 Migration: `npx prisma migrate dev --name add_campaign_lead` (fallback: hand-author `prisma/migrations/<ts>_add_campaign_lead/migration.sql` if no DB reachable) → `npm run db:generate`.
1.3 `src/lib/campaign-leads/types.ts` — `LeadStatus`, `LEAD_STATUSES`, `LeadSource`, `CampaignLeadRow`, status-transition guard.
1.4 `src/lib/campaign-leads/auth.ts` — `assertCampaignSteward(playerId, campaignRef)` generalized from `the-crossing-support.assertSteward` (resolve instance by `campaignRef`/`slug`, delegate to `assertCanEditInstanceDonation`; global admin passes).
1.5 `src/actions/campaign-leads.ts` — `createManualLead`, `submitAutomatedLead`, `listCampaignLeads`, `transitionLead` (zod-validated, `{ ok }` results).

## Phase 2 — Owner console
2.1 `src/app/admin/campaigns/[ref]/leads/page.tsx` — server: auth-gate via `assertCampaignSteward`; load leads + starter-quest pool; render board.
2.2 `LeadBoard.tsx` (client) — status filter chips, lead rows, transition controls (reuse STATUS_META style from The Crossing).
2.3 `ForgeLeadForm.tsx` (client) — name/contact/channel/domain/notes/actions(list)/starter-quest multi-select/message → `createManualLead`; show returned invite link with copy button.
2.4 Starter-quest pool query: `CustomBar` where `type IN ('onboarding','quest')`, `status:'active'`, `allyshipDomain != null` (mirror `starter-quests.ts`), scoped/filtered by chosen domain client-side.

## Phase 3 — Automated funnel
3.1 `src/lib/allyship-myths/myths.ts` — `ALLYSHIP_MYTHS: { id, myth, truth, reframe, domainHint? }[]` (~5, editable) + `getMythsForDomain(domain?)`.
3.2 `src/app/campaign/[ref]/begin/page.tsx` — public server shell (title/hero) rendering the runner.
3.3 `BeginFunnel.tsx` (client) — step machine: `intro → superpower → myths → domain → offers → create`. Reuse `SuperpowerQuiz` for the superpower step (capture outcome via a completion callback / lightweight fork), `AllyshipMyths` cards, domain buttons (`ALLYSHIP_DOMAINS`), offered quests from a passed-in pool, and a "Create your character" CTA.
3.4 On finish → `submitAutomatedLead` (+ optional `LatentAllyshipIntake` create); success screen links to `/character/create?ref=…&superpower=…&domain=…`.

## Phase 4 — Verify + commit
4.1 `npm run check` (lint+types), `npm run build`.
4.2 Commit on `claude/dazzling-wright-d19dkh`, push `-u origin`.

## File impact
| Area | Files |
|------|-------|
| Schema | `prisma/schema.prisma`, `prisma/migrations/*` |
| Lib | `src/lib/campaign-leads/{types,auth}.ts`, `src/lib/allyship-myths/myths.ts` |
| Actions | `src/actions/campaign-leads.ts` |
| Owner UI | `src/app/admin/campaigns/[ref]/leads/{page,LeadBoard,ForgeLeadForm}.tsx` |
| Funnel UI | `src/app/campaign/[ref]/begin/{page,BeginFunnel,AllyshipMyths}.tsx` |

## Risks
- **No DB in ephemeral container** → `migrate dev` may fail. Fallback: hand-author additive `migration.sql` + `prisma generate` so the build compiles; run `migrate deploy` in a DB-connected env.
- **SuperpowerQuiz reuse**: it currently renders its own reveal + calls `submitSuperpowerIntake`. For the funnel we need the *outcome* to advance. MVP: add an optional `onComplete(outcome)` prop (additive, default no-op) so the existing `/superpower` page is unaffected.
- Large model count in schema — keep `CampaignLead` minimal, additive, well-indexed.
