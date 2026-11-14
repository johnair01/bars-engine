# Spec: The lantern table, a brass machine you sit at to dissolve a real block

<!-- Architect and Regent sign this spec; the stages and their owners are in six-faces-council council/pipeline.yaml.
     The Game frame is six-faces-council council/callsheets/pipeline/lantern-hall/game-frame.md. -->

game: yes
intake: council/callsheets/lantern-hall.md

## The ask

> "I think everyone has access to the basic moves. They can pay mana/vibeulons to suggest a basic move at any time, but they can play their own bar in order to sweeten the pot. One gets a bigger portion of the pie if they use a bar versus a basic move" (Wendell, 2026-11-02, his note on `lh-hand`, answer "Both")

> "The intake is pretty bad. It's violating the rules of making thing as cards and dashboards. It's not immersive and needs another art direction pass" (Wendell, 2026-11-02, his note on `lh-table-look-1`)

**Who it is for:** a player with a real goal and a block in front of it; first, Wendell at the TDT director
application block (`lh-first-block`).
**What they feel now, and what should change:** port 1 (#513) made the intake a row of cards and chips under the
thumb, so the player filled in a form. After this, the player sits at a hex table in a dark hall, sets the goal and the
reservations into a brass machine with their hands, and watches the block come apart under moves that cost oil and pay
vibeulons.

## Purpose

The lantern table turns one block into a table game played on a brass machine. The player stamps the goal, twists the
ring to the desired feeling, pulls the weighted lever to the current feeling, flips five rim toggles for the truths and
notches six collars on the rising stones; the engine then deals six keeps, and the player spends oil and vibeulons on
moves until every emerged block has dissolved.

**Practice:** Deftness Development: spec kit first, contracts before the scene, a deterministic engine with no model call.

## Game type

GameOfSkill with GameOfPassion: the skill is spending 4 oil a watch well against keeps that grow when left alone; the
passion is that the block is the player's own and the payout is real vibeulons.

## Mechanic

`canon/mechanics/lantern-table.yaml` (six-faces-council, proposed on branch `claude/project-thread-fd6zq0` at 9d72af6,
stacked on council #800). A copy sits beside this spec as `lantern-table.mechanic.yaml` until that branch merges; the
canon file wins where they differ. Build B's hands from it: stamp a brass plate, turn the well's ring, pull the lead
lever, flip a toggle, press each cell so a stone rises, click a three-notch collar.

## Conceptual Model

| | The lantern table |
|---|---|
| WHO | the player (their own avatar, the Average Dusk walker per `lh-two-bodies`); marked stand-ins at a few other tables (`lh-hall-company`) |
| WHAT | one block, dealt as six keeps from the intake; basic moves for everyone; the player's BARs as the hand |
| WHERE | Lantern Harbour's lantern hall, a Between route; three altitudes: hall, board (top down), ground |
| Energy | 4 oil a watch; vibeulons once the oil is out; the payout in vibeulons set by the three sliders |
| Personal throughput | Clean Up at the intake (naming the fear), Grow Up on the board, Show Up when the block dissolves |

## Engine positions (the rules this build codes)

| Rule | Value | Source |
|---|---|---|
| Oil | 4 a watch, refilled when the watch turns | engine.ts (#505); Game frame |
| Basic move | costs 1 oil, strikes for 1, whatever its kind | `lh-hand-basic` |
| BAR (the player's own) | costs 1 oil, strikes for 2 when its kind matches the keep, 1 when it does not | `lh-hand-basic` |
| Vibeulon purchase | 1 vibeulon buys one basic move, only when oil is 0, at most 4 a watch | `lh-hand-basic`, `lh-buy-cap` |
| BAR mint | a BAR mints 1 vibeulon, spendable at the same table | engine.ts `story`, `lh-bar-mint` |
| Growth | an untouched keep's loops grow by 1 each watch, to 3 at most | engine.ts `tick` |
| Block cost | the sum of loop strengths; its starting size comes from the goal's size, charge and deadline | `lh-block-size` |
| Payout share | by refinement dealt; a BAR refinement weighs 2, a basic refinement weighs 1 | `lh-hand-share` |
| Victory | finding a block and dissolving one are each a minor win; the round is done when every emerged block has dissolved; completing the goal is the ultimate win | `lh-block-victory` |
| Free moves | read and "something stings" stay off the hand and cost nothing | `lh-hand-basic` |

## Hand positions

Every player holds the basic moves at any time. The player's own BARs are the hand on top: a BAR is the reel's story
move. A kibitzer at another table pays 1 oil to strike there. The payout is shared by weighted refinement, so a player
who plays a matched BAR takes a bigger share than one who buys basic moves (`lh-hand-share`, tune after two real tables).

## What the build contains

- **Table B as the brass machine:** a stamped goal plate at the far edge, a ring round the well, a lead weight on a
  short chain from the lever, five rim toggles, stones rising from pressed cells, and three-notch collars (foot Minor,
  belly Medium, shoulder Major). No cards, chips, trays or panels anywhere on the table or over it.
- **Camera:** from the seat to straight down over about 1.2 s, with no cut; reduced motion cuts to top-down.
- **Round 2's P1s:** the lantern hangs over the board as seen from the seat; fog on a keep is a fog, not a double
  exposure; each truth toggle says its channel; the collars do not read as buttons from above.
- **`lh-first-block`:** the first table is dealt from the TDT director application block (council money-block.md,
  mb-first-coin).
- **`lh-hall-company`:** a few other tables carry stand-in players, each plainly marked as a stand-in.
- **`lh-payout-sliders` A:** three brass sliders beside the director block set the goal's size, charge and deadline;
  together they set the block's starting size and the vibeulon payout, the rule for every later block.
- **From #513 (branch `claude/project-thread-cyzfea`, commit f3eb129), cherry-picked:** `src/app/lantern/page.tsx`,
  `src/lib/lantern/intake.ts` and `src/lib/lantern/__tests__/intake.test.ts`, `src/lib/lantern/pg-store.ts`, the
  `LanternTable` model in `prisma/schema.prisma`, migration `20261102050000_add_lantern_tables`, the
  `vitest.config.ts` line, and `GET/POST /api/lantern/table`. Dropped: `src/app/lantern/LanternIntake.tsx` and
  `src/app/lantern/lantern.css`, the card form he rejected.

## Contracts

### GET /api/lantern/table (route handler, from #513)

**Output:** `{ table: { id, intake } | null }`; 401 `{ error }` when signed out.

### POST /api/lantern/table (route handler, from #513)

**Input:** `{ id?: string, intake: Intake }` in the reel's intake/game shape. **Output:** `{ id }`; 400 when the intake
lacks a goal or six reservations; 404 when `id` is another player's table.

### Engine additions (`src/lib/lantern/engine.ts`)

```ts
type MoveType = /* existing */ | 'basic' | 'buy'          // 'story' stays the BAR
interface State { /* existing */ vibeulons: number; share: Record<string, number> }
function apply(prev: State, m: Move): State              // basic: oil-1, strike 1; buy: vibeulons-1 only at oil 0, strike 1
function payoutShare(s: State): Record<string, number>    // weighted refinement: BAR 2, basic 1, normalized to 1
function payout(sliders: { size: 1|2|3; charge: 1|2|3; deadline: 1|2|3 }): { blockSize: number; vibeulons: number }
```

`payout` is a draft sum shown at the look and tuned after two real tables (`lh-block-size`); the sliders are scene
objects that call it.

## User stories

### Sit and set the block

**As a player**, I want to sit at an empty hex table and set my goal and reservations with my hands, so the block is
mine and I never fill in a form. **Acceptance:** from the seat to a dealt table of six keeps with only hands on brass,
under 180 s, typing nothing unless I choose to.

### Spend the watch

**As a player**, I want 4 oil a watch to spend on basic moves and my own BARs, and to buy a basic move with a vibeulon
once the oil is out. **Acceptance:** each strike changes a stone I can see; an untouched keep grows when the watch turns.

### Get paid fairly

**As a player**, I want the payout shared by what I dealt, with my own BARs weighing more. **Acceptance:** the payout
names each contributor's weighted share.

### Verification quest

**As the steward**, I want a quest that walks the table once on the preview, so the build is checked as play.

## Requirements

- **FR-001** The route `/lantern` opens the hall at an empty hex table; the player sits and the camera rises from the
  seat to top-down in about 1.2 s with no cut (reduced motion: a cut).
- **FR-002** The intake is played on table B's brass machine in the order of `lh-intake-order`: stamped goal plate,
  well ring (gold), weighted lever (lead and intensity), five rim toggles that each say their channel, six cells whose
  stones rise when pressed, three-notch collars (foot Minor, belly Medium, shoulder Major). No card, chip, tray or panel.
- **FR-003** An untagged channel stays in fog on its keep, and a reservation switched off becomes a fogged keep; fog
  reads as fog, not as a double exposure.
- **FR-004** The engine charges a basic move 1 oil and strikes for 1, whatever its kind.
- **FR-005** The engine charges a BAR 1 oil and strikes for 2 when its kind matches the keep, 1 when it does not.
- **FR-006** The engine lets 1 vibeulon buy one basic move only when oil is 0, and refuses it otherwise.
- **FR-007** Oil refills to 4 when the watch turns; untouched keeps grow by 1, to 3 at most.
- **FR-008** The payout share weighs a BAR refinement 2 and a basic refinement 1.
- **FR-009** Finding a block and dissolving one each mark a minor win; the round ends when every emerged block has
  dissolved (`lh-block-victory`).
- **FR-010** The first table is dealt from the TDT director application block (`lh-first-block`).
- **FR-011** Three brass sliders beside the director block set size, charge and deadline, and set the block's starting
  size and the vibeulon payout (`lh-payout-sliders` A, `lh-block-size`).
- **FR-012** A few other tables carry stand-in players, plainly marked as stand-ins (`lh-hall-company`).
- **FR-013** The lantern hangs over the board as seen from the seat, and the collars do not read as buttons from above.
- **FR-014** The #513 files listed above are cherry-picked from f3eb129, and `LanternIntake.tsx` and `lantern.css` are not.
- **FR-015** A signed-in player's table saves through `POST /api/lantern/table` and reloads through GET.
- **FR-016** The verification quest `cert-lantern-table-v1` is seeded and plays through on the preview.
- **FR-017** The engine refuses a fifth vibeulon purchase in one watch (`lh-buy-cap`), and a BAR's minted vibeulon can
  buy a basic move at the same table (`lh-bar-mint`).

## Non-functional requirements

- The engine stays pure and deterministic; no model call anywhere in the table (dual track: it plays without AI).
- The scene holds a phone frame rate with the hall's other lanterns lit.
- The migration is additive (one new table); `db push` is never used.

## Persisted data & Prisma

| Check | Done |
|-------|------|
| `LanternTable` model named in this spec | yes |
| tasks.md cherry-picks migration `20261102050000_add_lantern_tables` with `schema.prisma` | yes (T002) |
| `npm run db:sync` and `npm run check` after the schema edit | T002, T016 |
| Human glanced at `migration.sql` (additive: one `CREATE TABLE`, one index) | at review |

## Design decisions

| Topic | Decision |
|---|---|
| Intake surface | brass machine on table B, his B on `lh-intake-look-1` ("Twist and switch") |
| Card form from #513 | dropped; his note on `lh-table-look-1` |
| Basic move kind | ignored for damage; only a BAR's kind matters (`lh-hand-basic`) |
| Vibeulon purchase | only at 0 oil, so oil stays the first budget and vibeulons the reserve |
| Payout sum | drafted on the sliders, shown at the look, tuned after two real tables (`lh-block-size`) |
| Stand-ins | marked plainly, never passed off as players (`lh-hall-company`) |

## Ontology

- `design_intent`: turn a real block in Wendell's work into a table game a person sits down to, so dissolving it feels like triumph and pays in vibeulons; first proof is the director application block (Diplomat)
- `intrinsic_pleasure`: the weight of the lever and the click of a notched collar (his B, "Twist and switch"), and fog lifting off a keep when a strike lands (Shaman)
- `ontology_objects`: Encounter (the table and its block), Transition (seat to board, hall to table), Artifact (BAR as the hand's strong move), Location lantern hall, Character (the player's avatar, marked stand-ins); mechanic lantern-table (proposed canon) (Sage)
- `mechanical_claims`: oil 4 a watch; basic 1 for 1 whatever its kind; BAR 1 for 2 on a matched kind; vibeulon buys a basic only at 0 oil; untouched keeps grow 1 a watch; block cost is the sum of loop strengths; payout share BAR 2, basic 1; sliders set block size and payout (Architect)
- `aqal_attention`: I (lead and gold feelings, a truth per channel); We (stand-ins now, kibitzers later); It (the brass machine and the engine's oil); Its (the vibeulon economy that pays every contributor) (Shaman)
- `agency_and_consent`: every intake step is a hand on brass, never a typed form; typing is optional context; a switched-off reservation becomes a fogged keep rather than being deleted; the player can stand and walk away at any step (Diplomat)
- `evidence_and_unknowns`: evidence: reel v6 scores (`feedback/m00`-`m23`), his picks lh-table-look-1 B and lh-intake-look-1 B, the lh-hand and lh-block-cost notes; unknown: the payout sum, whether the collars read as buttons from above, the phone frame rate with a lit hall (Sage)
- `provenance_effects`: keeps hex tables, the table as the board, walks with no cuts, the intake order and fog rule, the Average Dusk walker, #505's engine and #513's non-UI files; retires #513's card intake with his note as the reason (Regent)
- `risks_and_tests`: the machine drifting back into a panel of controls; a basic move whose strike still depends on its kind; test below (Challenger)
- `implementation_translation`: three.js scene at `/lantern` on the Between's kit, ported from ad2 dir B's `scene.html`; engine additions in `src/lib/lantern/engine.ts` with vitest; #513's route, intake, pg-store, model and migration cherry-picked (Architect)
- `decision_or_open_authority`: positions lh-hand-basic, lh-hand-share, lh-block-victory, lh-block-size, lh-buy-cap, lh-bar-mint; answers lh-intake-look-1 B, lh-payout-sliders A, lh-first-block A, lh-hall-company A; his look on the built table decides, and the payout sum stays open until that look (Regent)

## Reserved items

The payout sum is his to steer at the look (`lh-block-size`). Real money is not moved by this build; vibeulons only.

## Clarify

Every open point is answered by a position or a ruling on the record: the hand (`lh-hand`, "Both"), the block cost
(`lh-block-cost`, "Steer only"), the look (`lh-intake-look-1` B), the sliders, the first block and the hall company
(all A). This spec adds no board question.

## How we will know it failed

- **The cheap test, run before the build (run 2026-11-03):** `falsify-sim.ts` in this folder plays the hand positions
  on the merged engine's own `strike` and `tick` (#505), on a block of 12 refinements (six untagged keeps at strength
  2). Run with `node --experimental-strip-types .specify/specs/lantern-table/falsify-sim.ts`. Results:

  | Run | Watches to clear | Oil | Bought | Strikes a oil |
  |---|---|---|---|---|
  | A matched-BAR player, no purchases | 2 | 8 | 0 | 2 |
  | B basic player, no purchases | 4 | 16 | 0 | 1 |
  | C matched-BAR player spending its minted vibeulons | 1 | 4 | 4 | 3 |
  | D basic player with 8 saved vibeulons, no cap | 1 | 4 | 8 | 3 |
  | E basic player with 8 saved vibeulons, cap 4 a watch | 2 | 8 | 6 | 1.75 |
  | F matched-BAR player spending its mint, cap 4 a watch | 1 | 4 | 4 | 3 |

  The BAR's edge over a basic move is 2 to 1 in strikes a oil without the mint, and drifts to 3 to 1 when the minted
  vibeulon is spent at the same table (C). In weight a oil, a matched BAR earns 4 (two refinements at 2 each) against a
  basic move's 1, and 5 with its mint spent. Basic-only play takes twice the watches and pays growth: B dealt 16
  refinements on a 12 block.
- **The result that stops the work:** purchases let one player clear a block in one watch on banked vibeulons. Run D
  shows exactly that: 4 oil and 8 bought basic moves clear 12 in one watch, and growth never bites. So the stop result
  fired, and the build carries position `lh-buy-cap` (below): purchases a watch are capped at the oil, 4. Run E shows
  the cap holds the same player to two watches. Run F shows the cap leaves a matched-BAR player's one-watch clear
  intact, because it earned those vibeulons on the table, which is what `lh-hand` asks for.

## Positions from the falsify run

Both stand unless Wendell flips them; both are tuned after two real tables, as `lh-block-size` and `lh-hand-share` say.

- `lh-buy-cap` (position): a player buys at most 4 basic moves with vibeulons a watch, equal to the oil. Without it, a
  player with banked vibeulons clears a 12-refinement block in one watch (run D); with it, that player needs two (run E).
- `lh-bar-mint` (position): a BAR keeps the vibeulon mint #505 gives it, and that vibeulon may buy a basic move at the
  same table. The BAR's edge then reads 3 to 1 in strikes a oil (run C) rather than 2 to 1; the council keeps it,
  because his note on `lh-hand` asks that the BAR "sweeten the pot", and the look shows the ratio.

## Definition of done

- [ ] `npm run check`, the lantern vitest and `npm run build` pass.
- [ ] On the Vercel preview, `/lantern` seats the player, deals the director block, and plays a watch to a dissolved keep.
- [ ] The Impeccable critique of the table is run and its findings fixed.
- [ ] His look row is posted through `board/post_rows.py`, opened at the preview.

## Verification Quest

- **ID:** `cert-lantern-table-v1`
- **Steps:** 1, open `/lantern` on the preview and walk to the empty table; 2, sit and watch the camera rise with no
  cut; 3, stamp the goal, twist the ring, pull the lever, flip the toggles, press the cells and notch the collars; 4,
  set the three sliders beside the director block; 5, play a basic move and a BAR until the oil is out, then buy a
  basic move with a vibeulon; 6, dissolve one keep and read the payout share.

## Dependencies

#505 (engine, merged); #513's files on `claude/project-thread-cyzfea` f3eb129; council #800 and the ad2 round on
`claude/project-thread-fd6zq0` for the mechanic and B's `scene.html`.

## References

Six-faces-council: `council/callsheets/lantern-hall.md` (rulings lh-block-cost and lh-hand; handoff 2026-11-03 07:45Z);
`council/callsheets/pipeline/lantern-hall/game-frame.md`; `council/callsheets/stills/2026-11-02-lantern-intake-ad2/`
(fd6zq0). Prisma workflow: `.agents/skills/prisma-migration-discipline/SKILL.md`.

## Signed

<!-- One line per stage reached, naming every owner in council/pipeline.yaml. -->

- intake: shaman, diplomat (2026-11-03, from council/callsheets/lantern-hall.md `## Intake`)
- spec: architect, regent (2026-11-03)
- clarify: sage (2026-11-03; every point answered by a position or ruling, no board question)
- falsify: challenger (2026-11-03; falsify-sim.ts run: the stop result fired on run D, answered by lh-buy-cap)
- plan: architect, regent (2026-11-03)
- analyze: sage, challenger (2026-11-03; contract_check.py exits 0)
