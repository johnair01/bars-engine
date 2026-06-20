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

## Open implementation questions — resolved by the Six Faces ([SIX_FACE_ANALYSIS.md](./SIX_FACE_ANALYSIS.md))

- **Vault/feed row inventory (T2.0)** → keep as a scoped discovery step: target owned-BAR rows in `src/components/hand/Vault*` and the Garden list first; defer feed if rows aren't owner-context. One `HandLocationToggle(compact)` everywhere.
- **OverflowModal extraction** → **yes, extract** `src/components/now/OverflowModal.tsx` from `CaptureBox` for reuse + testability (even if Fork A means only `CaptureBox` consumes it).
- **Hand-glance Vault picker UX** → **in-place bottom-sheet** (stay on Now, mobile-first); the empty slot offers both "Pull from Vault" and "Capture new" so a bare tap is never ambiguous.

## Forks — DECIDED

- **Fork A — whiteboard Hand-full** → **silent Vault fallback + toast** (no modal on the canvas). `captureBarFromCanvas` returns `placedIn: 'vault'` with no `overflow`; the whiteboard shows the fallback toast.
- **Fork B — movement on planted/Garden BARs** → **restrict toggle to non-planted BARs** (`captured` / `shared_or_acted`) in v1; Garden↔Hand is a follow-up.

## Architect notes folded into the spec

- **No new `getBarHandState` action** — compute `inHand`/`handFull` inline in the server components.
- **Coordinate the `captureBarFromCanvas` return type with `bar-capture-consolidation`** (it edits the same action: adds `title`, Captured overlay, Tune path). Converge on `{ barId, title, placedIn, overflow? }`.
- Import `addBarToHandForPlayer` from `@/lib/hand-service` (not the `'use server'` `hand.ts`).
- Optional hardening: wrap find+upsert in `addBarToHandForPlayer` in a `$transaction` if concurrent-capture slot races ever surface.

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
