# Spec: Dojo Entry, Practice Seeds, BAR Links, and Thought-String Orientation

## Purpose

Make the Triangle Workshop dojo usable by a brand-new player (no BARs, no spirits) and by a returning player working an
existing BAR. A BAR is an emergent anchor, not an entry requirement. The dojo is a school (a safe authored tutorial)
and a forge (private practice that can become a BAR).

## Entry routes (`/dojo/triangle-workshop`)

1. **Learn Thought Strings** — authored Learning constellation, in memory only. Seven moves: harvest words, three-word
   triangle, shared-word extension, charge −3…+3, extend toward a positive region, project to the floor, return to the
   wall. Never creates or edits a BAR, seed, ember, spirit progress, daemon or Between offer; no score or completion.
   “Make this mine” starts a new empty seed and copies nothing from the tutorial.
2. **Something alive now** — optional prompt, creates a private `PracticeSeed`.
3. **Make something** — optional prompt, creates an `incipient_bar` draft (not a BAR).
4. **Work a BAR** — shown only when the player has BARs; the dojo sees the BAR's title and optional element only.

Modes are always labelled: `Learning constellation`, `Private practice`, `Drafting a BAR`, `Working: [BAR title]`.

## Arrival

Required: the working-from context. Optional: one sentence, a three-word platform, a spirit witness. Never a gate.

## Grammar (`src/lib/dojo-practice/constellation.ts`)

- A triangle has exactly three distinct words. Extension = selected triangle + one of its words as the shared anchor +
  exactly two further words; the new triangle holds the same word id and grows outward from the anchor's corner.
  Nothing is inferred.
- Charge is the player's own −3…+3 report; a triangle's charge is the sum of its words, so a shared word moves every
  triangle that holds it.
- 8th-Ray move (live practice only): selected triangle is negative, the player confirms a pause, picks one charged
  word, it moves one step; a reversible history entry is written; nothing is cleared or replaced.
- A bridge links a charged triangle to a positive one with the player's own sentence and changes neither.

## Exits

Seed: discard / keep as private seed / plant a BAR. Draft: keep drafting / plant a BAR / discard. BAR-linked: discard
uncommitted / settle / return to BAR. Every mode can return to the Nook. None is worded as passing or failing.

## Data

`DojoPractice` (kind `seed | incipient_bar | bar`, status `active | settled | discarded | planted`) and `DojoEmber`
(migration `20261028120000_add_dojo_practice`). A discard blanks the stored words. A BAR link keeps only the outcomes
the player returns (`next_move | positive_continuation | bridge | charge_shift`, one sentence each). Raw strings, charge
history and reflection text are readable only by the owner. Server actions: `src/actions/dojo-practice.ts`; saves are
rebuilt through `sanitizeConstellation`.

## Embers (placeholder)

After an explicit settle, the player may hold an ember (intensity 1–3, optional element, ingredients drawn from their own
words) in a private satchel. No spirit needed. Out of scope: spirit feeding, levels, daemon families, animal draws,
crafting, Between offers.

## Verification Quest

1. As a player with no BARs and no spirits, open the dojo from the Nook. Three doors show; “Work a BAR” does not.
2. Learn Thought Strings: add a word, make a triangle, share a word to extend, change a charge, project, return. Leave.
   Confirm no seed, BAR or ember was created.
3. “Make this mine”: the new wall is empty and labelled `Private practice`.
4. Something alive now → skip the prompt → add words → extend a triangle → keep as a private seed → reopen from
   “Pick up where you were”. Discard another and confirm it is gone.
5. Plant a BAR from a seed. Open a BAR from “Work a BAR”, return one outcome, see it for that BAR only.
6. On a phone width, every control is a tap target of 44px or more and nothing needs hover.

Tests: `npm run test:dojo-practice`.
