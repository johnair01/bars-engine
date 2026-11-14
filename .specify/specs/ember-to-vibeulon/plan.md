# Plan: Ember to vibeulon

primitives: ontology (Ember, Qi as a Meter, Lantern = BAR, Vibulon staked via stakedOnBarId); mechanics already built in the Between (the hearth sit, the lantern offer)
footing: ee-qi-role, ee-bar-mint-stake, ee-bar-making-opens, ee-glow-sets-nothing, ee-ember-then-vibeulon, cc-pouch-private, cc-lantern-offer, uu-between-clock-look-1
tier: Convened; the four gates were ruled on the board 2026-10-29, basis pass ember-economy-host 2026-10-28
scout: rung 2, we have it: `Vibulon.stakedOnBarId` already exists and is unused, the pouch and `keepEmber` already keep one ember per sit, and the lantern offer already carries an ember into shared space; nothing new is installed
skills: design-ontology, six-faces, primitives, intake_check, brief-master, scout
skipped: better - the ask arrived as four answered gates with a ruled map; nothing was left vague to deepen

## Constitution check

| Article | Verdict | Why |
|---|---|---|
| 1 Questions go to the board | pass | the one open gesture is board row ee2-lantern-is-bar; three council positions are rows that stand unless flipped |
| 2 The player comes first | pass | the Game frame and the intake's first 60 seconds start from the player at the hearth |
| 3 Primitives and footing | pass | lines above |
| 4 Ontology invariants | pass | glow never pays; no consent inferred: publish and the other's yes are both explicit |
| 5 Cheapest proof first | pass | the ledger replay script (T001) runs before any code changes the economy |
| 6 Tool before build | pass | scout line above; the existing lantern and pouch are reused |
| 7 Something to see | pass | stills of the lantern hook and room light before the Between code (T007), then the preview walk |
| 8 Reserved items | pass | vibeulons are the game's token; no money, paywall or prose |
| 9 One session, one piece | pass | this session writes the spec; the build is its own thread from the callsheet |
| 10 Transcend and include | pass | the lantern offer, the pouch and the sky are kept; only the burn retires |

## Approach

Server first, Between second. Phase 1 changes only the economy (mint, stake, release, balance) behind the existing BAR
actions, so every surface that makes BARs gets the ruling at once and the Between work lands on a tested path. Phase 2
adds the lantern route and changes two parts of what a player sees: the hook by the hearth and the room light. Those go
through stills and his look before code, under the Impeccable skill.

## Files touched

| File | Change |
|---|---|
| `src/lib/economy/bar-mint.ts` | new: mint, stake, release, spendable balance |
| `src/actions/create-bar.ts` | the two burns retire; mint on make, stake on publish |
| `src/actions/release-bar.ts`, archive and visibility paths | release the stake |
| wallet balance readers (`economy.ts`, `economy-ledger.ts`, `gameboard.ts`, `quest-nesting.ts`, `appreciation.ts`) | count unstaked vibeulons only |
| `src/app/api/between/[gardenId]/lantern/route.ts` | new |
| `public/between/garden.js`, `public/between/hollow.js` | lantern hook after the first ember; room light from qi |
| `scripts/ember-economy-replay.ts` | new: the falsify replay |

## Phase 3: the mint's face (added 2026-11-09)

primitives: ontology (Vibulon gains a face; the coin style is a private pouch field); mechanics `coin-turn` (proposed in
six-faces-council `canon/mechanics/coin-turn.yaml`); style round 2 faces (`ee2-vibeulon-face-look-2`, A)
footing: ee2-vibeulon-face-look-2, fo3-coin-on-page, cc-pouch-private, canon-embers-vibeulons, and five positions that
stand unless he flips them: ee3-face-ring-from, ee3-face-texture-to, ee3-face-seal-empty, ee3-face-choice-once,
ee3-face-all-open
tier: Counselled; the face is his A, the five positions are drawn from the record, the coin turn waits his look
scout: rung 2, we have it: round 2's renderer (`faces.html`) already draws every layer, colour and material from a
small face object, so the game's coin reads the same object; the move's two elements are already in `MOVES`

Approach: the face is a pure function `coinFace(move, seal, style)` in `src/lib/economy/coin-face.ts`, tested on its
own, called inside the mint's transaction. The Nook draws the coin with round 2's face code ported to the Between's
Three.js scene (one module, `public/between/coin.js`), so a coin looks the same in the pouch, on a BAR and on the board.
The coin turn is built only after his look on its stills.

| File | Change |
|---|---|
| `prisma/schema.prisma` + migration | `Vibulon.face Json?` |
| `src/lib/economy/coin-face.ts` | new: `coinFace`, the colour and material lists, validation |
| `src/lib/economy/bar-mint.ts` | `mintBarVibulon` takes the ember and writes the face |
| `src/app/api/between/[gardenId]/bar/route.ts` | answers `face` and `choose` |
| `src/app/api/between/[gardenId]/coin/route.ts` | new: finish a bare coin, change the style |
| `public/between/coin.js` | new: draws a face (ported from round 2's `faces.html`) |
| `public/between/garden.js` | the coin rises from the BAR's seal; the turntable at the hearth |
