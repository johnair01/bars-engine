# Spec: Ember to vibeulon, the loop in the Nook and the Hollow

game: yes
intake: council/callsheets/ember-economy.md
game frame: council/callsheets/pipeline/ember-economy/game-frame.md (wendell-britt/six-faces-council)

## The ask

> "Yes an ember is the story world version of a vibeulon before players start being able to mint vibeulons. Vibeulons
> get minted when bars are generated so the embers are fuel for vibeulons Open up is newer the codebase has drifted a
> bit. What I'm cooking up is meant to connect to the hollow and the nook and the between and will be expanded out from
> there." (Wendell, 2026-10-28, in the skill-tree design thread)

His rulings on the Council Board, 2026-10-29, all A: `ee-qi-role` "Qi is the meter your embers fill",
`ee-bar-mint-stake` "The BAR mints a vibeulon and stakes it on itself", `ee-bar-making-opens` "After their first worked
charge, in the Nook".

**Who it is for:** a player in the Between, working their own charge at the Nook's hearth, and the other player who
shares the Hollow with them.
**What they feel now, and what should change:** today an ember is kept and nothing grows from it that another person
can use, and the first public BAR costs a vibeulon the player may not have. After this, each worked charge brightens
their own room, and the first BAR they make to give away pays for itself.

## Purpose

Join the Between's ember to the BAR economy in one loop. One worked charge leaves one ember; the room's light (qi)
counts the embers kept; after the first worked charge the player can light a lantern from an ember, which makes a BAR
and mints one vibeulon; hanging the lantern in the Hollow publishes the BAR and stakes that vibeulon on it instead of
burning one.

## Design Decisions

| Decision | Choice | Whose |
|---|---|---|
| Embers per worked charge | One, whatever its glow; glow stays private and sets nothing | council position ee-glow-sets-nothing (stands) |
| What qi is | The meter embers fill: it reads the embers kept and is never spent | Wendell, ee-qi-role A, 2026-10-29 |
| Where qi shows | The room's own light (hearth and lamps), not the sky; the sky stays lit by the Between's health | council position ee2-qi-is-nook-light; the sky is Wendell's yes on uu-between-clock-look-1, 2026-11-02 |
| Qi in the Hollow | The Hollow's light reads both members' kept embers together, as one number; each one's count and glow stay private | council position ee2-hollow-light-shared |
| Does a lantern use up its ember | No: the ember's state turns `lit` and still counts toward qi, so making a BAR never dims the room | council position ee2-one-ember-per-lantern |
| What makes a BAR in the Between | Lighting a lantern from a kept ember | proposed: board ee2-lantern-is-bar |
| BAR mint | Making a BAR mints one vibeulon to its maker, `originSource: 'bar_mint'`, `originId` = the BAR id | Wendell, ee-bar-mint-stake A |
| Publish | The vibeulon the BAR minted is staked on it (`stakedOnBarId`); the burn in `create-bar.ts` retires | Wendell, ee-bar-mint-stake A |
| When BAR-making opens | After the player's first worked charge, in the Nook | Wendell, ee-bar-making-opens A |
| Taking a lantern back or composting it | Releases the stake: `stakedOnBarId` cleared, the vibeulon spendable again | council (the pass: "nothing the player made is destroyed") |
| Bounty mode in `createQuestFromWizard` | Unchanged; a bounty still escrows `stake` vibeulons into its pool | council (out of scope; it is a payment, not the anti-spam stake) |

## Conceptual Model

- **WHO:** the player (maker), the other member of the Hollow.
- **WHAT:** Ember (BetweenPrivate pouch, `{move, feel, glow, state, at, lantern}`), Qi (a Meter, derived, never stored),
  Lantern (the Between's face of a BAR, a CustomBar row), Vibulon (minted by the BAR, staked on it when public).
- **WHERE:** `/ontology-game/between`: the Nook (hearth, lantern hook) and the Hollow (where lanterns hang).
- **Primitives:** ontology objects Ember, Qi as Meter, Lantern = BAR, Vibulon; mechanics already built in the Between:
  the hearth sit (`sitAtHearth`, `keepEmber` in `public/between/garden.js`) and the lantern offer (cc-lantern-offer).

## API Contracts (API-First)

### `mintBarVibulon(tx, { barId, playerId, title })` (server, `src/lib/economy/bar-mint.ts`)

Inside the BAR-creation transaction, creates one `Vibulon` `{ ownerId: playerId, creatorId: playerId, originSource:
'bar_mint', originId: barId, originTitle: title }` and one `VibulonEvent` `{ source: 'bar_mint', amount: 1 }`. Returns
the vibeulon id.

### `stakeBarVibulon(tx, { barId, vibulonId })` and `releaseBarStake(tx, { barId })`

Stake sets `stakedOnBarId = barId` on the BAR's own vibeulon and writes `VibulonEvent { source: 'bar_stake', amount: 0 }`
(no value leaves the wallet). Release clears it and writes `source: 'bar_stake_release'`. Wallet balance counts only
vibeulons with `stakedOnBarId = null`.

### `POST /api/between/[gardenId]/lantern` `{ emberAt }` and `{ emberAt, hang: true }`

Lights a lantern from the caller's kept ember (`emberAt` names it in the pouch). Refuses with 409 `not_yet` until the
caller's pouch holds one worked ember (FR-004). Creates the BAR (`createCustomBar` path, private), mints its vibeulon,
sets the ember's `state: 'lit'` and `lantern: <barId>`. With `hang: true` (the lantern carried to the Hollow), the BAR
turns public and its vibeulon is staked. Response: `{ barId, vibulonId, staked }`. No ember text, feel or glow is
written to any shared row (cc-pouch-private).

## User Stories

### P1: The room grows with the work

**As a player**, I want my Nook to get brighter each time I keep an ember, so I can feel my own tending without a score.
**Acceptance:** after keeping an ember at the hearth the Nook's hearth and lamp light step up once; a heavy and a light
charge raise it the same; the sky does not change because of it.

### P1: My first lantern

**As a player who has just worked their first charge**, I want a lantern I can light from that ember, so what I made
can become something I can give.
**Acceptance:** before the first kept ember there is no lantern hook; after it, lighting a lantern creates a private BAR
and my wallet shows one more vibeulon whose origin is that BAR.

### P2: Offering it costs me nothing I made

**As a player**, I want to hang my lantern in the Hollow without burning a vibeulon, so giving is not a loss.
**Acceptance:** hanging the lantern makes the BAR public; the vibeulon shows as staked on it; my spendable balance drops
by that one and my total does not; taking the lantern back returns it to spendable.

## Functional Requirements

### Phase 1: The mint and the stake (server)

- **FR-001** Making a BAR through `createCustomBar` or `createQuestFromWizard` mints exactly one vibeulon to its maker,
  `originSource: 'bar_mint'`, `originId` = the BAR id, in the same transaction.
- **FR-002** Publishing a BAR (visibility `public`, at creation or later) stakes the vibeulon that BAR minted
  (`stakedOnBarId`) and deletes no vibeulon; the two `quest_creation_stake` burns in `src/actions/create-bar.ts`
  (lines 257-289 and 641-668 at 4e13376) are removed. A public BAR never falls back to private for lack of balance.
- **FR-003** Taking a public BAR back to private, composting it, or archiving it clears its stake and writes a
  `bar_stake_release` event; spendable balance counts only unstaked vibeulons, everywhere a balance is read.

### Phase 2: Embers, qi and the lantern (the Between)

- **FR-004** The lantern hook appears in the Nook, and `POST .../lantern` succeeds, only once the player's pouch holds
  at least one kept ember from a worked charge.
- **FR-005** Lighting a lantern from a kept ember calls the Phase 1 path (private BAR plus mint), marks that ember
  `state: 'lit'` with `lantern: <barId>`, and writes no ember text, feel or glow to any shared row.
- **FR-006** Hanging a lantern in the Hollow publishes its BAR and stakes its vibeulon (FR-002); it counts toward the
  Between once, on the other member's yes (cc-lantern-offer, unchanged).
- **FR-007** Qi is computed as the count of the player's kept embers (held or lit) and drives the Nook's room light
  (hearth and lamps) in steps; glow never enters it; it never decreases.
- **FR-008** The Hollow's room light reads the two members' kept-ember counts summed; neither member's count nor any glow
  is shown or stored on a shared row; `sky-qi.js` keeps reading the Between's health for the sky.

## Non-Functional Requirements

- The mint, the stake and the BAR row commit in one transaction; a failure leaves no orphan vibeulon.
- Reduced motion: the light changes in one step, no ramp.

## Persisted data & Prisma

No schema change: `Vibulon.stakedOnBarId` exists (prisma/schema.prisma:1765) and is unused today. A later migration may
add a relation and index; that is a separate spec. The ember stays in BetweenPrivate (`data/users/<me>/pouch`).

## Verification Quest

Open the preview at `/ontology-game/between?nook=1&skipHome=1` as a fresh player. Confirm there is no lantern hook. Sit at
the hearth, work a charge with one move, keep the ember: the room's light steps up once and the sky does not change.
The lantern hook appears; light a lantern: the wallet shows one new vibeulon from that BAR. Carry it into the Hollow and
hang it: the vibeulon reads staked, the total is unchanged. Take it back: the vibeulon is spendable again.

## Ontology

- `design_intent`: the private work at the hearth crosses to another person through one gesture the player chooses, so the bridge from solo to co-op comes early and stays optional (Diplomat).
- `intrinsic_pleasure`: tending and giving: a room that warms with your own work, and a lantern someone else can use; the player leads, nobody is scored (Shaman).
- `ontology_objects`: Ember; Qi as a `Meter` (source embers kept, display room light, never spent); Lantern = BAR (CustomBar); Vibulon `bar_mint`, staked via `stakedOnBarId`; Nook; Hollow; hearth (Sage).
- `mechanical_claims`: tracked embers kept and lanterns lit; nothing scales with glow; lanterns gated on the first worked charge; provenance remembered on the vibeulon; publish stakes instead of burning (Architect).
- `aqal_attention`: I the private hearth and its glow; We the Hollow and the other's yes; It the ember count and the light; Its the vibeulon ledger. Invites settled warmth, not urgency; burdens no type, since every charge leaves one ember (Shaman).
- `agency_and_consent`: the player chooses whether an ember becomes a lantern and whether it goes public; nothing is published by default; only the other member's yes counts an offer; only the maker can take back or compost (Diplomat).
- `evidence_and_unknowns`: rulings ee-qi-role, ee-bar-mint-stake, ee-bar-making-opens (2026-10-29); code read at 4e13376 (keepEmber, qiOf, the two burns, stakedOnBarId unused). Open: the lantern as the BAR gesture [NEEDS CLARIFICATION: is lighting a lantern how a player makes a BAR in the Between | board: ee2-lantern-is-bar] (Sage).
- `provenance_effects`: every minted vibeulon names its BAR; the ember records its lantern; a stake never destroys value and releases to the maker (Regent).
- `risks_and_tests`: players read glow as value (compare glow on private vs lit embers in the first playtest); room light read as a score (ask a playtester what the light means); minting on every BAR lets a player farm vibeulons from empty private BARs outside the Between, which his rule that gaming only cheats the cheater answers, and the falsify script counts; the old Show Up victory was proven unreachable (0 of 6 superpowers win, `.specify/specs/ember-economy-decompose/HARVEST.md` H4), so no ember or lantern count becomes a win condition (Challenger).
- `implementation_translation`: `src/actions/create-bar.ts`, new `src/lib/economy/bar-mint.ts`, wallet balance readers, `public/between/garden.js` (hearth, pouch, lantern hook), `public/between/hollow.js` (room light), new route `src/app/api/between/[gardenId]/lantern/route.ts` (Architect).
- `decision_or_open_authority`: the gates are his (ruled 2026-10-29); ee2-lantern-is-bar is on the board; ee2-qi-is-nook-light, ee2-hollow-light-shared and ee2-one-ember-per-lantern stand unless he flips them (Regent).

## Reserved items

Money: vibeulons are the game's token, not money, and no live paywall changes. None of his prose is touched. None.

## How we will know it failed

- **The cheap test, run before building:** an economy script over a copy of the vibeulon ledger replays every BAR made since launch under the new rule (mint on make, stake on publish) and reports how many public BARs were blocked by an empty wallet under the old rule and what each wallet would read; it should show no wallet going negative and no BAR left without its vibeulon.
- **The result that stops the work:** if any existing flow reads total vibeulons (staked included) as spendable, or a bounty escrow double-counts a staked vibeulon, the stake model leaks value and the council rethinks it before the Between work starts. The same holds if the replay shows private BARs made only to mint.

## Definition of done

- [ ] `npm run check` and `npm run build` pass; unit tests for mint, stake and release
- [ ] the Verification Quest walks on the preview
- [ ] Wendell's look on the stills of the lantern hook and the room light, before the Between code (board)

## Dependencies

- `.specify/specs/bar-alchemy-nook-between/` (a BAR planted from the Nook; its ember intensity stays a private field).
- `.specify/specs/vibeulon-visibility/` (the feed gains `bar_mint` as an earning source; `bar_stake` is amount 0).
- `.specify/specs/ember-economy-decompose/` (retires `StarterPack.initialVibeulons`, so every vibeulon comes from a BAR).

## References

- council: `council/passes/6FACE_PASS_ember-economy-host_2026-10-28.md`, `council/callsheets/ember-economy.md`
- board rows: ee-qi-role, ee-bar-mint-stake, ee-bar-making-opens, cc-pouch-private, cc-lantern-offer, uu-between-clock-look-1

## Signed

- intake: shaman, diplomat (2026-11-04)
- spec: architect, regent (2026-11-04)
- clarify: sage (2026-11-04)
- falsify: challenger (2026-11-04)
- plan: architect, regent (2026-11-04)
- analyze: sage, challenger (2026-11-04)
