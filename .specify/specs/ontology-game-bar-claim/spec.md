# Spec: Ontology game BAR claim (a BAR only when the player names a satisfied position)

**Ruling:** Wendell, board `ee-open-ontology-game-export`, answer `bar-on-named` (2026-11-14 19:57 UTC):
"Write only when the player names a satisfied position — the engine then holds a claim it can measure."
**Also governing:** his note on term `ee-term-satisfied-pole` (not yet, same session): "A satisfied pole is already used
in polarity mapping. Satisfaction reads as more of an altitude in my conception." So this spec never says *pole*, and the
claim records the altitude at which the channel landed.
**Pass:** `bar-claim-named-2026-11-17` (council store, `records`), convened with `council/tools/convene.py`, check ok.
**Canon read:** `records/emotional-state-engine`, `records/build-order-emotional-engine`, `records/pass-emotional-engine-2026-11-13`.
**Spec status:** draft. The card's wording waits on look `bcn-card-look-1`; the rest stands as logged positions.

## Purpose

A player finishes a cycle in the ontology game and nothing reaches the engine. This spec builds the one path he ruled
on: when a thread lands resolved and the player names the satisfied position, the game holds a claim; when the player
chooses to carry it, bars-engine writes one BAR per claim. No claim is written for a resolved thread the player does not
name, and nothing is written for a thread that lands workable or still aching.

## Design Decisions

| Decision | Choice | Why |
|---|---|---|
| When a claim exists | Only after the player presses a sentence on the naming card | His ruling `bar-on-named` |
| What a claim holds | `(channel, polarity: satisfied)` plus `lens` (the altitude the thread was worked through) and `named` (the altitude sentence pressed), plus optional own words | Matches PR 747's `(channel, polarity)` pair; his term note reads satisfaction as altitude |
| The vocabulary | The channel's satisfied name as the card's title (triumph, wonder, poignance, bliss, peace) and the six satisfied sentences already in `stems[channel][altitude].satisfied` | Deterministic; the game's own words; no new copy to invent |
| How it leaves the game | A portable code the player chooses to carry, `OAG2.`, extending `OAG1.` | Mode B law: explicit approval every cycle; nothing is sent anywhere by default |
| How it enters the engine | A carry link opens `/claim#OAG2…`; the signed-in player presses one seal; a rule-based decoder writes the BARs | No form, no paste box, no AI reading the words |
| Where it is stored | Existing `CustomBar` columns; no migration | Fits a slot already on main (build-order §3: "Every step fits an existing slot") |
| How it is measured | Each claim carries the per-channel cycle counts from the same code, so unnamed cycles are the denominator | The Skeptic: a claim without a denominator measures wording habits |

## Conceptual Model

- **Channel**: Fire/anger, Metal/fear, Water/sadness, Wood/joy, Earth/neutrality (game keys `anger`, `fear`, `sadness`, `joy`, `neutrality`).
- **Position**: `(channel, polarity)`; polarity is `dissatisfied | neutral | satisfied`. A claim is always `satisfied`.
- **Satisfied name** (a modifier on the channel, never a separate vocabulary): anger → triumph, fear → wonder,
  sadness → poignance, joy → bliss, neutrality → peace (`records/emotional-state-engine` §2).
- **Altitude lens**: magenta, red, amber, orange, green, teal (the game's `face` keys).
- **Claim**: `{ at, channel, polarity: "satisfied", lens, named, words? }`. `lens` and `named` may differ; a difference is
  evidence, never an error.
- **BAR**: one `CustomBar` per claim.

## The naming card (player-facing)

Reuses mechanic `card-push-in` (canon/mechanics). Entered as new phase `phase5-name-claim` from
`handlePhase5StateConfirm(state)` only when `state === "satisfied"` and no block is open.

1. The card pushes in over the wheel. Its title is the channel's satisfied name, for example **Triumph**.
2. Under the title sit the six satisfied sentences for that channel, in altitude order, each a full-width button with
   its altitude colour as a left rule. No sentence is highlighted, pre-selected or marked as the expected one.
3. Pressing a sentence names the claim. The pressed sentence stays on the card, the others fade, and a single line
   "In your words (optional)" opens beneath it. Its text stays on the device unless the player carries the code.
4. "Not now" closes the card. It leaves no mark, star, gap or count anywhere, and the thread is recorded exactly as
   today.
5. The card never shows the words *claim*, *measure*, *score* or *BAR*. Look `bcn-card-look-1` rules on what it does
   show.

The thread itself is recorded as today (`resolvedThreads`, `logRoute`); the claim is held in a new `namedClaims` state
array, reset by `handleNewCycle` like `resolvedThreads`.

## Carrying (player-facing)

On `phase6-done`, when `namedClaims.length > 0`, one extra button: "Carry this to the engine". Pressing it builds the
`OAG2.` code and opens `https://bars-engine.vercel.app/claim#<code>` in a new tab. The fragment never reaches a server
log. The button appears every cycle that has claims and is never sticky.

## API Contracts

### `OAG2.` code

`OAG2.` + base64url(JSON) + `.` + checksum, where JSON is:

```json
{
  "v": 2,
  "build": "<game build id>",
  "s": { "totalCycles": 0, "channelCounts": {}, "channelsSatisfied": {} },
  "k": [[1763350000000, "anger", "orange", "orange", "optional words"]]
}
```

`k` rows are `[at, channel, lens, named, words]`. `s` carries the denominators. The checksum is the first 8 hex chars of
SHA-256 over the base64url body: it catches a copy error and nothing more; the code is self-report and can be edited,
and the BAR says so in `evidenceKind`. `OAG1.` decoding stays untouched.

### `src/lib/ontology-game/claim-code.ts` (pure)

- `decodeClaimCode(code: string): { ok: true, claims: Claim[], counts: Counts, build: string } | { ok: false, reason: string }`
- Refuses: wrong prefix, bad base64, checksum mismatch, unknown channel or altitude, polarity other than satisfied,
  more than 30 claims, words over 280 characters.

### `src/app/claim/page.tsx` and `src/actions/ontology-claim.ts`

- The page reads the fragment on the client, calls `decodeClaimCode`, and shows the claims as cards with one seal:
  "Keep these" (mechanic `lading-seal` pattern: whole or not shown). Not signed in → the sign-in door, then back here.
- `keepOntologyClaims(code)` decodes again on the server (never trusts the client), then writes one `CustomBar` per
  claim. Idempotent on `(creatorId, at, channel)`: a code carried twice writes nothing new.

## Persisted data & Prisma

No migration. One `CustomBar` per claim:

| Column | Value |
|---|---|
| `type` | `"claim"` |
| `title` | the satisfied name, capitalised (`"Triumph"`) |
| `description` | the pressed sentence (`stems[channel][named].satisfied`) |
| `emotionalAlchemyTag` | channel key (`"anger"`) |
| `satisfaction` | `"anger:satisfied"` (the position pair) |
| `gameMasterFace` | `named` altitude |
| `evidenceKind` | `"self-named"` |
| `visibility` | `"private"` |
| `inputs` | JSON: `{ at, lens, named, words, build, codeHash, counts: { channel, cyclesInChannel, totalCycles } }` |

When PR 747 lands, `satisfaction` can move to its typed pair; this spec does not wait on it.

## Measuring (deterministic, no AI)

`src/lib/ontology-game/claim-measure.ts`, pure, over a player's `type: "claim"` BARs:

- **Named rate per channel** = claims in channel ÷ `cyclesInChannel` from the latest code. Unnamed cycles count.
- **Recurrence** = for each claim, whether a later carried code holds another claim in the same channel.
- **Lens agreement** = share of claims where `lens === named`.
- No "redefined" outcome exists for a claim.

These numbers are shown nowhere to the player in this spec. The admin read is the only reader until the paper walk
says the measure carries information.

## User Stories

### P1: I name what landed
As a player whose anger thread just resolved, I see **Triumph** and six sentences, press the one that is true, and may
add my words. *Accept:* `namedClaims` holds one row; `resolvedThreads` is unchanged from today.

### P2: I can leave it
As a player who does not want to name it, I press "Not now". *Accept:* nothing in `namedClaims`; no trace on any
screen.

### P3: I carry it home
As a signed-in bars-engine player, I press "Carry this to the engine", see my claims, press "Keep these". *Accept:* one
private `CustomBar` per claim; carrying the same code twice adds none.

### P4: The engine can count it
As the admin read, I see named rate, recurrence and lens agreement per channel for one player. *Accept:* fixed codes in
the test give fixed numbers.

## Functional Requirements

- FR-001 The naming card appears only after `satisfied`, never after `neutral` or `dissatisfied`.
- FR-002 No sentence is pre-selected, ranked or marked; order is altitude order.
- FR-003 "Not now" leaves no visible trace.
- FR-004 A claim is created only by a press on a sentence.
- FR-005 Own words never leave the device unless the player presses carry for that cycle.
- FR-006 `decodeClaimCode` is pure and rule-based; no model reads any field.
- FR-007 The server decodes again and refuses on any failure, naming the reason.
- FR-008 Writes are idempotent on `(creatorId, at, channel)`.
- FR-009 `OAG1.` codes keep decoding in the coach view.
- FR-010 Demo Mode never creates a claim (same guard as `persistCompletedCycle`).

## Non-Functional Requirements

- The card is keyboard reachable and reads in order to a screen reader.
- The game still runs as a claude.ai artifact; the carry button is site-only (`ON_SITE`), like the other site branches.
- `scripts/build-ontology-game.mjs` rebuilds the served bundle.

## Verification Quest (required — UX)

Local only (`scripts/local/dev.sh dev`): play one cycle in the built game with `?debug=1`, resolve anger, name Triumph
at orange with words, carry, keep. Screenshots of the naming card, the carry page and the admin read go to
`/mnt/project-files/looks/ontology-game-bar-claim/`.

## Gate before the measure is trusted

The Skeptic's paper walk (pass `bar-claim-named-2026-11-17`): five to eight players each name a claim; on the next
cycle they re-pick from the six sentences with no channel label. If agreement is no better than chance (1 in 6), the
measure stays admin-only and unpublished. This gate does not block P1 to P3.

## Dependencies

- Look `bcn-card-look-1` (the card's wording) before the card ships.
- PR 747 is not required; when it lands, a follow-up moves `satisfaction` onto its typed pair.

## Next owner + wake

**Next owner:** a Sonnet build thread, on Wendell's answer to `bcn-card-look-1`. It builds tasks.md T1 to T6 on branch
`claude/…`, runs `scripts/local/check.sh --build`, and adds `ship-next`. **Wake:** his answer on the board.

## References

- `content/ontology-game/game.jsx`: `stems` (line ~24), `encodePortableCoachCode` (~892), `handlePhase5StateConfirm`
  (~2310), `handleCompleteCycle` (~2747).
- `records/emotional-state-engine`, `records/build-order-emotional-engine` (step 1 is the export).
- `canon/mechanics/card-push-in.yaml`, `canon/mechanics/lading-seal.yaml` (council repo).
