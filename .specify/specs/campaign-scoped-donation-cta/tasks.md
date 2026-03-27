# Tasks: Campaign-scoped donation CTA

Source: [spec.md](./spec.md), [plan.md](./plan.md).

## Phase 1 — Resolution

- [ ] **T1.1** Add `getInstanceForDonation({ campaignRef?: string | null })` with documented behavior when `campaignRef` missing (use active instance) and when no row matches (error UI consistent with current empty state).
- [ ] **T1.2** Wire `/event/donate` to resolver using `searchParams.ref` (trim, validate non-empty before lookup).
- [ ] **T1.3** Wire `/event/donate/wizard` the same way; ensure internal links to `/event/donate` preserve `ref` query (wizard already builds `wizardBackHref`—verify).
- [ ] **T1.4** Update `GET /api/onboarding/donation-url` to support `?ref=` and return first available URL from **resolved** instance.
- [ ] **T1.5** Grep for `getActiveInstance()` in donate / milestone / DSW paths; update any that should be ref-aware.
- [ ] **T1.6** Document `campaignRef` uniqueness: add DB constraint or query rule; add comment in resolver.

## Phase 2 — Schema & actions

- [ ] **T2.1** Add `Instance.donationButtonLabel String?` (nullable); migrate (`npm run db:sync` local; ship with `prisma migrate` per project rules).
- [ ] **T2.2** Add `EventArtifact.donationCtaOverrides Json?` (nullable); Zod schema `DonationCtaOverridesV1` (URLs + optional label + flags).
- [ ] **T2.3** Implement `assertCampaignOwnerOrAdmin(playerId, instanceId)`.
- [ ] **T2.4** Implement `assertEventOwnerOrAdmin(playerId, eventArtifactId)` per spec definition (creator vs participant roles—match one rule).
- [ ] **T2.5** Implement `updateInstanceDonationCta` server action with shared URL validation.
- [ ] **T2.6** Implement `updateEventDonationCta` server action.
- [ ] **T2.7** Audit log: admin actions logged; define minimal log for campaign-owner edits (reuse or new table).

## Phase 3 — Campaign UI

- [ ] **T3.1** Add authenticated route for fundraising settings (instance scoped by `ref`).
- [ ] **T3.2** Build form: Venmo, Cash App, PayPal, Stripe, Patreon, optional button label; reuse [UI_COVENANT.md](../../../UI_COVENANT.md) / existing admin field styling.
- [ ] **T3.3** Add navigation entry for owners (hub or dashboard)—copy reviewed for “Fundraising” vs “Donate links”.
- [ ] **T3.4** `npm run build` + `npm run check` after Phase 3.

## Phase 4 — Admin consistency

- [ ] **T4.1** Extract shared Zod + form field list used by `/admin/instances` and campaign owner form (avoid drift).
- [ ] **T4.2** Confirm admin `upsertInstance` remains authoritative or delegates to shared validator.

## Phase 5 — Event UI

- [ ] **T5.1** Event owner UI section: load merge of Instance defaults + `donationCtaOverrides`; save clears or patches JSON.
- [ ] **T5.2** Document precedence: event overrides > instance > active fallback (for event-scoped CTAs only; global `/event/donate?ref=` still instance-level unless tasks specify event slug in URL—**out of scope** unless added).

## Phase 6 — Tests & docs

- [ ] **T6.1** Unit tests: resolver, Zod, authorization helpers.
- [ ] **T6.2** Update `docs/` or wiki pointer if donate URL behavior is documented for stewards.
- [ ] **T6.3** Mark backlog item **1.55 CSD** in [.specify/backlog/BACKLOG.md](../../backlog/BACKLOG.md) Done when shipped.

---

## Done when

- [ ] All Phase 1–6 tasks checked.
- [ ] Acceptance criteria in spec.md verified manually for Bruised Banana `ref`.
