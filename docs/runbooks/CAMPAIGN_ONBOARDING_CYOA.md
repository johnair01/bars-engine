# Campaign onboarding = CYOA (ontology)

**Spec:** [.specify/specs/campaign-onboarding-cyoa/spec.md](../../.specify/specs/campaign-onboarding-cyoa/spec.md) (COC)

## One sentence

**Campaigns need onboarding; invitations are onboarding; in BARs, invites are always CYOA** — branching passages (`EventInviteStory` or `Adventure` + `Passage`), not a single static blurb.

## Where it lives

| Surface | Reader | Authoring |
|---------|--------|-----------|
| Event invite BAR | `/invite/event/[barId]` → `EventInviteStoryReader` | Hand / Vault + public invite page: **`EventInviteBarContentEditor`** — **Visual builder** or **Advanced JSON** |
| Campaign / initiation | `CampaignReader`, `/campaign`, `/campaign/initiation` | `CampaignPassageEditModal` + `campaign-passage` actions; **admin** or **instance owner/steward** when the adventure has **`campaignRef`** matching membership — see below |

## Permissions (invite content)

[`playerCanEditEventInviteBar`](../../src/lib/event-invite-bar-permissions.ts): **admin**, or **instance owner / steward** for the BAR’s `campaignRef`.

## Permissions (campaign passages)

[`playerCanEditCampaignAdventure`](../../src/lib/campaign-passage-permissions.ts): same **owner/steward** idea as invites, scoped to **ACTIVE** `Adventure` by slug; adventure **`campaignRef`** must be set and match the instance. **Preview** (`preview=1` on adventure fetch) stays **admin-only**.

## Support chrome (Phase F)

- **[`CampaignDonateCta`](../../src/components/campaign/CampaignDonateCta.tsx)** — primary **Donate** (→ `/event/donate/wizard` + `?ref=` when known) and **How giving works** (wiki). Used on `/event` header, campaign board/hub/twine/initiation, demo orientation, `CampaignReader` footer, and signup (`CampaignAuthForm`).
- **`CampaignDonateButton`** — emerald primary only; fundraiser collapsibles on `/event` also use it with optional instance **`donationButtonLabel`**.

## Shared choice editor (invite + campaign)

- **[`CampaignBranchChoicesEditor`](../../src/components/onboarding-cyoa-builder/CampaignBranchChoicesEditor.tsx)** — LEGO choice rows for **`CampaignPassageEditModal`** and **`EventInviteStoryBuilder`** (compact variant + datalist targets).

## Verification: COC V2 steward QA

Run this before calling COC “verified” for a release train. Use a **non-admin steward** account on an instance whose **`campaignRef`** matches the adventure / invite BAR (e.g. `bruised-banana`).

### 1) Event invite BAR (Vault or Hand)

1. Open an **`event_invite`** BAR with **`campaignRef`** set to your test instance (e.g. from Hand **Campaign invite** card or Vault).
2. Confirm **Visual builder** loads when `storyContent` is valid JSON (not raw JSON by default).
3. Add or edit **choices** — rows should match the shared **LEGO** control (labels + **next** passage id).
4. Enter a **bogus `next` id** (not in the story) and attempt save — you should get a **plain-language validation** error from the parser, not a silent failure.
5. Open **`/invite/event/[barId]`** as a guest (logged out or incognito) — **EventInviteStoryReader** should match what you authored (preview parity for published content).

### 2) Campaign / initiation CYOA (steward)

1. Ensure your player has **owner** or **steward** on the **Instance** whose `campaignRef` equals the **Adventure.campaignRef** (e.g. initiation adventure for BB).
2. Visit **`/campaign/initiation`** or ref-scoped **`/campaign?ref=…`** (whichever your residency uses).
3. Confirm **Edit** (or equivalent) appears when the server sets **`canEditPassages`** — only if the adventure is **ACTIVE** and **`campaignRef`** is non-null and aligned.
4. Open **Edit passage** → **`CampaignPassageEditModal`** — choice rows use **`CampaignBranchChoicesEditor`** (same pattern as invite builder).
5. Save a small copy change; reload — text persists. Trigger a **graph validation** error (e.g. invalid target) and confirm the **error string** is readable in the modal.

### 3) Support chrome (Phase F + G smoke)

1. From **`/campaign/hub`**, **`/campaign/board`**, **`/campaign/twine`**, **`/campaign/initiation`**, and **`/event`** — confirm a visible **Donate / support** path (primary → **`/event/donate/wizard`** with **`?ref=`** when `campaignRef` is known).
2. Optional: complete a **money** self-report on wizard with milestone context and confirm **BBMT / milestone strip** updates per DSW docs (see [DSW Phase 3](../../.specify/specs/donation-self-service-wizard/spec.md)).

### Deferred (not blocking COC v1)

- **CampaignReader** live **draft** preview for stewards (admin-only `preview=1` on API today) — see COC `plan.md` § Phase E deferred.

## Related

- [Donation self-service wizard](../../.specify/specs/donation-self-service-wizard/spec.md) — money path; COC requires **support** visible on campaign journeys.
- [Event invite guest journey template](../events/EVENT_INVITE_GUEST_JOURNEY_TEMPLATE.md) — blessed JSON (UGA).
- [Emergent allyship intake (Thunder) ops](./EMERGENT_ALLYSHIP_INTAKE_OPS.md) — BAR invite interview **before** child campaign exists; maps to **ECI** + backlog (**1.71**).
