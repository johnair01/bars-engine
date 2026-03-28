# Plan — Polarity Engine v0

Implement per [spec.md](./spec.md). **Types + deterministic mapping first**, then **server actions**, then **spin + quest hook**, then **verification quest**.

## Phase 1 — Library + contracts

1. Add **`src/lib/polarity-engine/types.ts`** — `EmotionalCharge`, `Polarity`, `PolarityInstance`, `SpinState`, `EmotionQuestions` constant.
2. Add **`src/lib/polarity-engine/emotion-questions.ts`** — pure map element → question; unit tests.
3. Add **`src/lib/polarity-engine/extract-poles.ts`** — v0: template or heuristic from BAR `title`+`description`+charge (deterministic); document upgrade path for Sage-assisted wording.

## Phase 2 — Persistence

1. Decide **JSON shape** on `CustomBar` (e.g. `inputs` / `completionEffects` / dedicated JSON column if already used for BAR metadata) — align with Prisma; migration only if required.
2. Implement **get/set charge** and **get/set polarity + spin** helpers in **`src/lib/polarity-engine/store.ts`** (or co-locate with BAR actions).

## Phase 3 — Server actions

1. **`src/actions/polarity-engine.ts`** (or split): `chargeBar`, `polarizeBar`, `resolveDirection`, optional `updateSpin`.
2. Wire **auth**: same patterns as `emit-bar` / BAR edit actions.

## Phase 4 — Quest hook

1. **`generateQuestFromPolarity`** in **`src/lib/polarity-engine/quest-hook.ts`** — calls **`compileQuestCore`** or thin wrapper around existing **`generateQuestFromReading`**-style entry with **prompt context** from spin.
2. Optional: admin-only **preview** route for stewards.

## Phase 5 — UX (minimal)

1. **Player UI**: one path from **BAR detail** or **Vault** — charge picker + question + pole cards + confirm (cultivation-cards / UI Covenant).
2. **Verification quest** + seed per spec kit skill.

## File impact (expected)

| Area | Files |
|------|--------|
| Types + logic | `src/lib/polarity-engine/*` |
| Actions | `src/actions/polarity-engine.ts` |
| Prisma | `prisma/schema.prisma` + migration **only if** new column/table |
| UI | `src/components/polarity/` or BAR modal extension |
| Tests | `src/lib/polarity-engine/__tests__/*` |

## Out of scope (defer)

- Full LLM pole extraction in v0
- Global polarity taxonomy / admin CRUD for poles
- Multiplayer shared spin on same BAR
