# Spec: Farm World Write — a capture changes the place without a deploy

## Purpose

Close the loop in Wendell's prime directive: a player captures a BAR where the farm got them stuck, an agent acts on it,
and within about 20 minutes the place they named has changed, with no deploy. The farm is first; village and sect have no
spec and stay out of this one.

## Source

Council pass `note-to-world-1_2026-11-14` (store record `records/note-to-world-1_2026-11-14`): the pipeline graph breaks at
step 7, "world changes without a deploy". No agent can write world data. Rulings: `ntw-first-look-1` = A and
`ntw-tier-look-1` = A (Wendell, 2026-11-14).

## The line: data changes at once, rules go to Wendell

Wendell's words (ntw-tier-look-1, A): "Data at once, rules to me."

| Tier | What it is | Who acts | Where it lands |
|------|-----------|----------|----------------|
| **Data** | Something the running page already draws: a **seed** on a slot, labeled with its words (60 chars, one live seed per slot; Wendell, farm-world-write-look-1: "spawn seeds instead of sign posts"), a **note** on a slot (280 chars), or an **object** from the drawn list (lantern, bench, stone, flowers, scarecrow). | An agent, at once, through MCP `farm_world_change`. | BetweenPrivate key `farm-world`. Shows on the player's next load. Logged. |
| **Rule** | Anything that changes how the farm plays or needs code: mana, costs, days to grow, the grid, a new act or tool, a new kind of object. | Wendell. The agent never applies it. | Kept on the farm as a **not-yet** with its reason; the first one a capture asks for goes to the Council Board as one row. |

The test for the line is one question: does the running page already know how to draw this? If yes it is data. If it needs
a new mesh, a new act or a number changed in `farm.ts`, it is a rule. A new object name is a rule, because
`public/between/farm/farm.js` needs a drawing for it.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Separate document | `farm-world` is its own BetweenPrivate key. The player's every act rewrites the whole `farm` doc, so an agent write inside it would be lost. |
| Pure rules | `src/lib/between/farm-world.ts` has no database. The store file (`farm-world-store.ts`) holds only the document move. |
| Every change answers a capture | `captureId` is required; a call without it is invalid and writes nothing. |
| Refusal is kept | A rule ask is saved as a not-yet with its reason, so the jar can say what it waits on. |
| Undo | `farm_world_read` with `revert: true` takes a change back. The record stays; the page stops drawing it. |
| Pictures | `before` is attached with the change; `after` is attached once the changed place is shot. The jar shows the pair. |
| Player view | `GET /api/between/farm` returns `world` with applied changes and not-yets. It never returns the agent lane or the log. |
| Caps | 40 live changes per farm; 40 not-yets. |

## API

- MCP `farm_world_change { playerId, captureId, slot, kind, text?, object?, before?, ask?, lane? }` → an applied change, or a
  not-yet with its reason, or an invalid-call message. Send `ask` instead of `kind` to file a rule request.
- MCP `farm_world_read { playerId, changeId?, after?, revert?, lane? }` → the world doc; with `changeId` + `after` attaches
  the after picture; with `changeId` + `revert: true` undoes one.
- `GET /api/between/farm` → adds `world: { changes, notYet }`.

## Drawing

`public/between/farm/farm.js` draws `world.changes` in a `world` group: a seed is a small glowing seed on the earth with a paper label standing above it, the words
wrapped to the label; an object is a small toon mesh on its slot (a lantern also lights); a note is a folded paper on the ground.
The page draws only what is in the list. An unknown object name is skipped, never guessed.

## Falsification test (Challenger, from the Skeptic)

One capture on a test farm (player `test-admin`) through the MCP: the change shows on reload with zero deploys and zero
Wendell steps. A control capture that asks for a rule lands as a not-yet with its reason. Both outcomes are play. The still
of the changed place beside its before-photo is the proof.

## Roles (Regent)

- Next owner + wake: the thread that runs the test; after it, the first rule-level change a capture asks for goes to the board as one row.
- Mechanics: eye-mark (proposed), found-lights, card-turn (canon/mechanics).

## Not in this spec

The capture's location (eye-mark), the wire from a capture into unpacking, the glowing jar, village and sect.

## Parcel (round 3, farm-world-write-look-2 steer)

A seed an agent writes (`kind: seed`, alias `sign`) is a sealed parcel, not a slot change: `{ id, captureId, label (60), line (280, optional), before, lane, at, state: sealed | opened | composted }`, at most 40 sealed. It has no slot and counts no days. The player opens it from a shelf beside the farm gate: `POST /api/between/farm/parcel { id, act: take | compost }`, one transaction, idempotent. A take adds one seed to `pouch.seeds` (server-only: `pouchWrite` refuses any page write that changes it). The farm act `plant-seed { i, seedId }` removes the seed and calls `F.plant`; on untilled soil the farm refuses and the seed stays. Notes and objects stay slot changes. Out of scope: parcels filled from the player's own harvests (position fsp-parcel-agent-only), crop families, the homeroom jar shelf.
