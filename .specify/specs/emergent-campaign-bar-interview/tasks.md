# Tasks: Emergent campaign from BAR interview

## Phase 0 — Alignment

- [ ] **ECI-0.1** Read [CSC](../campaign-subcampaigns/spec.md) + [CHS](../campaign-hub-spoke-landing-architecture/spec.md) § conceptual stack; write **one paragraph** in `plan.md` § “Child campaign shape” with agreed **parentRef** / **childRef** example (`bruised-banana` → `support-thunder-<slug>`).
- [ ] **ECI-0.2** Confirm **intake carrier**: `event_invite` BAR vs new type; document in `spec.md` Design decisions if changed.

## Phase A — Latent intake + interview

- [x] **ECI-A.1** Prisma: `LatentAllyshipIntake` + `pathJson`, `status`, FK `customBarId`, optional `playerId` / `clientSessionId`; migration `20260327230000_latent_allyship_intake`.
- [x] **ECI-A.2** Server action: `submitAllyshipIntake` — validates bar + stores path JSON; `listAllyshipIntakesForCampaignRef` for stewards.
- [x] **ECI-A.3** Steward UI: `/admin/allyship-intakes?ref=` — lists intakes for `campaignRef` (admin or owner/steward).
- [x] **ECI-A.4a** **Thunder v1** `EventInviteStory` JSON + apply CLI: [`allyship-intake-thunder.template.json`](../../../src/lib/event-invite-story/templates/allyship-intake-thunder.template.json), `npx tsx scripts/apply-invite-template.ts --template=allyship-thunder`, runbook [`docs/runbooks/EMERGENT_ALLYSHIP_INTAKE_OPS.md`](../../../docs/runbooks/EMERGENT_ALLYSHIP_INTAKE_OPS.md).
- [ ] **ECI-A.4b** Optional idempotent **seed script** for dev/staging BAR + link from runbook appendix.
- [ ] **ECI-A.5** `npm run db:sync` / `npm run check` after schema.

## Phase B — Water → spawn

- [x] **ECI-B.1** Server action: `waterAllyshipIntake` — transaction: mark watered, create **child** Instance/campaign per CSC, set `campaignRef`.
- [x] **ECI-B.2** Seed or configure **hub + 8 spokes**; bind **period 1** to **Create Urgency** (Kotter) — copy pack + `campaignHubState` / deck hooks per CHS tasks.
- [x] **ECI-B.3** Redirect / success UI: **Open hub** CTA with `?ref=<child>`.

## Phase C — Parent bridge + support

- [ ] **ECI-C.1** Child **hub** (and invite follow-up page): **parent residency** strip — link to BB hub + short copy (COC).
- [ ] **ECI-C.2** **Donate** / wizard: child `ref` + **parent** fundraiser visibility per [CSD](../campaign-scoped-donation-cta/spec.md) / DSW.

## Phase D — Slots + pool + in-app

- [ ] **ECI-D.1** Entry route for **in-app** same interview under logged-in **parent** context.
- [ ] **ECI-D.2** **Slot** gate + **proposal** record; steward **approve** → **BAR** or **quest** seed into **CMS** pool (coordinate with [CMS](../campaign-marketplace-slots/spec.md) tasks).

## Verification quest

- [ ] **ECI-V.1** Twine / cert story `cert-emergent-campaign-bar-interview-v1` + `npm run seed:cert:emergent-campaign-bar-interview` (follow [cyoa-certification-quests](../cyoa-certification-quests/spec.md) pattern).

## Doc hygiene

- [ ] **ECI-DOC.1** Add backlog prompt under `.specify/backlog/prompts/emergent-campaign-bar-interview.md` (optional) when kicking implementation to an agent.
