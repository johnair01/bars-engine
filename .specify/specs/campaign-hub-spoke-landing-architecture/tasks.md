# Tasks: Campaign hub → spoke → landing (card) architecture

## Spec kit

- [x] `spec.md`
- [x] `plan.md`
- [x] `tasks.md`
- [x] Cross-link from `campaign-kotter-domains/spec.md` and `campaign-domain-decks/spec.md` (Related specs)
- [x] Register in `.specify/backlog/BACKLOG.md` (row CHS)
- [x] Register **BB-APR26** (1.16.2) for Apr 4–5 ops/QA/comms — [TEST_PLAN_PARTY_AND_INTAKE.md](./TEST_PLAN_PARTY_AND_INTAKE.md) §7 + [prompt](../../backlog/prompts/bb-apr-2026-party-ops.md)
- [x] Optional: one-pager in `docs/` or `FOUNDATIONS.md` pointer — see [FOUNDATIONS.md](../../../FOUNDATIONS.md) § Campaign hub, spokes, and landings

## Decisions → schema

- [x] Persist hub draw on `Instance.campaignHubState` (v1 JSON: 8 spokes × hexagram + changing lines + face); invalidate when `kotterStage` changes — migration `20260318140000_add_instance_campaign_hub_state`
- [ ] Campaign **deck topology** enum: `BAR52` | `CAMPAIGN64` (names TBD) + creator UX
- [x] **Alchemy trace** storage decision (JSON vs table) + privacy defaults — [CHS_RUNTIME_DECISIONS.md](./CHS_RUNTIME_DECISIONS.md) § Alchemy trace (v1 JSON on `storyProgress.state`)
- [x] **CYOA persistence:** choose **session-only (A)** vs **checkpoint + revalidate (B)** vs **snapshot-gated resume (C)**; document in CYOA runner — [CHS_RUNTIME_DECISIONS.md](./CHS_RUNTIME_DECISIONS.md) § CYOA progress persistence (portal = B-lite; target B)

## CYOA inventory (critical)

- [x] **Template index** doc: template id → spoke pattern → emissions (BAR types, quest stubs) → vault slots consumed — starter matrix [TEMPLATE_INDEX.md](./TEMPLATE_INDEX.md)
- [x] **Vault gate:** **hard block** + **modal compost** mini-game ([vault-compost-minigame-modal](../vault-compost-minigame-modal/spec.md) stub → full spec)
- [x] Epiphany-bridge **minimum viable** graph: parameterized by `spokeIndex`, `hexagramId`, `periodTheme` — CYOA_SPOKE generator + cache key (`::s{spokeIndex}`) + `launchSpokeAdventure` portal context

## Creator

- [ ] Milestone **interview** flow spec (mirror 321 patterns); persist milestones on campaign
- [ ] Period advance + **single cast** pipeline; assign spoke order; audit log

## Runtime

- [x] Hub UI: `/campaign/hub` — 8 spokes → CYOA + link to landing card; `/campaign/lobby` redirects here
- [x] Landing page: `/campaign/landing?ref=&spoke=0..7` — card copy + BB quest map when `bruised-banana`; hexagram context; roster placeholder
- [x] Wire **emotional alchemy** from CYOA context into quest/BAR generation (`emotionalAlchemy` continuity) — hub journey fields on `storyProgress.state` + `pickGmLensFromStoryState` (`lens` → `hub_portal_face` → `active_face`)

## Event invite BAR + JSON CYOA (MVP)

- [x] Public `/invite/[barId]` + `type: event_invite` + `storyContent` JSON — see [EVENT_INVITE_BAR_CYOA_MVP.md](./EVENT_INVITE_BAR_CYOA_MVP.md)
- [x] `npm run seed:event-invite-bar` → `/invite/bb-event-invite-apr26`

## Apr 2026 residency — ops & QA (BACKLOG **BB-APR26** / 1.16.2) — **[x] Done**

Source of truth for steps: [TEST_PLAN_PARTY_AND_INTAKE.md](./TEST_PLAN_PARTY_AND_INTAKE.md) §7.

- [x] **BB26-1** §1 preconditions on target env (migrate, BB `campaignRef`, `seed:portal-adventure`, logged-in hub open)
- [x] **BB26-2** §2 Sage playtest (~25 min); §6 incognito smoke: `/event`, `/invite/bb-event-invite-apr26`, `/campaign/hub?ref=bruised-banana`
- [x] **BB26-3** Portal / Twine copy pass (party vs collaborator tone) — §3
- [x] **BB26-4** Partiful Apr 4 EOD PT: Event 1 live + `/event` linked in description/confirmation
- [x] **BB26-5** Partiful Apr 5 EOD PT: Event 2 live + `/event#apr-5` (+ optional invite BAR link)
- [ ] **BB26-6** *(Optional)* `sage_consult` tone pass on invite copy (see STRAND_CONSULT_BRUISED_BANANA.md)

## Verification

- [ ] `npm run check` (repo-wide; fix CHS-touched paths on failure)
- [x] Playtest script: full vault → attempt spoke → expect gate — [PLAYTEST_VAULT_GATE.md](./PLAYTEST_VAULT_GATE.md)
