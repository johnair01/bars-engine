# Spec Kit Prompt: Allyship Technique Vocabulary

## Role

You are a Spec Kit agent responsible for the canonical tag vocabulary that links the 120-card Allyship Deck to a living, user-extensible Technique Library — the bridge from "buy the deck" to "play the game," and the substrate that lets MTGOA book practices (and imported wisdom-tradition / personal-development techniques) attach to cards by tag.

## Objective

Implement per [.specify/specs/allyship-technique-vocabulary/spec.md](../specs/allyship-technique-vocabulary/spec.md). **API-first**: ship the deterministic vocabulary + `resolveTechniques` resolver (pure TS, no DB, no UI) before any persistence. Single source of truth — re-export existing canonical enums; only add `Superpower`, `Loadout`, and `Technique`.

## Requirements

- **Vocabulary module** (`src/lib/technique-library/vocabulary.ts`): re-export `BasicMove/Operation/AllyshipDomain/Channel/Capability/Subject` (allyship-deck) and `MoveAspect/AllyshipTarget` (quest-grammar); add `Superpower` (6, channel-agnostic) + `Loadout { inner, outer }`; channel↔emotion helpers backed by the `CAPABILITIES` Rosetta table (element is the canonical key).
- **Technique schema** (`types.ts`): tag arrays (`moves/operations/domains/channels/aspect/superpowers/capabilities`, empty = wildcard); provenance (`source`, `allyshipReframe`, `ontologicalFooting`); lifecycle (`tier: canonical|community|personal`, `status`).
- **Resolver** (`resolve.ts`): pure `resolveTechniques(card, loadout, subject, pool)` — 6-condition predicate; subject self→inner / other→outer; Alchemy as universal substrate (`viaSlot`); rank by specificity then tier.
- **Validation** (`validate.ts`): enum-membership + provenance gate (tradition/book/personal_dev imports require lineage + permission + footing).
- **Canonical seed** (`canonical.ts`): the Tier-1 MTGOA tools (3-2-1, W.A.V.E., Grounding, Rose, Contract Burning, Conscious Complaining, Happy Apples, Charge Diagnostic, Fuel Check, Roll for Resonance).
- **Coverage report** (`scripts/technique-coverage.ts`): techniques-per-card over the 120 cards; list zero-coverage gaps.
- **Persistence** (Phase 3, gated): extend `clean-up-technique-system`'s `Technique` Prisma model with the tag columns — do NOT fork a new model.

## Deliverables

- [ ] `src/lib/technique-library/{vocabulary,types,resolve,validate,index}.ts`
- [ ] `src/lib/technique-library/__tests__/{vocabulary-no-drift,resolve,validate}.test.ts`
- [ ] `src/lib/technique-library/canonical.ts` (Tier-1 tool seed)
- [ ] `scripts/technique-coverage.ts`
- [ ] (Phase 3, when needed) `Technique` Prisma columns + `technique_vocabulary_tags` migration
- [ ] `BACKLOG.md` entry + `npm run backlog:seed`

## Reference

- Spec: [.specify/specs/allyship-technique-vocabulary/spec.md](../specs/allyship-technique-vocabulary/spec.md)
- Plan: [.specify/specs/allyship-technique-vocabulary/plan.md](../specs/allyship-technique-vocabulary/plan.md)
- Tasks: [.specify/specs/allyship-technique-vocabulary/tasks.md](../specs/allyship-technique-vocabulary/tasks.md)
- Allyship Deck: [.specify/specs/allyship-deck/spec.md](../specs/allyship-deck/spec.md)
- Inner/Outer moves: [.specify/specs/inner-outer-allyship-moves/spec.md](../specs/inner-outer-allyship-moves/spec.md)
- Clean Up Technique System: [.specify/specs/clean-up-technique-system/spec.md](../specs/clean-up-technique-system/spec.md)
- Move Ecology (promotion pathway): [.specify/specs/move-ecology-emergent/spec.md](../specs/move-ecology-emergent/spec.md)
