# Spec: Ember economy decomposition, harvest then retire

game: yes
intake: council/callsheets/ember-economy.md
game frame: council/callsheets/pipeline/ember-economy/game-frame.md (wendell-britt/six-faces-council)

## The ask

> "What I'm cooking up is meant to connect to the hollow and the nook and the between and will be expanded out from
> there. Many older versions need to be deprecated and decomposed." (Wendell, 2026-10-28, in the skill-tree design
> thread)

His ruling on the Council Board, 2026-10-29: `ee-decompose-map` A, "Yes, this map".

**Who it is for:** the player in the Between, who should meet one economy (embers, vibeulons, gold) instead of five
half-built ones, and every session that builds on bars-engine, which should find one live path per idea.
**What they feel now, and what should change:** a player can be handed vibeulons from a starter pack, from story quests
and from BARs, and meets moves in four-move decks that skip Open Up. After this, every vibeulon comes from a BAR, every
deck has five moves, and the old games' lessons live in the code that ships instead of in apps nobody runs.

## Purpose

Write down the ruled decomposition map as an ordered list of harvests and retirements, so each older layer gives up what
it proved before anything is deleted. This spec deletes nothing; each retirement is its own small pull request after
its harvest has landed.

## Design Decisions

| Decision | Choice | Whose |
|---|---|---|
| The map | The six items below, as ruled | Wendell, ee-decompose-map A, 2026-10-29 |
| Order | Harvest before delete, item by item; a retirement PR names the harvest PR it follows | Wendell's ruling text ("harvests before it deletes anything") |
| Where harvested mechanics go | Pure TypeScript modules under `src/lib/ember-economy/harvest/`, each with its sim tests ported beside it; findings in `HARVEST.md` in this folder | council |
| The host | The Between, not the standalone apps (host-is-the-between) | council position, stands |
| Deck moves | Five moves in the record's order: Wake Up, Open Up, Clean Up, Grow Up, Show Up; `playCost` reads as charge | Wendell's map item 3; ee-five-moves-not-wave, ee-charge-is-mana (positions, stand) |
| Daemon join | One lineage: the Prisma `Daemon` and the Between's `BetweenDaemon` / `BetweenSpirit` rows meet in `DaemonSpiritLineage`; the Between's spirits are the companions | Wendell's map item 5 |
| Starter vibeulons | `StarterPack.initialVibeulons` retires; every vibeulon comes from a BAR | Wendell's map item 6 |
| Story quest rewards | `completeStoryBar` stops adding to `initialVibeulons`; a story BAR mints through the BAR path of ember-to-vibeulon | council (follows item 6) |
| Existing wallets | Vibeulons already held stay; `ensureWallet`'s legacy conversion runs once more and then retires | council (nothing a player holds is destroyed) |

## Conceptual Model

- **WHO:** the player in the Between; the sessions that maintain bars-engine.
- **WHAT:** six older layers, each with a harvest (what it proved) and a retirement (what is removed).
- **WHERE:** `mtgoa-game/`, `understood-game/`, `src/lib/deck-templates/`, `src/actions/charge-routing.ts`, the
  `Daemon` and Between daemon/spirit models, `StarterPack.initialVibeulons`.

## The harvest list (first)

| # | Layer | Harvest (lands first) | Where it is today |
|---|---|---|---|
| H1 | mtgoa-game | the stress track and its contagion (`contagionThreshold: 3`) | `mtgoa-game/src/engine/rules.ts:11-15`, `src/components/StressBar.tsx`, `src/engine/combat.ts` |
| H2 | mtgoa-game | the element pool | `ChannelPool` in `mtgoa-game/src/data/channels.ts:69`; `emptyPool`, `poolGet` in `src/engine/alchemy.ts:12-17` |
| H3 | mtgoa-game | the sim tests | `src/engine/__tests__/completability.sim.test.ts`, `src/trust/__tests__/trustCompletability.sim.test.ts`, `bossPriyaCompletability.sim.test.ts`, `src/intake/__tests__/intakeCompletability.sim.test.ts`, `src/trust/simPolicies.ts` |
| H4 | mtgoa-game | the finding that the Show Up victory is unwinnable, and the trust model that replaced it | `src/trust/trustTypes.ts:3-6`, `src/intake/buildEncounter.ts:7`, `.specify/specs/trust-encounter-loop/spec.md:33` |
| H5 | understood-game | nothing to port; one paragraph in HARVEST.md on what its chip-and-meter conflict tried | `understood-game/src/main.tsx` |
| H6 | deck templates | the 18 starter decks' card text and costs, as the source for the five-move rebuild | `src/lib/deck-templates/index.ts:17,38`, `src/lib/deck-templates/starters/` |
| H7 | charge-routing.ts | `createDaemonSeedFromBar`'s seed shape, the one implemented function, into the lineage design | `src/actions/charge-routing.ts:23` |
| H8 | daemons | the Prisma `Daemon` fields (voice, desire, fear, shadow, evolutionLog, level, moveIds) mapped onto the Between's spirit data | `prisma/schema.prisma:1103`, `BetweenDaemon` (:5304), `BetweenSpirit` (:5291), `DAEMONS` in `public/between/garden.js:45` |
| H9 | starter vibeulons | the count of players holding unconverted `initialVibeulons`, before the field retires | `src/actions/economy.ts:17-35` |

## Functional Requirements

### Phase 1: Harvest

- **FR-001** `HARVEST.md` in this folder records H1 to H9: for each, what it proved, where it now lives, and the commit it was read at.
- **FR-002** The stress track with contagion (H1) and the element pool (H2) are ported to `src/lib/ember-economy/harvest/` as pure modules, with the sim tests (H3) ported beside them and passing under the repo's test runner.
- **FR-003** The Show Up finding (H4) is written into HARVEST.md with the sim result that proved it, and cited from the ember-to-vibeulon spec's risks.
- **FR-004** `DaemonSpiritLineage` is specified (data shape, which side owns which field, how a Prisma `Daemon` and a Between spirit point at one lineage) in a schema section of this spec's plan before any migration.

### Phase 2: Retire, one pull request each, after its harvest

- **FR-005** `mtgoa-game/` is removed from the repo and from `tsconfig.json`'s exclude list, after FR-002 and FR-003 land.
- **FR-006** `understood-game/` is removed, after H5 is in HARVEST.md.
- **FR-007** The deck templates are rebuilt with five moves: `MoveType` gains `open_up` in the record's order, every starter deck carries Open Up cards, and `playCost` is documented and read as charge; `scripts/audit-deck-templates.ts` checks all five.
- **FR-008** The four unwired stubs in `charge-routing.ts` (`convertBarChargeToVibeulon`, `allocateBarChargeToQuest`, `attachBarToQuest`, `attachBarToBar`) are composted; `createDaemonSeedFromBar` moves into the lineage work or is composted with them.
- **FR-009** The Prisma `Daemon` and the Between's daemon and spirit rows are joined through `DaemonSpiritLineage` by migration (never `db push`), with the Between's spirits as the companions a player meets.
- **FR-010** `StarterPack.initialVibeulons` retires: no code writes it, `completeStoryBar` mints through the BAR path, `ensureWallet` converts what remains once, then the column is dropped by migration.

## Non-Functional Requirements

- No retirement PR deletes anything its harvest has not landed; each names the harvest PR it follows.
- Nothing a player holds is destroyed: existing vibeulons, daemons and spirits survive every step.

## Persisted data & Prisma

This spec changes no schema. FR-009 adds `DaemonSpiritLineage` and FR-010 drops `StarterPack.initialVibeulons`, each by
`npx prisma migrate dev` in its own pull request, followed by `npm run db:record-schema-hash`.

## Verification Quest

n/a for this spec PR: nothing a player sees changes. Each retirement PR carries its own check: the Between plays as
before on its preview, and a fresh player's wallet starts at zero and gains its first vibeulon from their first BAR.

## Ontology

- `design_intent`: one economy and one live path per idea, so the player meets embers, vibeulons and gold each with one job, all in the Between (Diplomat).
- `intrinsic_pleasure`: n/a: this spec changes nothing a player feels; the felt loop is ember-to-vibeulon's (Shaman).
- `ontology_objects`: StressTrack and its contagion (harvested); ElementPool (harvested); Deck of five moves with charge as cost; DaemonSpiritLineage (new join); Vibulon, now minted only by a BAR (Sage).
- `mechanical_claims`: removes two vibeulon faucets (starter packs, story quest increments) so the BAR is the only one; adds Open Up to every deck; removes four stubs that claim routes they do not have (Architect).
- `aqal_attention`: Its first: the codebase's structure; I and We are protected by keeping every player's holdings and spirits through each step (Shaman).
- `agency_and_consent`: no player loses anything they hold; no retirement removes a choice a player has today except the starter pack's free vibeulons, which ruled item 6 retires (Diplomat).
- `evidence_and_unknowns`: the map is ruled (ee-decompose-map A); file locations read at 4e13376; unknown: how many players still hold unconverted starter vibeulons (H9 measures it) (Sage).
- `provenance_effects`: every harvested module names the file and commit it came from; every retirement PR names its harvest PR; existing vibeulons keep their `originSource` (Regent).
- `risks_and_tests`: deleting mtgoa-game before its sim tests port loses the proof that Show Up is unwinnable; the rule harvest-before-delete and FR-005's dependency hold it (Challenger).
- `implementation_translation`: `mtgoa-game/`, `understood-game/`, `tsconfig.json`, `src/lib/deck-templates/`, `scripts/audit-deck-templates.ts`, `src/actions/charge-routing.ts`, `prisma/schema.prisma`, `src/actions/economy.ts`, `src/actions/story-bar.ts` (Architect).
- `decision_or_open_authority`: the map is his (ruled 2026-10-29); the order, the harvest location and the story-quest change are the council's and stand unless he flips them (Regent).

## Reserved items

Open Up card text in the five-move decks is game content written by the council and shown to him as a look before it
ships; none of his prose is touched. No money or paywall. None beyond that.

## How we will know it failed

- **The cheap test, run before building:** run mtgoa-game's four sim tests in place today and record that they pass; then, after the port, the same tests pass against `src/lib/ember-economy/harvest/` with the same results.
- **The result that stops the work:** if a ported sim test gives a different result from the original, the harvest has changed the mechanic, and `mtgoa-game/` is not deleted until it matches.

## Definition of done

- [ ] HARVEST.md lists H1 to H9
- [ ] the ported sim tests pass; `npm run check` and `npm run build` pass
- [ ] each retirement PR lands after its harvest PR; the Between plays on its preview

## Dependencies

- `.specify/specs/ember-to-vibeulon/` (the BAR mint that replaces the starter and story faucets).
- `.specify/specs/trust-encounter-loop/` (the trust model that came out of the Show Up finding).

## References

- council: `council/passes/6FACE_PASS_ember-economy-host_2026-10-28.md`, `council/callsheets/ember-economy.md`
- board rows: ee-decompose-map, ee-five-moves-not-wave, ee-charge-is-mana, ee-host-is-the-between

## Signed

- intake: shaman, diplomat (2026-11-04)
- spec: architect, regent (2026-11-04)
- clarify: sage (2026-11-04)
- falsify: challenger (2026-11-04)
- plan: architect, regent (2026-11-04)
- analyze: sage, challenger (2026-11-04)
