# Plan: Ember economy decomposition

primitives: ontology (StressTrack, ElementPool, five-move Deck, DaemonSpiritLineage, Vibulon minted only by a BAR)
footing: ee-decompose-map, ee-five-moves-not-wave, ee-charge-is-mana, ee-host-is-the-between, ee-ember-then-vibeulon
tier: Convened; the map was ruled on the board 2026-10-29, basis pass ember-economy-host 2026-10-28
scout: rung 1, nothing to build: the work is moving code that exists (mtgoa-game's engine and sim tests) and removing code that does; no tool is needed beyond the repo's own test runner and Prisma migrate
skills: design-ontology, six-faces, primitives, intake_check, brief-master, scout
skipped: better - the map arrived ruled item by item; nothing was left vague to deepen

## Constitution check

| Article | Verdict | Why |
|---|---|---|
| 1 Questions go to the board | pass | the map is ruled; the order and harvest location are council positions in the spec |
| 2 The player comes first | pass | nothing a player holds is destroyed; the felt loop is ember-to-vibeulon's |
| 3 Primitives and footing | pass | lines above |
| 4 Ontology invariants | pass | five moves in the record's order; WAVE stays the Open Up breath |
| 5 Cheapest proof first | pass | the sim tests run in place before the port (T001) |
| 6 Tool before build | pass | scout line above |
| 7 Something to see | pass | HARVEST.md, and the Open Up cards as a look before they ship |
| 8 Reserved items | pass | no prose of his, no money |
| 9 One session, one piece | pass | one retirement per PR; this session writes the spec only |
| 10 Transcend and include | pass | each layer gives up what it proved before it goes |

## Approach

Harvest PRs first (T001 to T005), then one retirement PR per layer, each naming the harvest PR it follows. Order:
mtgoa-game and understood-game (no runtime callers), charge-routing stubs (no callers), deck templates (only the audit
script reads them), then the two schema changes, which need migrations and the most care.

## Schema: DaemonSpiritLineage (for FR-004; drafted by T005)

A lineage row `{ id, playerId, daemonId?, betweenSpiritId?, betweenDaemonId?, companionName, createdAt }` points at the
Prisma `Daemon` and the Between's spirit or daemon row it joins. The Between's spirit owns what a player meets (look,
element, name); the Prisma `Daemon` owns the inner-work record (voice, desire, fear, shadow, evolutionLog). T005 checks
this against the live data shapes before any migration.

## Files touched

| File | Change |
|---|---|
| `.specify/specs/ember-economy-decompose/HARVEST.md` | new (T002) |
| `src/lib/ember-economy/harvest/` | new: stress, contagion, element pool, sim tests |
| `mtgoa-game/`, `understood-game/`, `tsconfig.json` | removed after harvest |
| `src/lib/deck-templates/` and `scripts/audit-deck-templates.ts` | five moves |
| `src/actions/charge-routing.ts` | stubs composted |
| `prisma/schema.prisma` + migrations | DaemonSpiritLineage; drop initialVibeulons |
| `src/actions/economy.ts`, `src/actions/story-bar.ts`, StarterPack creators | stop writing initialVibeulons |
