# Plan: Donation self-service wizard

## Implementation order

1. **Spec kit** — `spec.md`, `plan.md`, `tasks.md` (this folder).
2. **Server action extension** — `reportDonation` + `createDonationAndPacks` + pending cookie: optional DSW fields → `Donation.note`.
3. **Wizard UI** — `DonationSelfServiceWizard` client component + `src/app/event/donate/wizard/page.tsx`.
4. **Donate page** — `searchParams` prefill + hidden inputs; link “Guided wizard”.
5. **Verification** — `npm run check`; manual note inspection optional.

## File impacts

| Area | Files |
|------|--------|
| UI | `src/components/event/DonationSelfServiceWizard.tsx`, `src/app/event/donate/wizard/page.tsx`, `src/app/event/donate/page.tsx`, `src/app/event/donate/SelfReportDonationForm.tsx` |
| Actions | `src/actions/donate.ts` |
| Lib | Reuse `resolveMarketplaceCampaignRef` from `src/lib/resolve-marketplace-campaign-ref.ts` |
| Spec | `.specify/specs/donation-self-service-wizard/*` |
| Backlog | `BACKLOG.md` row links to this spec |

## Risks

- **Cookie size** — keep DSW meta compact (tier + path + truncated narrative).
- **Query string length** — prefer sessionStorage for long narrative optional future; v1 cap narrative 280 chars in wizard.

## Phase 2 (shipped)

- `Donation.dswMeta`, milestone `MilestoneContribution` on self-report, quest BAR echo, host branch, cert quest `cert-donation-self-service-wizard-v1`.

## Phase 3 (campaign integration)

1. **Wizard UX parity** — Space ↔ Money cross-link; confirm pick-step copy still promises “come back anytime.”
2. **Query contract** — Campaign surfaces pass `ref` / milestone context into wizard + donate flow per [spec § FR9](./spec.md).
3. **COC alignment** — [campaign-onboarding-cyoa](../campaign-onboarding-cyoa/spec.md) tasks **F5+** route donate CTAs to `/event/donate/wizard` unless documented exception.

## Open questions (defer)

- Stripe webhook correlation to DSW tier (honor path remains primary for v1).
- Admin UI to read structured `note` / `dswMeta` (use Prisma Studio / logs until dashboard exists).

## Phase 3 (shipped)

- Wizard preserves URL query (`useSearchParams`) on money handoff to `/event/donate`; server `campaignRef` overwrites/sets `ref` for instance alignment.
- Pick-step + `/event/donate` subcopy: **money or services** (time, space).
- `Suspense` boundary on wizard page for `useSearchParams`.
- Milestone verification steps: [docs/runbooks/DSW_PHASE3_MILESTONE_VERIFICATION.md](../../../docs/runbooks/DSW_PHASE3_MILESTONE_VERIFICATION.md).
