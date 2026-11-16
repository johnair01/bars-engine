# Tasks: Farm seed item

## Spec kit
- [x] `spec.md` (from ffm-look-1, answer A, 2026-11-13)
- [x] `tasks.md`

## Build (waits on bars #732 for the `Seed` type)
- [ ] Add `path`, `charge`, `stone` and the reserved `fertilize` field to `Seed` in `src/lib/bar-to-work/seeds.ts`
- [ ] `pickup`, `open`, `stone` pure functions in `src/lib/between/farm.ts` with refusals
- [ ] Wire `act: 'pickup' | 'open' | 'stone'` into `POST /api/between/farm`; `till` returns the stone for a block-carrying seed
- [ ] Vitest cases in `src/lib/between/__tests__/farm.test.ts`
- [ ] Art direction pass for the pickup glow, the open pose and the stone (assets_here first)
- [ ] Seeds-panel states and an empty dashed Fertilize slot, built with the Impeccable skill; a look before ship
- [ ] Separate spec: the Challenger's mana-watering dissent
