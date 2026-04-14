# Tasks: BAR Working Layer (BWL)

## Phase 0 — Spec alignment

- [ ] **BWL-0.1** Read [bar-seed-metabolization](../bar-seed-metabolization/spec.md) + confirm `MaturityPhase` enum covers `context_named` / `elaborated`; document any rename if product uses “elaborated” vs BSM “linked” wording.
- [ ] **BWL-0.2** Confirm persistence choice: **nested `barWorking` in `seedMetabolization`** vs new **`barWorkingJson`** column — record in `spec.md` Design decisions if changed.

## Phase 1 — Lib + persistence

- [ ] **BWL-1.1** Add `src/lib/bar-working/interpretations.ts` — six GM faces + resolved strings + Zod enum.
- [ ] **BWL-1.2** Add `BarWorkingState` Zod schema + `mapInterpretationToQuestDefaults()` for `growQuestFromBar`.
- [ ] **BWL-1.3** Extend `SeedMetabolizationState` / parse / serialize for optional `barWorking` **or** add Prisma field + migration per **BWL-0.2**.
- [ ] **BWL-1.4** Unit tests: interpretation validation; quest default mapping; idempotent “already worked” logic (pure helpers).

## Phase 2 — Server actions + mint

- [ ] **BWL-2.1** Implement `saveBarWorkingInterpretation` + `completeBarWorking` (auth + BAR access parity with `growQuestFromBar`).
- [ ] **BWL-2.2** Wire **`mintVibulon(playerId, 1, { source: 'bar_work', id: barId, title: … })`** once; persist `barWorkMintLedger` or equivalent idempotency marker.
- [ ] **BWL-2.3** Update **`growQuestFromBar`** to apply `moveType` / `allyshipDomain` from worked interpretation; fallback unchanged for unworked BARs.
- [ ] **BWL-2.4** `npm run check` after edits.

## Phase 3 — Vault UI

- [ ] **BWL-3.1** Add **“Work this BAR”** CTA + inline flow on `/hand` (or vault card component): dropdown + `moveText` + confirm; &lt; 30 s path.
- [ ] **BWL-3.2** Post-completion feedback: worked badge + Vibulon feedback (wallet refresh or toast) — in-world copy only.
- [ ] **BWL-3.3** Read `UI_COVENANT.md`; use cultivation-card tokens + layout-only Tailwind.

## Phase 4 — Garden (optional / parallel)

- [ ] **BWL-4.1** Filters: worked vs unworked; maturity display — coordinate with BSM Garden if duplicate.

## Verification quest

- [ ] **BWL-V.1** Quest id **`cert-bar-working-layer-v1`** + seed step wiring; `npm run seed:cert:…` or extend `seed-cyoa-certification-quests.ts` per [cyoa-certification-quests](../cyoa-certification-quests/spec.md).

## Ship checklist

- [ ] `npm run build` && `npm run check`
- [ ] If schema changed: committed `prisma/migrations/*`
- [ ] Human summary in PR (what / why / how to try)
