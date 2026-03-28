# Tasks: Campaign onboarding CYOA (unified)

## Phase A — Ontology + alignment

- [x] **A1** Runbook [`docs/runbooks/CAMPAIGN_ONBOARDING_CYOA.md`](../../../docs/runbooks/CAMPAIGN_ONBOARDING_CYOA.md) + [`ADMIN_STEWARDSHIP.md`](../../../docs/runbooks/ADMIN_STEWARDSHIP.md) cross-link.
- [x] **A2** Invite: **admin | owner | steward** (`campaignRef`); campaign passages: **admin | owner | steward** for **ACTIVE** adventures with non-null **`campaignRef`** aligned to instance — see [`campaign-passage-permissions.ts`](../../../src/lib/campaign-passage-permissions.ts).
- [x] **A3** `playerCanEditEventInviteBar` includes **steward**; Vault / invite editor labels updated.

## Phase B–D — Event-invite builder (first ship)

- [x] **B1** `serializeEventInviteStory` + [`__tests__/builder-roundtrip.test.ts`](../../../src/lib/event-invite-story/__tests__/builder-roundtrip.test.ts).
- [x] **B2** [`EventInviteStoryBuilder`](../../../src/components/event-invite/EventInviteStoryBuilder.tsx) + collapsible `EventInviteStoryReader` preview.
- [x] **B3** `EventInviteBarContentEditor`: default **Visual builder** when JSON parses; **Advanced JSON** toggle.
- [x] **B4** [`prompt-templates.ts`](../../../src/lib/event-invite-story/prompt-templates.ts) surfaced in builder UI.
- [x] **B5** [event-invite-inline-editing](../event-invite-inline-editing/spec.md) **See also** + Authorization aligned.

## Phase E — Campaign CYOA (shared LEGO patterns)

- [x] **E1** **Campaign onboarding adventures** (steward/owner edit scope): any **ACTIVE** `Adventure` the app routes to for campaign flows, with **`campaignRef` set** to the residency key (e.g. `bruised-banana`), including **`bruised-banana-initiation-{player|sponsor}`**, **event-scoped** slugs from `eventInitiationAdventureSlug`, and **hub / ref-resolved** adventures (e.g. `wake-up` when tied to `campaignRef`). Adventures with **`campaignRef` null** stay **admin-only** for passage edits.
- [x] **E2** Shared primitive: [`CampaignBranchChoicesEditor`](../../../src/components/onboarding-cyoa-builder/CampaignBranchChoicesEditor.tsx) — **`CampaignPassageEditModal`** + **`EventInviteStoryBuilder`** (`compact` + passage id datalist).
- [x] **E3** **`campaign-passage`** actions + **`CampaignReader`** **`canEditPassages`** (server); preview stays **`isAdmin`**-only on the adventures API.
- [x] **E4** Server gate widened per E3; **`CampaignPassageEditModal`** remains the primary authoring surface (no raw JSON in modal).

## Phase F — Residency funding & campaign chrome (see spec § Intent, Phase F)

- [x] **F1** **Persistent** support strip: [`CampaignDonateCta`](../../../src/components/campaign/CampaignDonateCta.tsx) + campaign nav on **`/event`** header; board/hub/twine/initiation/campaign entry wired; **`CampaignDonateButton`** in `/event` fundraiser + Show Up sections (instance label).
- [x] **F2** **Demo** (`DemoOrientationClient`), **demo complete** + **`CampaignReader`** footer, **`CampaignAuthForm`** (post-signup gate): wizard + **How giving works** via shared Cta; targets **`/event/donate/wizard`** + `?ref=` per DSW.
- [x] **F3** **`CampaignOutlineNavButton`** for **Game map** + campaign shortcuts; **emerald** primary donate via **`CampaignDonateButton`** / Cta (COC Phase G).
- [x] **F4** **`CampaignDonateCta`** — primary donate + secondary **How giving works** (`CampaignOutlineNavButton` → wiki).

## Phase G — Canonical DSW entry (money vs services + milestone coherence)

Implements [donation-self-service-wizard § Phase 3](../donation-self-service-wizard/spec.md) from the **campaign** side.

- [x] **G1** Default **`CampaignDonateButton`** (and any other campaign primary donate control) **`href`** → **`/event/donate/wizard`**, not bare **`/event/donate`**, unless a **documented exception** (e.g. deep link to self-report only).
- [x] **G2** **Query contract:** append **`?ref=`** (and any other keys agreed with DSW FR9) when the surface has a **`campaignRef`**, so wizard / donate settlement stay instance-aligned.
- [x] **G3** **`CampaignReader`** / initiation / twine strips: **Giving wizard** and primary **Donate** both consistent with **G1** (avoid three different URLs for the same intent).
- [x] **G4** **Verify** milestone bar updates after a **completed money** donation when **`dswMilestoneId`** is set (manual or cert); **document** that **time/space** paths do not auto-increment USD milestone until a future steward/in-kind rule exists.

## Verification

- [x] **V1** `npm run build` && `npm run check` after each merged phase.
- [x] **V2** Steward QA **checklist** — [docs/runbooks/CAMPAIGN_ONBOARDING_CYOA.md § Verification](../../../docs/runbooks/CAMPAIGN_ONBOARDING_CYOA.md#verification-coc-v2-steward-qa) (execute before release; invite builder + campaign passage modal + donate chrome smoke).
