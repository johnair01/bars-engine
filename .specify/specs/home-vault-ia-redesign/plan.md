# Plan: Home / Vault IA Redesign

> Implement per [spec.md](./spec.md). **API-first**: define and ship the server actions (`captureBar`, `getTodayChargeTargets`, `applyDailyCharge`) before the "Now" UI. Reuse the Hand model + `OverflowModal` from [`hand-vault-bounded-inventory`](../hand-vault-bounded-inventory/spec.md).

## Architectural Strategy

This is the **IA / home layer** on top of the bounded-inventory model. We do **not** re-implement the Hand; we consume its actions and add three things:

1. **A capture entrypoint that chooses a destination** (Hand vs Vault, Pokémon rule).
2. **A daily charge that targets the Hand** (mint or advance).
3. **A "Now" homepage** that fuses capture + daily charge + ambient Hand, mobile-first, plus a cleaned top nav and maturity→location routing.

### Sequencing & dependencies

```
[dep] hand-vault-bounded-inventory (HandSlot, getPlayerHand, addBarToHand,
       resolveOverflow, promoteVaultBarToHand, OverflowModal)
   │
   ├─► Phase 1  captureBar (destination) + Capture UI
   ├─► Phase 2  daily charge on Hand (getTodayChargeTargets, applyDailyCharge)
   ├─► Phase 3  "Now" home + cleaned nav + maturity routing   [dep: hand-vault-rename]
   └─► Phase 4  verification quest cert-home-vault-ia-v1
```

If `HandSlot` is **not yet shipped**, that is a hard prerequisite — implement `hand-vault-bounded-inventory` first (its own tasks.md), do not stub a fake Hand here.

## File Impacts

### New
- `src/actions/capture-bar.ts` — `captureBar(input)` server action (create + route to Hand/Vault, overflow path).
- `src/actions/daily-charge.ts` — `getTodayChargeTargets()`, `applyDailyCharge(input)`.
- `src/components/now/NowHome.tsx` — the "Now" composition (capture, daily charge, hand glance). Mobile-first.
- `src/components/now/CaptureBox.tsx` — dominant always-on capture with destination choice.
- `src/components/now/DailyChargePanel.tsx` — mint/advance picker over Hand BARs.
- `src/components/now/HandGlance.tsx` — `X / 6` + each BAR's next move (reads `getPlayerHand`).
- `scripts/seed-home-vault-ia-cert.ts` — idempotent seed for `cert-home-vault-ia-v1` (Twine + CustomBar).

### Modified
- `src/app/page.tsx` — replace dashboard-first render with `NowHome` (keep auth/instance gating, onboarding, `DatabaseUnreachable`/`SetupRequired` fallbacks).
- `src/components/NavBar.tsx` — nav items → Now · Garden · Hand · Play · Events (coordinate with `hand-vault-rename`).
- `src/components/charge-capture/ChargeCaptureForm.tsx` — slim to capture-now/contextualize-later; emit destination choice (or be superseded by `CaptureBox`).
- `src/actions/charge-capture.ts` / `src/actions/alchemy.ts` — surface "done today" state to `getTodayChargeTargets`.
- `package.json` — add `seed:cert:home-vault-ia` script.

### Reused (no change expected)
- `OverflowModal`, `getPlayerHand`, `addBarToHand`, `resolveOverflow`, `promoteVaultBarToHand` (from bounded-inventory).
- `MATURITY_PHASES`, `SOIL_KINDS` (`src/lib/bar-seed-metabolization/types.ts`).

## API Contract Notes (Route vs Action)

All new surfaces are **Server Actions** — they back React forms / `useTransition` on `/`, no external/webhook consumer. Return `{ success, error?, … }` shapes (see spec). No Route Handlers needed.

## Maturity → Location Routing

A small pure helper (e.g. `src/lib/bar-home.ts`) maps `MaturityPhase` → home surface, used by glances and any "where is this BAR" UI:

| phase | home |
|---|---|
| `captured` | Hand or Vault (per capture choice / HandSlot presence) |
| `context_named`, `elaborated` | Garden |
| `shared_or_acted` | Hand |
| `integrated` | Quests / Adventures |

Keep this table as data, not scattered conditionals, so the Garden/Now UIs agree.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Building on a Hand model that isn't shipped | Treat `hand-vault-bounded-inventory` as a gating dependency; verify `HandSlot` exists before Phase 1. |
| Two daily-charge systems (charge-capture vs alchemy check-in) | Consolidate "done today" through `getTodayChargeTargets`; do not invent a third. |
| Nav double-edit conflict with `hand-vault-rename` | Land the rename first, then layer the cleaned 5-item nav. |
| Hardcoding 4 moves | Render moves from a list; leave room for the 5th (Open Up). |
| Mobile regressions | Test at 360px; capture + Now one-thumb. |

## Verification

- `npm run build` and `npm run check` green.
- Manual: capture → Hand → overflow → daily-charge-advance on mobile viewport.
- Certification quest `cert-home-vault-ia-v1` seeded and completable.
