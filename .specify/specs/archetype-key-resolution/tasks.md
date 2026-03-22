# Tasks: Archetype key resolution (EI)

- [x] `ARCHETYPE_KEY_TO_PLAYBOOK_SLUG` + resolvers in [`archetype-profiles.ts`](../../../src/lib/narrative-transformation/moves/archetype-profiles.ts)
- [x] Barrel [`archetype-keys.ts`](../../../src/lib/archetype-keys.ts)
- [x] Transformation / `selectMoves` / simulation use `resolvePlaybookArchetypeKey`
- [x] **Twine `CONFIRM_ARCHETYPE`**: when diagnostic emits `ARCHETYPE_KEYS` (e.g. `truth_seer`), resolve to playbook slug and match `Archetype` by `slugifyName(name)` — [`twine.ts`](../../../src/actions/twine.ts)
- [x] Reconciliation doc: [docs/architecture/archetype-key-reconciliation.md](../../../docs/architecture/archetype-key-reconciliation.md)
