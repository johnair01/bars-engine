# Tasks: Inner Garden — Action Economy & Farm Fertility

**Status: implemented (2026-07-12).** `npm run test:inner-garden-ontology` green.

- [x] **F1** `fertility.ts`: `FieldFertility`, `FertilityAction`, tuning constants block.
- [x] **F2** `crowding`, `isOvercrowded`, `growthMultiplier` (>0 even at fertility 0).
- [x] **F3** `applyFertilityAction` (plant/harvest/compost/tick), pure + clamped to [0,100] / ≥0.
- [x] **F4** `COMPOST_GAIN ≥ HARVEST_GAIN`; both free capacity.
- [x] **F5** `suggestTending` — compost proposal + regenerative reason when overcrowded/barren; null otherwise.
- [x] **F6** `__tests__/fertility.test.ts`: overcrowded-drains-faster; compost≥harvest; access-never-gated;
      suggestion-fires-when-overcrowded/barren; clamping/determinism.
- [x] **F7** Added to `test:inner-garden-ontology`; exported from `ontology/index.ts`.
- [ ] **F8** (later, needs a surface) Wire `tick`/actions into the daily loop; feed `growthMultiplier` into maturation.
</content>
