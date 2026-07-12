# Plan: Inner Garden — Action Economy & Farm Fertility

Pure lib; no renderer, no cron, no persistence. Framed by the Abundance ↔ Cultivation polarity.

## Phase 1 — Fertility core (`src/lib/inner-garden/ontology/fertility.ts`)
- `FieldFertility { capacity, activeSeeds, fertility }`; `FertilityAction`.
- `crowding`, `isOvercrowded`, `growthMultiplier` (never 0).
- `applyFertilityAction` (plant/harvest/compost/tick), pure + clamped.
- Tuning constants in one block: `PLANT_COST`, `HARVEST_GAIN`, `COMPOST_GAIN (≥ HARVEST_GAIN)`,
  `DECAY_BASE`, `DECAY_PER_CROWD`.
- `suggestTending` (compost proposal + regenerative reason; null when healthy).

## Phase 2 — Tests (`__tests__/fertility.test.ts`)
- Overcrowded drains faster; compost ≥ harvest; access never gated at fertility 0;
  suggestion fires only when overcrowded; clamping/determinism.
- Add to `npm run test:inner-garden-ontology`.

## Phase 3 — Wire-in (later, separate)
- The daily loop calls `tick` once/day per field; plant/harvest/compost call `applyFertilityAction`.
- `growthMultiplier` feeds seed maturation quality. (Not in this pure-lib slice.)

## Verify
- `npm run test:inner-garden-ontology` green.
- n=1 dogfood: over-plant for a few days; confirm crowding→compost reads as a nudge, not a punishment.
</content>
