# Source Inventory: Show Up Move Recommendation Axes

## Purpose

This inventory prevents the move generator from hallucinating examples or mixing categories.

The recommendation grammar is:

```text
emotional vector -> move primitive -> translation function -> candidate Show Up move
```

The translation function applies:

```text
orientation + subject + superpower + domain + blocker + card/context
```

This file records which axis values are library-backed, which are code-backed, and which need more extraction before they become recommendation tables.

## Canonical Axes

| Axis | Safe Values | Source | Status | Notes |
|---|---|---|---|---|
| Emotional state | 5 channels x 3 altitudes = 15 states | `The Library/02 Index/KEYTERM-EA-Channels.md`; `src/lib/alchemy/alchemy-graph.ts` | Canonical | Used to derive vectors such as sadness:neutral -> joy:satisfied. |
| Emotional vector | Direct practice edge or planned route between states | `The Library/05 Research/Emotional Alchemy/Emotional Alchemy Move Families.md`; `src/lib/alchemy/move-planner.ts` | Canonical for routing, emerging for move copy | Produces the emotional task: stabilize, transcend, neutral translate, generative translate, or mastery/integration translate. |
| Move primitive | Base emotional-alchemy Show Up mechanic before contextual translation | `.specify/specs/emotional-alchemy-move-combinations/move-primitives-and-translation.md` | Emerging MVP layer | Prevents authoring every superpower/domain combination. |
| Superpower | Connector, Strategist, Disruptor, Escape Artist, Catalyst/Coach, Alchemist, Storyteller | `The Library/02 Index/KEYTERM-ALLYSHIP-SUPERPOWERS.md`; `src/lib/superpowers/types.ts` | Canonical with naming reconciliation needed | Library says Catalyst; code uses Coach as the campaign addendum. Treat as Catalyst/Coach until naming is resolved. |
| Domain | Gather Resources, Raise Awareness / Impact Storytelling, Direct Action, Skillful Organizing | `src/lib/allyship-deck/move-library.ts`; MTGOA RPG manual districts | Canonical | Domain is not superpower. It names the field of action. |
| Orientation | Internal, External | `src/lib/superpowers/types.ts`; `src/lib/superpowers/matrix.ts` | Canonical | Internal = self-allyship / inner move; external = world-facing allyship / outer move. |
| Subject | Self, Other, Collective | `src/lib/allyship-deck/types.ts` | Canonical | Subject names who/what the move serves. This is separate from orientation. |
| Ensemble role | Spark, Anchor, Builder, Scout, Witness | MTGOA RPG manual v0.2 | Canonical as role, not superpower | Useful for team positioning and scenario texture, but not part of the superpower axis. |
| Scenario | Concrete situation inside recipient, co-conspirator, domain, card, and blocker context | Effective Allyship Formula notes | Emerging | Do not use generic scenarios as superpowers. |

## Show Up Orientation

Show Up is not synonymous with external action.

Show Up means investing available capacity into an enacted artifact or commitment. That enactment can be internal or external:

| Orientation | Meaning | Valid Show Up Outputs |
|---|---|---|
| Internal | Self-allyship / inner move | Inner boundary, self-trust note, values bridge, parts agreement, inner exit, personal plan, permission, embodied commitment. |
| External | World-facing allyship / outer move | Ask, message, agreement, boundary, handoff, interruption, resource movement, repair, public truth, witnessed action. |

Internal does not automatically mean Clean Up. External does not automatically mean Show Up. The test is whether the move enacts transformed capacity rather than only analyzing the charge.

## Superpower Inventory

| Superpower | Code Key | Core Gift | Clean Use | Shadow / Overuse | Natural Domain Fit From Code | Emotional Arc From Code | Source Confidence |
|---|---|---|---|---|---|---|---|
| Connector | `connector` | Builds trust, belonging, relational circuits, and bridges across difference. | Creates intentional spaces where people, resources, and insight can meet. | Over-connects without consent, confuses access with intimacy, becomes social glue at personal cost. | Raise Awareness, Gather Resources | Neutrality -> Peace plus Sadness -> Poignance | High |
| Strategist | `strategist` | Sees the board, hidden constraints, leverage points, and future consequences. | Names the right sequence of action and helps others move with clarity. | Becomes cold, controlling, over-optimized, or resentful when others do not see what they see. | Skillful Organizing | Fear -> Clarity / Precision | High |
| Disruptor | `disruptor` | Interrupts stuck patterns, false inevitability, silence, and compliance. | Breaks the spell of "this is just how things are" so new action becomes possible. | Confuses rupture with change, escalates for identity, or damages trust the mission still needs. | Direct Action | Anger -> Triumph | Medium-high; library asks for older-source extraction pass |
| Escape Artist | `escape_artist` | Finds exits, loopholes, routes, options, and sovereignty under constraint. | Helps people move through traps without surrendering agency or imagination. | Avoids commitment, slips accountability, or treats every container as a cage. | Direct Action | Sadness -> Poignance plus Fear -> Excitement | High |
| Catalyst / Coach | `coach` | Sees latent capacity and helps people practice into power. | Builds courage, skill, momentum, and agency through timely challenge and support. | Over-coaches, optimizes everyone else, or makes other people's growth a hiding place. | Gather Resources | Frustration -> Triumph | Medium; library uses Catalyst, code uses Coach |
| Alchemist | `alchemist` | Transforms adversity, grief, conflict, failure, and stuckness into usable capacity. | Metabolizes pain into growth, ritual, repair, and renewed motion. | Romanticizes suffering, over-processes, or turns every wound into curriculum too soon. | Direct Action | All elements; Sadness -> Poignance -> Joy | High |
| Storyteller | `storyteller` | Shapes meaning, memory, morale, narrative, and public imagination. | Gives experience an arc that helps people understand, endure, and act. | Turns pain into performance, simplifies complexity, or makes story more important than people. | Raise Awareness | Anger -> Triumph plus Sadness -> Poignance | High |

## Domain Inventory

| Domain | Code Key | Library / Manual Name | Lens | Core Question | Status |
|---|---|---|---|---|---|
| Gather Resources | `GATHERING_RESOURCES` | The Wells / Gather Resources / Fundraising | Need, asking, and marshaling resources | What is actually depleted? | Canonical |
| Raise Awareness | `RAISE_AWARENESS` | The Lanterns / Raise Awareness / Impact Storytelling | Attention, truth, and what must become visible | What truth needs to become visible, and with whose consent? | Canonical |
| Direct Action | `DIRECT_ACTION` | The Thresholds / Direct Action | The line, intervention, and what must change | What line or move is being avoided? | Canonical |
| Skillful Organizing | `SKILLFUL_ORGANIZING` | The Loom / Skillful Organizing | Structure, coordination, and who does what | What structure would let the work continue? | Canonical |

## Ensemble Role Inventory

| Role | Story Function | Allyship Function | Use In Recommendations |
|---|---|---|---|
| Spark | Makes the first move. | Turns stuck energy into motion. | Team positioning / scenario texture only. |
| Anchor | Holds the group steady. | Keeps care from becoming chaos. | Team positioning / scenario texture only. |
| Builder | Creates tools and structures. | Makes the work repeatable. | Team positioning / scenario texture only. |
| Scout | Sees routes others miss. | Finds openings, risks, and hidden costs. | Team positioning / scenario texture only. |
| Witness | Names what is happening. | Makes truth visible without extraction. | Team positioning / scenario texture only. |

## Superpower x Domain Matrix

This is not yet a move table. It is a source-backed routing matrix for where examples may be generated.

| Superpower | Natural Domain Fit | Other Domains | Notes For Move Generation |
|---|---|---|---|
| Connector | Raise Awareness; Gather Resources | Direct Action; Skillful Organizing | Natural moves bridge trust, consent, introductions, relational circuits, and resource flow. In non-natural domains, require explicit card/context to avoid generic "connect people" answers. |
| Strategist | Skillful Organizing | Gather Resources; Raise Awareness; Direct Action | Natural moves sequence action, reveal constraints, reduce leakage, and clarify leverage. In Direct Action, guard against people-as-pieces control. |
| Disruptor | Direct Action | Raise Awareness; Skillful Organizing; Gather Resources | Natural moves interrupt false inevitability, silence, or compliance. Always require repair/consent guardrails when trust is mission-critical. |
| Escape Artist | Direct Action | Skillful Organizing; Gather Resources; Raise Awareness | Natural moves find exits, options, pauses, refusals, alternate routes, and sovereignty under constraint. Guard against avoidance masquerading as freedom. |
| Catalyst / Coach | Gather Resources | Skillful Organizing; Direct Action; Raise Awareness | Natural moves activate capacity, practice, courage, and momentum. Guard against over-coaching or making others' growth carry the player's worth. |
| Alchemist | Direct Action | Raise Awareness; Skillful Organizing; Gather Resources | Natural moves metabolize consequence into ritual, repair, resource, or renewed motion. Guard against processing when witness, rest, or material action is needed first. |
| Storyteller | Raise Awareness | Skillful Organizing; Direct Action; Gather Resources | Natural moves protect memory, reframe stuck meaning, build morale, and make public truth actionable. Guard against narrative replacing material change. |

## Emotional Vector x Superpower Use

The emotional vector supplies the inner mechanic. The superpower supplies the style of impact. The domain supplies the field of action.

| Emotional Vector Type | What The Move Must Do | Safe Superpower Question |
|---|---|---|
| Stabilize, dissatisfied -> neutral | Identify the clean signal and make it workable. | How does this superpower help the player identify the signal without performing action too soon? |
| Transcend, neutral -> satisfied | Complete the channel's job and release usable energy. | How does this superpower express the channel's clean completion in action? |
| Neutral translate, neutral -> neutral | Move clean charge into a different channel without chasing satisfaction. | How does this superpower change the kind of signal being acted from? |
| Generative translate, neutral -> satisfied | Use one clean emotion to generate a satisfying state in another channel. | How does this superpower turn clean signal into a satisfying inner or outer move? |
| Mastery / integration translate, satisfied -> neutral | Bring satisfied energy back into clean signal for service. | How does this superpower use completion without clinging to the high state? |
| Dissatisfied -> dissatisfied drift | Forbidden as recommendation; diagnostic only. | What drift pattern should the system warn against? |

## Guardrails

- Do not use "team coordination," "repair," or "storytelling" as superpowers unless a source explicitly elevates them. Team coordination is usually scenario/domain language. Repair is usually Clean Up, Alchemist, Diplomat, or scenario language. Storytelling can be a domain expression, while Storyteller is the superpower.
- Do not collapse Storyteller into Raise Awareness. Storyteller is a person/gift lens; Raise Awareness is a field of action.
- Do not collapse Strategist into Skillful Organizing. Strategist is a superpower; Skillful Organizing is a domain.
- Do not collapse Builder into a superpower. Builder is currently an ensemble role unless later canon changes it.
- Prefer code-backed keys when building software: `connector`, `storyteller`, `strategist`, `disruptor`, `alchemist`, `escape_artist`, `coach`.
- Prefer library-facing labels when writing design copy: Connector, Storyteller, Strategist, Disruptor, Alchemist, Escape Artist, Catalyst/Coach.

## Next Extraction Tasks

- Resolve Catalyst vs Coach naming in product language.
- Extract one concrete Show Up move pattern for each natural superpower-domain fit.
- Extract at least one guardrail or "forbidden drift" pattern for each superpower.
- Decide whether non-natural superpower-domain combinations are always available or only offered when card/context strongly supports them.
- Build the first recommendation table from natural fits only before expanding to all 28 superpower-domain combinations.
