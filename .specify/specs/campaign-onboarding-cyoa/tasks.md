# Tasks: Campaign onboarding CYOA (unified)

## Phase A — Ontology + alignment

- [ ] **A1** Confirm ontology paragraph with stakeholders; add **runbook** snippet (`docs/runbooks/` or `ADMIN_STEWARDSHIP`) — campaigns, onboarding, invites = CYOA.
- [ ] **A2** Resolve **steward/owner/admin** edit matrix for **invite** vs **campaign** (may differ); update [spec.md](./spec.md) Open Questions.
- [ ] **A3** Align `playerCanEditEventInviteBar` + Vault UI labels with **A2**.

## Phase B–D — Event-invite builder (first ship)

- [ ] **B1** `EventInviteStory` ↔ builder round-trip + tests.
- [ ] **B2** `EventInviteStoryBuilder` + preview (`EventInviteStoryReader`).
- [ ] **B3** Replace default JSON in `EventInviteBarContentEditor`; optional Advanced JSON.
- [ ] **B4** Static prompt template(s).
- [ ] **B5** [event-invite-inline-editing](../event-invite-inline-editing/spec.md): ensure **See also** points to [campaign-onboarding-cyoa](./spec.md).

## Phase E — Campaign CYOA (shared LEGO patterns)

- [ ] **E1** Decide which **adventure(s)** host campaign onboarding per instance/campaignRef.
- [ ] **E2** Extract **shared** builder primitives (components) usable from invite + campaign contexts.
- [ ] **E3** Extend **campaign passage** authoring to use builder + **non-admin** roles per **A2** (with `campaign-passage` / security review).
- [ ] **E4** Deprecate or narrow **admin-only** JSON/modal path once parity achieved.

## Phase F — Residency funding & campaign chrome (see spec § Intent, Phase F)

- [ ] **F1** Add **persistent** support/donate affordance on **campaign-scoped** pages (board, hub, initiation, twine; align `/event` with spec).
- [ ] **F2** **Pre-signup / demo** and **post-signup** donate paths (e.g. `CampaignReader` demo completion, post-auth surfaces)—link targets per DSW.
- [ ] **F3** `/campaign/board` (and similar): **button** treatment for top nav; **green** primary donate/support control.
- [ ] **F4** (Optional) Shared **`CampaignDonateCta`** (or equivalent) to avoid one-off styling drift.

## Phase G — Canonical DSW entry (money vs services + milestone coherence)

Implements [donation-self-service-wizard § Phase 3](../donation-self-service-wizard/spec.md) from the **campaign** side.

- [x] **G1** Default **`CampaignDonateButton`** (and any other campaign primary donate control) **`href`** → **`/event/donate/wizard`**, not bare **`/event/donate`**, unless a **documented exception** (e.g. deep link to self-report only).
- [x] **G2** **Query contract:** append **`?ref=`** (and any other keys agreed with DSW FR9) when the surface has a **`campaignRef`**, so wizard / donate settlement stay instance-aligned.
- [x] **G3** **`CampaignReader`** / initiation / twine strips: **Giving wizard** and primary **Donate** both consistent with **G1** (avoid three different URLs for the same intent).
- [x] **G4** **Verify** milestone bar updates after a **completed money** donation when **`dswMilestoneId`** is set (manual or cert); **document** that **time/space** paths do not auto-increment USD milestone until a future steward/in-kind rule exists.

## Verification

- [ ] **V1** `npm run build` && `npm run check` after each merged phase.
- [ ] **V2** Manual: invite flow + (when E ships) campaign passage flow.
