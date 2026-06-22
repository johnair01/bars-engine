# Tasks: Home / Vault IA Redesign

> Implement per [spec.md](./spec.md) and [plan.md](./plan.md). API-first order. Check off as completed.

## Phase 0 — Prerequisites

- [x] **T0.1** Verify `HandSlot` Prisma model + base Hand actions exist (`getPlayerHand`, `addBarToHand`, `resolveOverflow`, `promoteVaultBarToHand`). Shipped in [`hand-vault-bounded-inventory`](../hand-vault-bounded-inventory/spec.md) Phase 1. (`OverflowModal` component is Phase 2 UI, in progress with Claude Design.)
- [x] **T0.2** Land [`hand-vault-rename`](../hand-vault-rename/spec.md) so `/hand` route/title/concept agree before nav edits.
- [x] **T0.3** Add `src/lib/bar-home.ts` — pure `maturity → home surface` map (table from plan).

## Phase 1 — Capture-First (API → UI)

- [x] **T1.1** `src/actions/capture-bar.ts` — `captureBar({ content, title?, destination='vault' })`. Creates BAR as `captured` (stamped via `mergeSeedMetabolization`); routes to Hand (via `addBarToHand`) or Vault; returns `overflow` when Hand requested but full (BAR parked in Vault). Type-check green.
- [ ] **T1.2** `src/components/now/CaptureBox.tsx` — dominant, always-on, mobile-first capture. One action to save; destination choice **Add to Hand / Send to Vault (default)**.
- [ ] **T1.3** Wire `OverflowModal` into CaptureBox when `captureBar` returns `overflow`; resolve via existing `resolveOverflow`.
- [ ] **T1.4** Slim `src/components/charge-capture/ChargeCaptureForm.tsx` to capture-now/contextualize-later (or mark superseded by CaptureBox).

## Phase 2 — Daily Charge on the Hand

- [x] **T2.1** `src/actions/daily-charge.ts` — `getTodayChargeTargets()` returns `alreadyDoneToday` (reuses `getTodayCharge`) + advanceable Hand BARs (in-hand, BSM-supporting, not yet `integrated`).
- [x] **T2.2** `applyDailyCharge({ mode: 'mint' | 'advance', … })`: one charge/day (rejects `already-done-today`); `mint` creates a `charge_capture` BAR (optional `destination: 'hand'`); `advance` pushes a Hand BAR one maturity phase and rejects `bar-not-in-hand` for Vault-only BARs. Type-check green.
- [ ] **T2.3** `src/components/now/DailyChargePanel.tsx` — mint vs advance picker over Hand BARs; on Vault-only intent, prompt to `promoteVaultBarToHand` first.

## Phase 3 — "Now" Home + Nav + Maturity Routing

- [ ] **T3.1** `src/components/now/HandGlance.tsx` — `X / 6` + each Hand BAR's single next move (reads `getPlayerHand`); render moves from a list (room for the 5th).
- [ ] **T3.2** `src/components/now/NowHome.tsx` — compose CaptureBox + DailyChargePanel + HandGlance, mobile-first (no horizontal scroll at 360px).
- [ ] **T3.3** `src/app/page.tsx` — render `NowHome`; preserve auth/instance gating, onboarding, and `DatabaseUnreachable`/`SetupRequired` fallbacks.
- [ ] **T3.4** `src/components/NavBar.tsx` — nav → Now · Garden · Hand · Play · Events (after T0.2).
- [ ] **T3.5** Route planted (`context_named`/`elaborated`) BARs to Garden and `integrated` to Quests via `bar-home.ts`; add Garden glance link on `/`.

## Phase 4 — Verification Quest

- [ ] **T4.1** `scripts/seed-home-vault-ia-cert.ts` — idempotent seed for `cert-home-vault-ia-v1` (TwineStory + CustomBar, `isSystem: true`, `visibility: 'public'`, deterministic id). Steps per spec; Bruised Banana framing.
- [ ] **T4.2** `package.json` — add `"seed:cert:home-vault-ia": "tsx scripts/seed-home-vault-ia-cert.ts"`.
- [ ] **T4.3** Run the seed; confirm quest is completable end to end.

## Phase 5 — Fail-Fix & Backlog

- [ ] **T5.1** `npm run build` — green.
- [ ] **T5.2** `npm run check` — lint + type-check green.
- [ ] **T5.3** Manual mobile pass (360px): capture → Hand → overflow → daily-charge-advance.
- [ ] **T5.4** Add/confirm BACKLOG.md entry; run `npm run backlog:seed`.
- [ ] **T5.5** Check off completed tasks here.

## Out of scope (flagged, separate slice)

- [ ] Extend `WaveStage` 4→5 (`Open`) in `src/lib/quest-grammar/types.ts` + `move-engine.ts` — own spec/tasks. This kit only avoids hardcoding exactly four moves.
