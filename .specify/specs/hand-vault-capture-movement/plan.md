# Plan: Hand/Vault — Capture Routing + Bidirectional Movement

> Implementation plan for [spec.md](./spec.md). Fixes issue #132. API-first order; no schema change.

## Strategy

The model layer is done. This is a **wiring job**: route capture into the Hand and surface the two existing movement actions in the UI. Build server-side first (one extended action + one tiny read helper), then a single shared client toggle reused across three surfaces, then the overflow handling on the whiteboard, then the cert quest.

Minimize new surface area: one new client component (`HandLocationToggle`) does Vault→Hand and Hand→Vault everywhere; the whiteboard reuses the overflow-modal pattern that already lives in `CaptureBox`.

## Key files

| Concern | File | Change |
|---------|------|--------|
| Canvas capture routing | `src/actions/bars.ts` (`captureBarFromCanvas`) | Call `addBarToHandForPlayer`; return `placedIn` + optional `overflow`. Import from `@/lib/hand-service` (not the `'use server'` `hand.ts`, to avoid the Turbopack cross-`'use server'` import rule noted in `hand-service.ts`). |
| Read helper | `src/actions/hand.ts` | Add `getBarHandState({ barId })` → `{ inHand, handFull }`. |
| Whiteboard | `src/components/bars/SeedCaptureWhiteboard.tsx` (`handleCapture` ~L1525, `setCaptured`) | Branch on `placedIn`/`overflow`; render overflow modal; run media upload in hand+vault branches. |
| Simple capture | `src/components/bars/SimpleCaptureForm.tsx` (~L37) | `destination: 'hand'`; route `/bars/kept?dest=hand`. |
| Kept confirmation | `src/app/bars/kept/page.tsx` | Already reads `dest` — ensure copy/links read well for `hand`. |
| Shared toggle | `src/components/hand/HandLocationToggle.tsx` (new) | "Hold in Hand" / "Return to Vault"; calls `promoteVaultBarToHand` / `depositHandBarToVault`; hand-full message; `compact` prop for list rows. |
| Overflow modal | `src/components/now/OverflowModal.tsx` (extract from `CaptureBox`, or reuse inline) | Shared by CaptureBox + whiteboard. |
| BAR detail | `src/app/bars/[id]/page.tsx` (~L216) | Render `HandLocationToggle` (owner only) using `getBarHandState`. |
| Vault/feed rows | `src/components/hand/Vault*` + garden/feed list row component(s) — **confirm exact files in T2.0** | Add compact `HandLocationToggle` on owned-BAR rows. |
| Hand glance | `src/components/now/HandGlance.tsx` (empty slot ~L102) | Replace `/bars/create` link with Vault-picker control → `promoteVaultBarToHand`; keep a create affordance. |

## Open implementation questions (resolve during build, not blocking the spec)

- **Vault/feed row inventory (T2.0)**: enumerate the exact list components that render owned BAR rows (Vault sections under `src/components/hand/`, the garden list, any feed). The spec mandates row-level controls; the precise files are a discovery step.
- **OverflowModal extraction**: the overflow markup currently lives inline in `CaptureBox.tsx`. Extract to a shared component so the whiteboard reuses it rather than duplicating ~80 lines.
- **Hand-glance Vault picker UX**: lightweight bottom-sheet list of Vault BARs vs. routing to a dedicated picker page. Prefer an in-place sheet to stay on Now (mobile-first).

## Sequencing & risk

1. Phase 1 (capture → Hand) is the highest-value, lowest-risk slice and resolves the literal "Hand stays empty" report. Ship/verify it first.
2. Phase 2 (movement UI) reuses already-tested actions; risk is UI placement and the row-component discovery.
3. Phase 3 cert quest follows the existing seed-script pattern.

## Verification

- `npm run check` (lint + type-check) and `npm run build` green.
- Manual mobile pass (360px): whiteboard capture → Hand; detail toggle both directions; full-hand overflow; empty-slot pull.
- Cert quest `cert-hand-vault-movement-v1` completable end to end.

## Out of scope

- Any `CustomBar.location` column (rejected — `HandSlot` already encodes location).
- Changing `CaptureBox`'s default-Vault behavior.
- Hand reordering / carrying-slot changes (owned by `hand-vault-bounded-inventory`).
</content>
