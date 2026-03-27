# Plan: Campaign onboarding CYOA (unified)

Implement per [`.specify/specs/campaign-onboarding-cyoa/spec.md`](./spec.md).

## Phase A — Ontology + permissions decisions

1. Lock **copy** for stewards/owners/admins per surface (invite vs campaign passage)—document in spec.
2. Fix **invite** list vs `playerCanEditEventInviteBar` mismatch if still present.
3. Runbook one-pager: **campaigns need onboarding; invitations are onboarding; invites are CYOA**.

## Phase B–D — Event-invite LEGO builder (first vertical)

1. Builder state ⇄ `EventInviteStory` round-trip; validation helpers.
2. `EventInviteStoryBuilder` UI; wire into `EventInviteBarContentEditor`; preview via `EventInviteStoryReader`.
3. Static prompt templates; optional AI later.
4. Update inline-editing spec cross-links.

## Phase E — Campaign CYOA authoring (same patterns)

1. Map **which** `Adventure`/passages are “campaign onboarding” for an instance (product decision).
2. Reuse **shared** passage/choice UI; adapter to `upsertCampaignPassage` or successor action with **new permission matrix** (steward/owner scoped).
3. Align `CampaignReader` preview with builder draft (client preview).

## Phase F — Residency funding & campaign chrome (ontology: funding ⊆ onboarding)

1. **Persistent support/donate** on campaign-scoped routes (board, hub, initiation, twine, event surfaces as defined in spec)—coordinate with [donation-self-service-wizard](../donation-self-service-wizard/spec.md).
2. **Pre-signup / demo** and **post-signup** donate visibility (`CampaignReader` demo end, auth flows).
3. **Nav affordances:** e.g. `/campaign/board` top links → **buttons** for visibility; optional shared `CampaignDonateCta` component.

## Phase G — Canonical contribute flow (wizard entry)

1. **Default href** — Campaign **`CampaignDonateButton`** → **`/event/donate/wizard`** per [DSW Phase 3](../donation-self-service-wizard/spec.md); preserve **`ref`** / query contract.
2. **Coherence** — Align **`CampaignReader`** donate strip, initiation, hub, board (no competing donate URLs for the same intent).
3. **Milestone** — Confirm BBMT strip reflects **FR6** after money self-report (with [DSW](../donation-self-service-wizard/spec.md) **P3.3**).

## File impact (cumulative)

| Area | Files |
|------|--------|
| Invite | `src/lib/event-invite-story/*`, `src/components/event-invite/*`, permissions |
| Campaign | `src/app/campaign/components/CampaignPassageEditModal.tsx`, `src/actions/campaign-passage.ts`, possibly new shared `src/components/onboarding-cyoa-builder/*` |
| Residency CTAs | `src/app/campaign/board/page.tsx`, hub/twine/initiation, `CampaignReader`, `CampaignDonateButton` (`href` default → wizard Phase G), shared donate primitive |
| Docs | `docs/runbooks/*` |

## Ordering

**A → B–D (invite)** → **E (campaign)** unless security requires campaign first. **F (funding/chrome)** can parallel **B** after **A** if staffing allows—do not block narrative builder on donate UI, but **product “residency complete”** may require **F** before launch.
