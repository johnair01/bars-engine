# DSW Phase 3 — Milestone verification (money path)

**Spec:** [.specify/specs/donation-self-service-wizard/spec.md](../../.specify/specs/donation-self-service-wizard/spec.md) Phase 3, FR6 + P6.

## What to verify

1. Active instance has at least one **active** `CampaignMilestone` for the instance `campaignRef`.
2. Open `/event/donate/wizard?ref=<campaignRef>` (or campaign **Donate** CTA).
3. **Money** → pick tier → optional milestone → **Continue to pay & self-report** → `/event/donate` with query still carrying `ref` (and `dswMilestoneId` if selected).
4. Complete honor **self-report** with USD amount ≥ pack minimum.
5. **DB:** `Donation.dswMeta` contains `milestoneId` when linked; `MilestoneContribution` row exists; milestone `currentValue` increased by reported dollars; `maybeCompleteMilestoneAndAdvanceKotter` may mark complete when target reached.
6. **Time / Space** wizard paths do **not** auto-increment USD milestone totals (no `Donation` row on those paths unless product adds in-kind rules later).

## Regression

- `npm run seed:cert:donation-self-service-wizard` cert quest Step 3 covers note + `dsw_meta` + milestone increment in dev/synthetic DB.
