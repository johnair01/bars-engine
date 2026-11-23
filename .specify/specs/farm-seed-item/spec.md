# Spec: Farm seed item (the five-moves path on the farm)

**Source:** council board look `ffm-look-1`, answered **A "Yes, map it as drawn"** by Wendell on 2026-11-13. Picture: `/mnt/project-files/looks/farm-five-moves-1/diagram.jpg` (board still `https://bars-engine.vercel.app/board/stills/2882779f1b05522e.jpg`). The Council pass is `farm-five-moves-1_2026-11-13`.

## Purpose

Every BAR a player sends to the farm (a game-asset idea or a personal-ops item, `src/lib/bar-to-work`, PR #732) walks one path, and each farm chore is one of the five moves. The player does the farm verb. The move is the small mark on it. This spec names the verb-to-move mapping and the three new pieces the farm lacks: the pickup, the open act and the stone. It writes no UI.

## The mapping (ruled)

| Move | Farm verb | State today | This spec |
|------|-----------|-------------|-----------|
| Wake Up | **Pick up the seed.** The dropped idea glows on the path or in the satchel; picking it up is the noticing. | new | `pickup` |
| Open Up | **Open the seed.** Held in both hands it shows its line; the player unpacks it and breathes qi into it. It becomes a charged seed with its kind of work. | new | `open` + `charge` |
| Clean Up | **Till, and clear.** The hoe breaks ground. If the seed carries a block the hoe strikes a stone: the player names it in one line or steps past it. Weeds later ask again. | built: `till`, weeds, `reclear`; new: stone | `stone` |
| Grow Up | **Fertilize.** A Game Master's reading worked into the soil. Optional. | later | named slot only, empty, no behavior |
| Show Up | **Plant, water with a real step, kneel, pick.** | built: `plant`, `water`, `ripen`, `pick` | unchanged |

One shift from the player's own wording, kept by the six faces: **tilling is Clean Up, not Show Up.** Weeds loop back to Clean Up while the seed grows. The harvest carries the seed's links to its spec and pull request.

## Seed states

The seed list is the one in `src/lib/bar-to-work/seeds.ts` (`BetweenPrivate` key `seeds`). Add a farm-path field beside `status` (which tracks the spec and PR lifecycle; leave it alone):

```ts
type SeedPath = 'dropped' | 'picked' | 'opened' | 'cleared' | 'planted' | 'ripe' | 'harvested'
type Stone = { line: string } | { passed: true } | null   // set only when the seed carries a block
// Seed gains: path: SeedPath; charge: number (0 until opened); stone: Stone; fertilize: null // reserved, never written here
```

Transitions, in order, each one write to the farm doc or seeds doc:

1. `dropped -> picked` : `pickup(seedId)`. Marks Wake Up. No cost.
2. `picked -> opened` : `open(seedId, line)` then `charge`. The line is the seed's one line (one word is enough, same rule as `plant`). Opening shows the unpacking prompts; charging is a single breath action with no mana cost. Marks Open Up; sets `charge`.
3. `opened -> cleared` : `till(slot)` as today (5 mana). If the seed carries a block (the BAR sort or the player flagged one), `till` returns a stone instead of finishing: `stone(seedId, line)` names it in one line, or `stone(seedId, { passed: true })` steps past it. Both finish the till. Passing is allowed and recorded, never scolded.
4. `cleared -> planted -> ripe -> harvested` : `plant`, `water`, `ripen`, `pick` unchanged. Harvest keeps `specUrl` and `prUrl`.

A block flag is data, not a quiz: it comes from the BAR's own sort result or from the player's choice at Open. The farm never asks "do you have a block?" as a form (Wendell, 2026-11-15: no forms).

## Decisions and limits

- **No new route.** Pickup, open and stone are verbs on the existing `POST /api/between/farm` (`act: 'pickup' | 'open' | 'stone'`), pure functions in `src/lib/between/farm.ts`, tested like `till` and `plant`.
- **Fertilize is an empty slot**, shown as a dashed, unlabeled place on the seed card. No mana, no mint, no API. Its own spec comes later.
- **Mana watering stays as built** (1 mana, once a day). The Challenger dissents: mana watering lets a seed grow with no real step. That goes to the farm's next spec and is not decided here.
- **Stone text is private** to the player; it never becomes a public BAR.
- Cost of `open`, `charge` and `stone` is zero mana and zero vibeulon. Only `till` (5), `water` (1) and the harvest mint (1 vibeulon) cost or pay anything, as today.

## Acceptance

- A seed moves `dropped -> picked -> opened` with no way to open an unpicked seed or plant an unopened one.
- Tilling a block-carrying seed ends in `stone` or a passed stone; tilling a seed with no block is unchanged.
- Existing farm tests pass; new vitest cases cover the three new verbs and their refusals.
- Needs a look at the farm panel on a phone before it ships (Council Board v2 and the aesthetic contract apply).

## Not in this spec

Fertilize behavior, the Challenger's mana-watering fix, art for the pickup glow, the stone and the open pose, and any Seeds-panel layout.

**Next owner + wake:** a Sonnet build thread on the next lane round, once council #1368's slice (bars #732) is merged, since `Seed` comes from it.
