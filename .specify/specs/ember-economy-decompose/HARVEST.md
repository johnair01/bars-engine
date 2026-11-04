# Harvest: what the older layers proved

Written by tasks T001 to T005 of this folder's spec, 2026-11-04. Files were read at `bars-engine` main `1a835eb` (the commit
that merged #569); `mtgoa-game/` last changed at `e1fbcc1` (2026-10-19). Nothing is deleted by this pull request.

## T001: the sim tests, run in place before the port

`cd mtgoa-game && npm ci && npx vitest run` on 2026-11-04: **6 files, 53 tests, all pass.**

| Test file | Tests | What it reports |
|---|---|---|
| `src/engine/__tests__/engine.test.ts` | 8 | stress, contagion and metabolize fire when forced |
| `src/engine/__tests__/completability.sim.test.ts` | 1 | prints the outcome of real play; asserts nothing |
| `src/engine/trust/__tests__/trustCompletability.sim.test.ts` | 6 | trust engine L1 and L2: smart and safe-floor play both win |
| `src/engine/trust/__tests__/bossPriyaCompletability.sim.test.ts` | 6 | boss encounter: smart and safe-floor play both win |
| `src/engine/intake/__tests__/intakeCompletability.sim.test.ts` | 18 | every intake-built encounter is winnable |
| `src/engine/intake/__tests__/buildEncounter.test.ts` | 14 | intake to encounter synthesis |

The spec's file paths read `src/trust/` and `src/intake/`; the real folders are `src/engine/trust/` and
`src/engine/intake/`. This file uses the real ones.

## T003: where it went (H1 to H3)

Pure TypeScript under `src/lib/ember-economy/harvest/mtgoa/` (`engine/`, `data/`, `api/intake.ts` reduced to the
`IntakeConfig` type), with only the import paths changed, so the harvest is a faithful copy. `harvest/index.ts` names the
surface: `RULES` (stress track and contagion), `activeShadowCount`, `shadowsRevealed`, and the element pool operations
(`emptyPool`, `poolGet`, `addToPool`, `generateChannel`, `canSpend`, `spendChannel`, `metabolize`, `exile`). The root
`vitest.config.ts` runs `harvest/**/__tests__/*.test.ts`.

Result after the port, same command family in the root runner: **6 files, 53 tests, all pass**, and `tsc --noEmit` is clean
for the new files. The one change to a test: the original `completability.sim.test.ts` only printed, so the ported copy
pins the same result (below) with `expect`, which makes the spec's stop condition a failing test.

Not ported: the React screens (`StressBar.tsx`, `TrustEncounterScreen.tsx`, `IntakeConversation.tsx`), the AI call in
`api/intake.ts`, and the Vite app. They retire with `mtgoa-game/`.

| # | Harvest | Where it lives now |
|---|---|---|
| H1 | stress track 0 to 7, contagion at 3, deltas, shadows active by stress | `harvest/mtgoa/engine/rules.ts` (`RULES.stress`, `RULES.contagion`, `npcShadowActivation`), `combat.ts` |
| H2 | element pool | `harvest/mtgoa/data/channels.ts` (`ChannelPool`), `engine/alchemy.ts` |
| H3 | sim tests | `harvest/mtgoa/engine/**/__tests__/` and `engine/trust/simPolicies.ts` |

## H4: the Show Up finding (T004)

The old victory, ten Show Up BARs, cannot be reached. Run on 2026-11-04, every one of the six superpowers against Priya, real
starting deck, greedy policy, 100-turn cap:

```
Strategist    SOFTLOCK  converted:n  metab 0/6  showUp 0/10  stress P7/N4
Connector     SOFTLOCK  converted:Y  metab 3/6  showUp 1/10  stress P0/N2
Storyteller   SOFTLOCK  converted:n  metab 0/6  showUp 0/10  stress P7/N4
Alchemist     SOFTLOCK  converted:Y  metab 3/6  showUp 1/10  stress P0/N2
Disruptor     SOFTLOCK  converted:n  metab 0/6  showUp 0/10  stress P7/N4
Escape Artist SOFTLOCK  converted:n  metab 0/6  showUp 0/10  stress P7/N4
WINNABLE PATHS FOUND: 0 / 6
```

Why, as the code reads: Show Up rises by one only when an NPC light card with `showUpBar` resolves
(`gameState.ts:152`, `npcs.ts:537`, `combat.ts:79`), and the target is `RULES.victory.defaultShowUpTarget`, 10. Four of six
superpowers never convert her, and the two that do reach 1. This is my reading of the code; the sim shows the outcome, and
I did not trace each softlock turn by turn.

What replaced it: the trust model (`engine/trust/trustTypes.ts:3-6`, chosen 2026-06-12): trust earned by matching her need
channel, spent to dissolve shadows, win = convert her, touch all four domains, then the capstone. Its sims (trust L1/L2,
boss, intake) all reach a win with both smart and safe-floor play. The ported finding test is
`harvest/mtgoa/engine/__tests__/completability.sim.test.ts`. The ember-to-vibeulon spec cites this finding in its risks.

## H5: understood-game (nothing to port)

`understood-game/` is a two-person tabletop prototype for a relationship conflict: each player holds five chips of each of
five colors (red anger, green delight, blue sadness, black fear, white neutral), places one chip a turn into one of five
stacks, face up or face down; only the speaker decides a feeling was heard; releasing a heard chip lets its owner choose
between cooling the public conversation temperature or lowering their private 1 to 5 resolution meter. What it tried: a
private meter that only moves through being heard, against a public temperature the pair keeps cool together. That conflict
(private resolution against shared heat) is the one idea a later game could reuse; no code moves.

## H6: the starter decks (source for the five-move rebuild)

18 starter decks in `src/lib/deck-templates/starters/` (4 domain, 8 archetype, 5 nation, 1 onboarding), 145 cards in all: 36 `wake_up`, 36 `clean_up`, 36 `grow_up`, 37 `show_up`, no `open_up`
(`MoveType` at `index.ts:17` has four values). Every deck carries 2 cards of each move except `archetype-joyful-connector`,
which has 3 `show_up`. `playCost` runs 1 to 2 across all cards (81 cost 1, 64 cost 2); the audit script warns outside 1 to 4
(`scripts/audit-deck-templates.ts:134`). The rebuild adds `open_up` between `wake_up` and `clean_up` and reads `playCost` as
charge.

## H7: charge-routing's one implemented function

`createDaemonSeedFromBar(barId, name?, description?)` (`src/actions/charge-routing.ts:23`) calls `createFromBar`
(`src/services/daemon-seed-service.ts`), which creates a Prisma `Daemon` with `source: 'bar'`, `sourceBarId: barId`,
`voice` from the charge signature or description, `shadow` from the shadow function, `desire` from the gift potential. The
other three functions return `ROUTING_UNAVAILABLE`. The seed shape (a BAR becomes a Daemon whose voice, shadow and desire
come from the BAR) goes into the lineage design in `plan.md`.

## H8: the daemon shapes, mapped (T005)

See the schema section of `plan.md`. In short: the Prisma `Daemon` is the inner-work record; the Between's `BetweenDaemon.data`
is `{ owner, which, at, stay, history }` where `which` is one of seven kinds (protector, controller, skeptic, fixer, victim,
emotional-body, damaged-self, from `DAEMONS` in `public/between/garden.js:45`); `BetweenSpirit.data` is `{ owner, name,
element, form, note, at, care, away, fromSpark }`.

## H9: unconverted starter vibeulons: not measured

This session has no database access (no `DATABASE_URL`), so the count was not taken. It needs one read-only query against
production, which `ensureWallet` makes cheap to state:

```sql
SELECT count(*) AS players, coalesce(sum("initialVibeulons"), 0) AS vibeulons
FROM starter_packs WHERE "initialVibeulons" > 0;
```

(The model `StarterPack` maps to `starter_packs`; check the column's mapped name in the migrations before running.) Who writes the field today:
`story-bar.ts:66` increments it, `ensureWallet` (`economy.ts:17-35`) converts it to `legacy_migration` vibeulons and zeroes it,
and `conclave.ts:168`, `mga-auth.ts:110`, `campaign.ts:100` create packs at 0. FR-010 stays blocked on this number.
