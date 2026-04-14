# Plan: BAR Working Layer

## Authority

Implement per [.specify/specs/bar-working-layer/spec.md](./spec.md). Execute [tasks.md](./tasks.md) in order.

## Strategic order

1. **Contracts** — `BarWorkingState` Zod schema + canonical interpretation table (`src/lib/bar-working/`).
2. **Persistence** — extend `SeedMetabolizationState` + parse/serialize **or** Prisma column; align maturity writes with BSM.
3. **Server actions** — `saveBarWorkingInterpretation`, `completeBarWorking` (mint + idempotency), `getBarWorkingState` (or inline in existing BAR fetch).
4. **`growQuestFromBar`** — read `barWorking` + apply mapping; fallback to current defaults.
5. **Vault UI** — `/hand` CTA + inline flow (read `UI_COVENANT.md` for styling).
6. **Verification quest** — `cert-bar-working-layer-v1` + seed script.

## File impacts (anticipated)

| Area | Files |
|------|--------|
| Lib | `src/lib/bar-working/*` (interpretations, schema, map-to-quest-defaults) |
| BSM | `src/lib/bar-seed-metabolization/types.ts`, `parse.ts` (if nested `barWorking`) |
| Actions | `src/actions/bars.ts` (new actions or `src/actions/bar-working.ts`), `growQuestFromBar` |
| Economy | `src/actions/economy.ts` — reuse `mintVibulon`; document `origin.source = 'bar_work'` |
| UI | `src/app/hand/*` or vault components; BAR card / list |
| Prisma | Optional `barWorkingJson` — only if JSON nesting rejected |
| Tests | `src/lib/bar-working/__tests__/*` or `src/lib/__tests__/bar-working*.test.ts` |
| Cert | `scripts/seed-cyoa-certification-quests.ts`, Twine / quest seed |

## Verification

- `npm run check`, `npm run build`
- Manual: work BAR → mint once → grow quest → fields match spec table
- Cert quest walkthrough per spec