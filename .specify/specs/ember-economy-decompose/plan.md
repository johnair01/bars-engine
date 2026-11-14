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

## Schema: DaemonSpiritLineage (for FR-004; drafted by T005, checked against the live shapes 2026-11-04)

The three shapes it joins, as they stand:

- Prisma `Daemon` (`prisma/schema.prisma:1103`, table `daemons`): `id`, `playerId`, `name`, `source`, `sourceBarId?`, `level`,
  `moveIds` (JSON string), `voice?`, `desire?`, `fear?`, `shadow?`, `evolutionLog` (JSON string), `channel`, `altitude`,
  `collective`, `communityScope?`, `promotedToPlayerId?`, `shadow321SessionId?`, `innerWorkDigest?`. It is the inner-work record.
- `BetweenDaemon` (`:5304`, table `between_daemons`, key `gardenId` + `id`): `ownerId` and `data` JSON
  `{ owner, which, at, stay, history }`, where `which` is one of seven kinds (protector, controller, skeptic, fixer, victim,
  emotional-body, damaged-self; `DAEMONS` in `public/between/garden.js:45`). It has no link to a `Daemon` row today.
- `BetweenSpirit` (`:5291`, table `between_spirits`, same key): `ownerId` and `data` JSON `{ owner, name, element, form
  (fox or tortoise), note, at, care?, away?, fromSpark? }`. The spirits are the companions a player meets.

One new model joins them, because the two Between tables key on `gardenId` + `id` and hold their data as JSON, so a foreign
key cannot point at them:

```
model DaemonSpiritLineage {
  id                String   @id @default(cuid())
  playerId          String   // the owner; cascade with Player
  daemonId          String?  // Prisma Daemon, the inner-work record
  betweenGardenId   String?  // with the two ids below, names the Between row
  betweenSpiritId   String?  // the companion a player meets
  betweenDaemonId   String?  // the Between's daemon kind, if one was brought in
  companionName     String   // what the player calls the pair
  createdAt         DateTime @default(now())
  @@index([playerId])
  @@index([daemonId])
  @@map("daemon_spirit_lineages")
}
```

Which side owns which field: the spirit owns what a player meets (name, element, form, care); `Daemon` owns the inner work
(voice, desire, fear, shadow, evolutionLog, level, moveIds, channel, altitude). The lineage owns only the pointers and the
companion name; it copies no field from either side. The H7 seed (a BAR becomes a `Daemon` whose voice, shadow and desire come
from the BAR) stays how a `Daemon` starts; the lineage row is written when the player first brings that daemon into the Between.

Open items the migration PR (FR-009, T010) must settle, not this spec: `Daemon.channel` is an upper-case element string
(default `METAL`) while `BetweenSpirit.data.element` is title case (`Fire`), so one mapping function owns the conversion; and the
Between rows have no table-level link to a player's `Daemon`, so the backfill matches by `ownerId` and name and leaves
unmatched rows unlinked rather than guessing.

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
