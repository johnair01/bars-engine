# Tasks: Remove Deprecated Nations (Veritas + Metal)

**Priority: HIGH** — these deprecated nations are polluting seed data and creating ghost state.

## What needs removing

| Nation | Issue |
|---|---|
| **Veritas** (`cmlsprx5s00003i34izxhq4la`) | No longer in the game; 1 NPC was reassigned to Meridia |
| **Metal** (`cmlsweszd0001xsgpoe9jaoii`) | Placeholder; 1 NPC was reassigned to Lamenth |

## Tasks

- [ ] **DN-1**: Audit all players assigned to Veritas or Metal nations
  - `SELECT id, name FROM players WHERE "nationId" IN ('cmlsprx5s00003i34izxhq4la', 'cmlsweszd0001xsgpoe9jaoii')`
  - Reassign to canonical nations based on archetype/lore fit, or null out nationId if ambiguous

- [ ] **DN-2**: Audit all CustomBars with `nation = 'Veritas'` or `nation = 'Metal'`
  - These are thematic nation tags on BARs — clear or remap

- [ ] **DN-3**: Audit NationMoves, NationMoveUnlocks, PlayerNationMoveUnlock tied to these nations
  - Determine if any moves need migrating or can be deleted

- [ ] **DN-4**: Remove the Nation records from the DB
  - Only after all FK references are cleared or nulled

- [ ] **DN-5**: Remove Veritas and Metal from any seed scripts, YAML files, or hardcoded nation arrays in the codebase
  - Check: `seed-*.ts`, `seed-*.yaml`, any file with `Veritas` or `"Metal"` as a nation name

- [ ] **DN-6**: Confirm `npc-name-grammar.ts` CANONICAL_NATIONS array matches (already done: only 5 nations listed)

- [ ] **DN-7**: Update any admin UI dropdowns or filter arrays that list all nations

## Canonical nations (the five)

- Argyra (Metal element, Silver City)
- Pyrakanth (Fire element, Burning Garden)
- Lamenth (Water element, Weeping Stone)
- Virelune (Wood element, Green Moon)
- Meridia (Earth element, Golden Noon)
