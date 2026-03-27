# Plan: Campaign-scoped donation CTA

Implement per [spec.md](./spec.md). Order: **resolve correctly** → **authorize writes** → **owner UIs** → **event overrides** → **verification**.

## Phase 1 — Resolution (read path)

| Step | Work |
|------|------|
| 1.1 | Add `getInstanceForDonation({ campaignRef?: string | null })` in `src/actions/instance.ts` (or `src/lib/donation-instance.ts`): if `campaignRef` trimmed nonempty, `findFirst` / `findUnique` `Instance` by `campaignRef`; else `getActiveInstance()`. Handle not found → same UX as “no active instance” with clear copy. |
| 1.2 | Replace direct `getActiveInstance()` in `/event/donate/page.tsx` and `/event/donate/wizard/page.tsx` with resolver reading `searchParams.ref` (and optionally `searchParams` alias if product uses another key—keep `ref` consistent with DSW). |
| 1.3 | Ensure `SelfReportDonationForm` / `reportDonation` receive **`instanceId`** from resolved instance (already passed from page). |
| 1.4 | Update `src/app/api/onboarding/donation-url/route.ts` to accept optional `ref` query and resolve instance accordingly. |
| 1.5 | Audit other call sites: CYOA cert routes that mention donate links (`adventures` API), `CampaignReader`, docs—only if they assume global active instance for URLs. |

## Phase 2 — Schema + server actions (write path)

| Step | Work |
|------|------|
| 2.1 | Prisma: optional `Instance.donationButtonLabel String?`; migration. Optional `EventArtifact.donationCtaOverrides Json?` with Zod schema in `src/lib/...`. |
| 2.2 | `resolveCampaignOwner(playerId, instanceId)` helper using `InstanceMembership` `owner` \| `steward`. |
| 2.3 | `updateInstanceDonationCta(instanceId, form | payload)` server action: Zod-validate URLs (https, allowed hosts optional); authorize admin OR campaign owner; update Instance fields. |
| 2.4 | `updateEventDonationCta(eventArtifactId, payload)` server action: authorize admin OR event owner; merge/clear JSON overrides. |

## Phase 3 — Campaign owner UI

| Step | Work |
|------|------|
| 3.1 | Route: e.g. `/campaign/[ref]/fundraising` or under existing campaign hub—**must** require auth + ownership check server-side. |
| 3.2 | Form mirroring admin Instance payment fields + optional button label; submit to `updateInstanceDonationCta`. |
| 3.3 | Link from `CampaignHubView` or owner dashboard (where stewards already land)—minimal discoverability. |

## Phase 4 — Admin alignment

| Step | Work |
|------|------|
| 4.1 | Keep `/admin/instances` as source of truth for admins; ensure new action reused by admin form OR admin continues to call `upsertInstance` without duplicating validation rules. |
| 4.2 | Single shared Zod schema for donation URL fields between admin and campaign owner forms. |

## Phase 5 — Event owner UI

| Step | Work |
|------|------|
| 5.1 | Event detail or edit surface: “Fundraising / donation CTA” section when user is event owner or admin. |
| 5.2 | Read path: when rendering donate CTAs **in event context**, merge `EventArtifact.donationCtaOverrides` over resolved `Instance` URLs / label (document precedence in spec tasks). |

## Phase 6 — Verification

| Step | Work |
|------|------|
| 6.1 | Unit tests: resolver (`ref` vs fallback); Zod validation; authorization helper. |
| 6.2 | Manual: BB residency `ref` shows correct links; non-owner POST rejected. |

## File impact (expected)

- `src/actions/instance.ts` — resolver + action
- `src/app/event/donate/page.tsx`, `wizard/page.tsx` — `ref` resolution
- `src/app/api/onboarding/donation-url/route.ts` — optional `ref`
- `prisma/schema.prisma` + migration — new columns
- New: campaign fundraising page + components; event donation section component
- `src/components/campaign/CampaignDonateButton.tsx` — optional docstring only unless label override from Instance is required client-side

## Dependencies

- No hard dependency on DSW schema changes; aligns with [donation-self-service-wizard § Phase 3](../donation-self-service-wizard/spec.md) `ref` contract.
