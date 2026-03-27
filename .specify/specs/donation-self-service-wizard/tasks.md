# Tasks: Donation self-service wizard

## Spec kit

- [x] `spec.md`, `plan.md`, `tasks.md`
- [x] `BACKLOG.md` DSW row points at this spec

## Phase 1

- [x] Extend `reportDonation` / `createDonationAndPacks` / pending cookie for `dswPath`, `dswTier`, `dswNarrative` → `Donation.note` (`[DSW] …`)
- [x] `DonationSelfServiceWizard` + `/event/donate/wizard`
- [x] `/event/donate` — wizard link + `searchParams` prefill + pass-through hidden fields on self-report
- [ ] `npm run check` (run locally; full-repo eslint/tsc can take several minutes)

## Phase 2

- [x] Cert quest `cert-donation-self-service-wizard-v1` + `npm run seed:cert:donation-self-service-wizard`
- [x] `Donation.dswMeta` JSON + milestone contribution + optional quest BAR echo
- [x] Fundraiser-host wizard branch (checklist + CTAs)

## Phase 3 — Campaign entry + reversible paths + milestone verification

See [spec.md § Phase 3](./spec.md) (FR8–FR10, P5–P6).

- [x] **P3.1** **Space** branch: add **money** cross-link (parity with **Time** → guided money).
- [x] **P3.2** Preserve **campaign `ref`** (and other agreed query keys) from **`/event/donate/wizard`** entry through to **`/event/donate`** self-report when params are present (align with FR9; may require wizard `searchParams` + `useSearchParams` or server page props).
- [x] **P3.3** Verify end-to-end: money self-report with **`dswMilestoneId`** increments milestone **`currentValue`** and BBMT surfaces update (regression check for FR6).
- [x] **P3.4** Copy pass: optional headline/subcopy using **“money or services”** where product wants, mapping to **Money | Time | Space** tiles (no new branch unless stakeholders ask).
