# Spec: Farm tools (what the tool box holds next, and how a tool arrives)

**Source:** council board rows `farm-tools-intake-1` and `farm-tools-intake-2`, both answered by Wendell on 2026-11-23. Strand sheet: `farm-tools` in the council store (`council/callsheets/farm-tools.md`). This is a stub. It names what is ruled and what is open, and it builds nothing.

## Purpose

The tool box holds five tools today: hoe, watering can, trowel, sickle and gloves, one for each thing the farm already lets a player do (`public/between/farm/farm.js`). This spec names the next set and how each tool reaches the player.

## Ruled (his words)

- `farm-tools-intake-1`, "Which tools should the farm add after the hoe, watering can, trowel, sickle and gloves?": **B, Gathering and making tools**, with his note: "Care tools: Compost Bin\ngathering and making tools as well. as well as tools that level up". He chose more than one option, so all three families are in scope.
- `farm-tools-intake-2`, "How should a new tool arrive in the player's tool box?": **C, A tool is found or given.** Villagers and the world hand tools to the player. No tool comes from a player's BAR, and none from a fixed order every player shares.

## The set

| Family | Tool | Note |
|--------|------|------|
| Care | Compost bin | Turns spent crops into soil. Keeps the rule that untended crops can die. |
| Gathering | Axe | Wood. |
| Gathering | Pickaxe | Stone. |
| Gathering | Fishing rod | Fish. |
| Making | Workbench | Where gathered things are made into other things. |
| Growth | Use-based level | Any tool improves with use, for example the hoe digs a wider bed after enough tilling. |

The five tools stay as they are (Regent keep line). Stamina does the work, and untended crops can still die.

## How a tool arrives

- **Given:** a villager hands the player the tool, in the way the Elder already hands BARs on the farm.
- **Found:** the world holds the tool in a place on the farm the player comes across.
- This fits `canon-farm-feel` (Stardew Valley and Harvest Moon, where a villager hands over a tool and the world hides others) and `canon-capture-is-barseed` (a capture stays a seed and does not become a tool).

## Open, and not decided here

1. Which villager gives which tool. The first-giver question is board row `farm-tools-giver-1`. Until he answers, no tool has a giver in this spec.
2. What finding looks like (a spot on the farm that glows, a gift on a doorstep). Waits on art direction and a look.
3. What a level costs and shows: uses counted, one number per tool, and the first effect for each tool. Not designed.

## Limits

- No new route yet. A tool the player holds is data on the farm doc (`src/lib/between/farm.ts`); the shape is decided at the build step, after the giver row.
- No forms (Wendell, 2026-11-15). A tool arrives by hand-over or discovery, never by a menu.
- Any change to what a player sees is built with the Impeccable skill and has a look before ship (Council Board v2, aesthetic contract).

## Acceptance (for the later build)

- A player who has not met the giver or found the spot does not hold the tool.
- Each of the new tools has one use on the farm that a vitest case covers.
- A tool's level rises with use and never falls, and the five existing tools behave as today.

## Not in this spec

Art for the tools and the hand-over, the finding spots, the levels' numbers, trading and selling.

**Next owner + wake:** Wendell's answer on `farm-tools-giver-1`; then an Opus pass for the giver map and art direction.
