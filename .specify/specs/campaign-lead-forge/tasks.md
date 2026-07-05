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

## Phase 5 — Warm invite path (invited person's experience) ✅
Closes the "dead wire": a forged lead's matched tasks are now actually assigned, and
the invitee gets a personalized orientation CYOA (the friendcraft-style ask).
- [x] 5.1 `src/lib/campaign-leads/claim.ts` — `claimCampaignLeadForPlayer(inviteId, playerId)`:
      assigns each matched starter quest as a `PlayerQuest` + marks the lead `onboarded`.
- [x] 5.2 Hook into `createCharacter` (`src/actions/conclave.ts`, best-effort, non-fatal).
- [x] 5.3 `src/lib/campaign-leads/orientation.ts` — editable "how the system works" cards.
- [x] 5.4 `/invite/[token]/welcome` — personalized CYOA: welcome → orientation → "how you're
      helping" (the owner's matched actions + starter quests) → claim (reuses `InviteSignupForm`).
      Falls back to `/invite/[token]` when the invite has no linked lead.
- [x] 5.5 `createManualLead` now returns the `/invite/[token]/welcome` link.
- NOTE: This is the warm on-ramp (owner invites a specific person, pre-loads their tasks);
  `/campaign/[ref]/begin` remains the cold, self-serve on-ramp. Same destination.

## Phase 6 — Warm Roster + per-lead workspace (v2, decisions locked)
- [x] 6.1 Add `goals` + `collective` (Boolean) to `CampaignLead`; migration
- [x] 6.2 Roster view — board reframed as "your list" + prominent Add-a-lead
- [x] 6.3 `/campaign/[ref]/leads/[leadId]` lead detail — goals, quest add/reorder/remove, copy link, preview
- [x] 6.4 `setLeadGoals`, `addLeadQuest`, `reorderLeadQuests`, `removeLeadQuest` actions (steward-gated)
- [x] 6.5 `publishLeadToCollective` / `unpublishLead` + shared directory read for other stewards

## Phase 7 — Quest Studio (AI, aligned to myth × superpower × face) (v2, decisions A–D locked)
Decisions: A face-only (stage auto from campaign Kotter stage) · B explicit CustomBar columns
(`gmFace`, `superpowerAffinity`, `mythId`) · C AI draft default (deterministic fallback) · D steward+.
- [x] 7.1 `/campaign/[ref]/quests/new` composer + `/quests` library (+ the-crossing shims, basePath-threaded)
- [x] 7.2 Alignment selectors (domain, myth, superpower+orientation, GM face) + `gmFace`/`superpowerAffinity`/`mythId` columns; migration
- [x] 7.3 `src/lib/campaign-leads/quest-alignment.ts` (pure compose+assemble) + `quest-alignment-ai.ts` (AI draft, env-guarded, fails safe)
- [x] 7.4 `myth → quest` bridge via `composeAlignmentSeed` (pulls `myth.reframe`); actions in `src/actions/quest-studio.ts`
- [x] 7.5 Saved quests (type 'quest', active) join the campaign pool; Phase 6 workspace "Author new…" → composer `?forLead=`
- NOTE: AI behind `QUEST_STUDIO_AI_ENABLED` + `OPENAI_API_KEY`; the invitee path stays AI-free. AI path
  not exercisable in this container (no key) — deterministic assemble is proven; AI code path is house-pattern.

## Branching invitee CYOA — separate spec + feasibility
- [ ] B.1 `.specify/specs/lead-branching-cyoa/` — spec + feasibility (Adventure/Passage engine, anonymous-play blocker)

## Follow-ups (Phase 4 / backlog)
- Run `npx prisma migrate deploy` in a DB-connected env to apply `20260702000000_add_campaign_lead`.
- Deep-wire create-character to `characterCreationPacket` with prefilled superpower + domain (FR12).
- Write linked `LatentAllyshipIntake` on funnel completion (3.4 deferred piece).

## Verification
- [ ] `cert-campaign-lead-forge-v1` steps pass (forge manual lead → link → board; run funnel → automated lead on board)
