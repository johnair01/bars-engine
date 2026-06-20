# Spec Kit Prompt: Superpower Move Decks

## Role

You are a Spec Kit agent generating the six Superpower move-decks that make the inner/outer loadout overlay functional and give every Allyship Deck card a class-specific reading.

## Objective

Implement per [.specify/specs/superpower-move-decks/spec.md](../specs/superpower-move-decks/spec.md). Additive content only — superpower moves are `Technique` objects tagged `superpowers:[<sp>]`; the schema, resolver, and validator already exist and do not change.

## Requirements

- **Deck shape (per superpower)**: 5 Basic Moves (one per WAVE move), 6 Altitude Moves (one per operation Shaman→Sage), 2 Signature Moves (inner + outer). = 13 each × 6 = 78. Alchemist inherits the Tier-1 substrate → author only its deltas + 2 signatures.
- **Tags**: basic = `moves:[one], operations:[]`; altitude = `moves:[], operations:[one]`; signature = `aspect:inner|outer`, wildcard move/op. All `superpowers:[<sp>]`, `aspect:'both'` for basic/altitude, `channels:[]`/`domains:[]` unless intrinsic.
- **Provenance/lifecycle**: generated → `source.origin:'ai'`, `status:'draft'`; author promotes to `'published'`. Only `published` enters the resolver pool.
- **Generation method**: derive each move from (1) the MTGOA superpower profile, (2) the operation chapters (for altitude moves), (3) the deck grammar (for basic moves). Connector worked example in the spec is the canonical pattern.
- **Coverage**: per-superpower report shows 120/120 once published.

## Deliverables

- [ ] `src/lib/technique-library/superpowers/{profiles,strategist,connector,escape-artist,disruptor,storyteller,alchemist,index}.ts`
- [ ] `canonical.ts` merges `published` superpower moves
- [ ] `scripts/superpower-coverage.ts`
- [ ] `__tests__/superpower-decks.test.ts` (13-slot shape, valid, drafts excluded)
- [ ] `BACKLOG.md` entry + `npm run backlog:seed`

## Reference

- Spec: [.specify/specs/superpower-move-decks/spec.md](../specs/superpower-move-decks/spec.md)
- Plan: [.specify/specs/superpower-move-decks/plan.md](../specs/superpower-move-decks/plan.md)
- Tasks: [.specify/specs/superpower-move-decks/tasks.md](../specs/superpower-move-decks/tasks.md)
- Vocabulary: [.specify/specs/allyship-technique-vocabulary/spec.md](../specs/allyship-technique-vocabulary/spec.md)
- Superpowers (existing): [.specify/specs/superpower-move-extensions/spec.md](../specs/superpower-move-extensions/spec.md)
