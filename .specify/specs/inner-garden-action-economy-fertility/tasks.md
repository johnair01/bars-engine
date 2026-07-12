# Tasks: Inner Garden — Action Economy & Farm Fertility

- [ ] **F1** `fertility.ts`: `FieldFertility`, `FertilityAction`, tuning constants block.
- [ ] **F2** `crowding`, `isOvercrowded`, `growthMultiplier` (>0 even at fertility 0).
- [ ] **F3** `applyFertilityAction` (plant/harvest/compost/tick), pure + clamped to [0,100] / ≥0.
- [ ] **F4** `COMPOST_GAIN ≥ HARVEST_GAIN`; both free capacity.
- [ ] **F5** `suggestTending` — compost proposal + regenerative reason when overcrowded; null otherwise.
- [ ] **F6** `__tests__/fertility.test.ts`: overcrowded-drains-faster; compost≥harvest; access-never-gated;
      suggestion-fires-when-overcrowded; clamping/determinism.
- [ ] **F7** Add to `test:inner-garden-ontology`; export from `ontology/index.ts`.
- [ ] **F8** (later) Wire `tick`/actions into the daily loop; feed `growthMultiplier` into maturation.
</content>
