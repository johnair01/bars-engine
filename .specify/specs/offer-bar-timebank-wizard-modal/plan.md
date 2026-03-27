# Plan: Offer BAR (timebank) + DSW modal

Implement per [`.specify/specs/offer-bar-timebank-wizard-modal/spec.md`](./spec.md).

## Phase 1 — Types + action

1. Add `OfferBarMetadata` (Zod or hand validation) in `src/lib/offer-bar/` (new) or `src/lib/bar-metadata/`.
2. Server action: create `CustomBar` with `campaignRef`, allyship domain from instance (same pattern as `emitBarFromPassage`), `docQuestMetadata` or `agentMetadata` JSON containing `offerBar` payload.
3. Unit tests for validation + serialization.

## Phase 2 — Modal + DSW

1. Client component `OfferBarModal` (`src/components/event/` or `src/components/bars/`): modal shell, form, submit → server action.
2. Update `DonationSelfServiceWizard`: replace `Link` to `barsCreateHref` on **Time** / **Space** with **button** that opens modal; pass `campaignRef`, `instanceName` or `campaignRef` for copy.
3. Logged-out: show **Sign in to offer time** → `/login?returnTo=/event/donate/wizard?ref=…`.

## Phase 3 — Marketplace handoff

1. On success: toast or inline **Next step** with **List on campaign stall** / **Open marketplace** links using existing marketplace actions (discover `listBarOnStall` or equivalent — align with implementation).

## File impact (expected)

| Area | Files |
|------|--------|
| Lib | `src/lib/offer-bar/types.ts`, `validate.ts` |
| Actions | `src/actions/offer-bar-from-dsw.ts` (or extend `create-bar.ts`) |
| UI | `src/components/event/DonationSelfServiceWizard.tsx`, new `OfferBarModal.tsx` |
| Tests | `src/lib/offer-bar/__tests__/*.test.ts` |

## Ordering

**Phase 1 → Phase 2 → Phase 3**. Marketplace polish can follow first usable create path.
