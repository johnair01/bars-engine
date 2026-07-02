# Tasks: Campaign Lead Forge

## Phase 1 — Data + contracts
- [x] 1.1 Add `model CampaignLead` + back-relations (`Player`, `Invite`, `LatentAllyshipIntake`) to `prisma/schema.prisma`
- [x] 1.2 Create migration `add_campaign_lead` (or hand-author additive `migration.sql`); `npm run db:generate`
- [x] 1.3 `src/lib/campaign-leads/types.ts` — statuses, source, row type, transition guard
- [x] 1.4 `src/lib/campaign-leads/auth.ts` — `assertCampaignSteward(playerId, campaignRef)`
- [x] 1.5 `src/actions/campaign-leads.ts` — createManualLead, submitAutomatedLead, listCampaignLeads, transitionLead

## Phase 2 — Owner console
- [x] 2.1 `/campaign/[ref]/leads/page.tsx` (steward-gated server component) + `the-crossing/steward/leads` shim
      NOTE: moved OFF `/admin/*` — that layout hard-gates GLOBAL admins, but this tool is for campaign
      owners/stewards (who may not be global admins), mirroring The Crossing's `/campaign/.../steward` path.
- [x] 2.2 `LeadBoard.tsx` — filters + rows + transition controls
- [x] 2.3 `ForgeLeadForm.tsx` — manual lead authoring + invite-link result
- [x] 2.4 Starter-quest pool query + domain filter

## Phase 3 — Automated funnel
- [x] 3.1 `src/lib/allyship-myths/myths.ts` — content + `getMythsForDomain`
- [x] 3.2 `/campaign/[ref]/begin/page.tsx` — public shell
- [x] 3.3 `BeginFunnel.tsx` + `AllyshipMyths.tsx` — step machine; reuse SuperpowerQuiz via `onComplete`
- [x] 3.4 Finish → `submitAutomatedLead`; create-character handoff link (`/character/create?ref&superpower&domain`)
      DEFERRED: writing a linked `LatentAllyshipIntake` on funnel completion (schema FK is in place; wire in Phase 4).

## Phase 4 — Verify + commit
- [x] 4.1 tsc `--noEmit` (0 errors), eslint (clean), `verify:build-reliability` (pass), `validate:routes`
      (my files add 0 errors; 8 pre-existing). Full `npm run build` NOT run here — heavy custom steps +
      no DB/engine in the ephemeral container; run in a DB-connected env.
- [ ] 4.2 Commit + push to `claude/dazzling-wright-d19dkh`

## Follow-ups (Phase 4 / backlog)
- Run `npx prisma migrate deploy` in a DB-connected env to apply `20260702000000_add_campaign_lead`.
- Deep-wire create-character to `characterCreationPacket` with prefilled superpower + domain (FR12).
- Write linked `LatentAllyshipIntake` on funnel completion (3.4 deferred piece).

## Verification
- [ ] `cert-campaign-lead-forge-v1` steps pass (forge manual lead → link → board; run funnel → automated lead on board)
