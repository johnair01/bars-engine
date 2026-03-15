# Emotional Alchemy: Interface Mappings for Reproducible Quest Generation

Design document capturing the interfaces between shadow beliefs, WAVE stages, developmental lenses, domains, and dissatisfaction→satisfaction resolution. **MVP: deterministic.** Goal: AI integrates by calling grammar from game engine.

---

## 1. Self-Sabotaging Belief → WAVE Path

Each shadow belief has a full WAVE path. Multiple moves address the same belief depending on context (stage). The stages give worldview and context for how the move creates impact.

| Belief | Wake Up | Clean Up | Grow Up | Show Up |
|--------|---------|----------|---------|---------|
| **I'm not ready** | Awareness of capacities | Dissolve beliefs about incapacity | Increase readiness | Take one step in a way they're already ready |
| **I'm not worthy** | Wake up to sense of worthiness | Clean up beliefs around unworthiness | Capacity to receive; capacity to act as if worthy | — |
| **I'm not capable** | Wake up to capacities | Clean up emotions around feeling incapable | Increase capability | Demonstrate capability |
| **I'm insignificant** | Reveal current significance | Dissolve blockers to significance | Increase significance | Apply current levels of significance |
| **I don't belong** | Demonstrate current belongingness | Work through isolation/belonging emotions | Increase belonging capacity; build relational skills | Leverage current belongingness |
| **I'm not good enough** | Wake up to standards of quality | Clean up unlivable standards keeping people stuck | Increase quality output in domain | Show up at present good-enough level (satisficing) |

**Note**: Worthiness is a psychological illusion; Grow targets "capacity to receive" or "act as if worthy" rather than worthiness itself.

---

## 2. 15 Moves ↔ WAVE (Wake/Clean/Grow/Show)

- **Transcend** and **translate** are skills to be developed; they apply in emotional alchemy.
- **Transcend** = Clean-type move but requires either:
  - **Grow**: increase capacity to transcend, OR
  - **Wake**: notice hidden/existing capacity (e.g. triumph already exists).
- Each of the 15 canonical moves is **usable across multiple WAVE stages**; the stage gives worldview and context for how that move creates impact.

### Primary WAVE stage per move (to be refined)

| Move | Category | Primary WAVE | Rationale |
|------|----------|--------------|-----------|
| Step Through | Transcend | Show | Fear → opportunity; step through |
| Reclaim Meaning | Transcend | Clean | Sadness → value; correct distortion |
| Commit to Growth | Transcend | Grow | Joy → sustained vitality |
| Achieve Breakthrough | Transcend | Show | Anger → boundary honored; act |
| Stabilize Coherence | Transcend | Clean | Neutrality → clarity; correct |
| Declare Intention | Generative | Show | Momentum into action |
| Integrate Gains | Generative | Grow | Action into structure |
| Reveal Stakes | Generative | Wake | Structure into clarity; notice |
| Deepen Value | Generative | Grow | Clarity into meaning |
| Renew Vitality | Generative | Wake | Meaning into vitality; notice |
| Consolidate Energy | Control | Clean | Ground enthusiasm |
| Temper Action | Control | Clean | Reassess risk |
| Reopen Sensitivity | Control | Clean | Soften rigid structure |
| Activate Hope | Control | Wake | Convert fear into momentum |
| Mobilize Grief | Control | Clean | Turn sadness into boundary-setting |

---

## 3. Developmental Lens → Flavor and Style

Each lens has an application flavor tied to integral levels. Affects passage tone, choice framing, and move emphasis.

| Lens | Integral | Flavor | Application |
|------|----------|--------|-------------|
| **Shaman** | Magenta | Mythic threshold, ritual space | Attuning to the field |
| **Challenger** | Red | Edge, proving ground | Power, honor, overcoming obstacles |
| **Regent** | — | Order, roles and rules | Maintaining culture, tradition; rules, guidelines, structures |
| **Architect** | Orange | Blueprint, project | Value; instrumental understanding; systematic |
| **Diplomat** | Green | Weave, relational field | Juggling perspectives; care; relationships; cultural field |
| **Sage** | Teal | Wise trickster; whole, integration | Sustainable systems; ecology work; can use other faces as masks |

**Implementation**: Lens selects narrative voice, choice framing (e.g. Challenger = "Prove it"; Diplomat = "How does this affect others?"), and which moves are emphasized in prompt context.

---

## 4. Domain (WHERE) ↔ Moves

Allyship domains: **GATHERING_RESOURCES**, **DIRECT_ACTION**, **RAISE_AWARENESS**, **SKILLFUL_ORGANIZING**.

**Proposed preference** (to be validated):

| Domain | Natural moves | Rationale |
|--------|---------------|-----------|
| **Gather Resource** | Water, Wood, Earth | Collecting, meaning, vitality, structure |
| **Skillful Organizing** | Earth, Metal, Wood | Structure, clarity, systems |
| **Raise Awareness** | Metal, Fire, Water | Clarity, illuminate, depth |
| **Direct Action** | Fire, Wood | Action, momentum |

**Type**: Preference (soft filter) not constraint. Domain influences which moves are suggested, not which are allowed.

---

## 5. Dissatisfaction → Satisfaction Resolution

Resolution is **element/channel-based**, not label-by-label.

### Two types of "neutral"

1. **Neutral state within a channel**: Each channel (Fear, Anger, Sadness, Joy, Neutrality) has three states—dissatisfied, **neutral**, satisfied. The neutral state is the gateway for transcend within that channel.

2. **Neutrality channel (Earth)**: One of the five channels is named Neutrality. Its dissatisfied = boredom, apathy; its satisfied = peace.

### Transcend path (within-channel)

A move **must pass through the neutral state** in a channel to transcend:

**Path**: Dissatisfied (Channel X) → (translate) → **Neutral state (Channel X)** → (transcend) → Satisfied (Channel X)

So: Dissatisfied Fear → Neutral Fear → (transcend) → Satisfied Fear (excitement, opportunity).

### Translate path (cross-channel)

Translate moves shift element-to-element: Dissatisfied Channel A → (translate) → Dissatisfied or Neutral Channel B. The flow cycle (Wood→Fire→Earth→Metal→Water→Wood) and control cycle define valid translations.

### Channel states (canonical)

Each channel has three states. The **neutral** state is the channel name itself—the pure emotional channel in its unactivated form. It is the gateway for transcend; a move must pass through it to go from dissatisfied → satisfied within that channel.

| Element | Channel | Dissatisfied | Neutral (gateway) | Satisfied |
|---------|---------|--------------|-------------------|-----------|
| Metal | Fear | anxious, scared, worried | Fear | excited, relieved (opportunity) |
| Water | Sadness | sad, disappointed, isolated | Sadness | poignant, fulfilled (value restored) |
| Wood | Joy | — | Joy | energized, triumphant, blissful |
| Fire | Anger | frustrated | Anger | triumphant (boundary honored) |
| Earth | Neutrality | boredom, apathy | Neutrality | peaceful |

**Example**: Dissatisfied Fear → Peace (satisfied Earth)
- Option A (within Metal): Dissatisfied Fear → Neutral Fear → (transcend) → Satisfied Fear; then translate to Earth if target is peace.
- Option B (translate to Earth first): Dissatisfied Fear → (translate) → Dissatisfied Earth (boredom/apathy) → Neutral Earth → (transcend) → Satisfied Earth (peace).

### Label → Channel mapping

**Dissatisfaction** (Q4):
| Label | Channel |
|-------|---------|
| anxious, scared, worried | Fear (Metal) |
| frustrated | Anger (Fire) |
| stuck, numb, empty | Sadness (Water) or Neutrality (Earth) |
| overwhelmed | Fear or Earth |
| disappointed, isolated | Sadness (Water) |
| boredom, apathy | Neutrality (Earth) |

**Satisfaction** (Q2):
| Label | Channel |
|-------|---------|
| peaceful | Neutrality (Earth) |
| triumphant, energized, proud, excited | Joy (Wood) or Fire (breakthrough) |
| blissful, fulfilled, free, relieved | Joy or Neutrality |
| poignant | Sadness (Water) — value restored |

**Implementation**: Map unpacking labels to channels; derive path (translate + transcend sequence) from dissatisfied channel to satisfied channel; select canonical moves that execute that path.

---

## 6. Reproducibility

- **MVP**: Deterministic. Given unpacking (q1–q6), alignedAction, domain, lens, shadow voices → system picks same canonical move(s).
- **Future**: AI does integration, calling grammar from game engine for quest resolution.
- **Stages**: Each move usable across stages; stage gives worldview/context for impact.

---

## 7. Implementation Checklist

- [ ] Add `waveStage` (Wake|Clean|Grow|Show) to each of 15 canonical moves
- [ ] Add `shadowBeliefOvercomes: string[]` (belief IDs) to each move
- [ ] Create `SHADOW_BELIEF_WAVE_PATHS`: belief → { wake, clean, grow, show } narrative patterns
- [ ] Create `DISSATISFACTION_TO_CHANNEL`, `SATISFACTION_TO_CHANNEL` mappings
- [ ] Create `LENS_FLAVOR`: lens → { integral, flavor, toneHint, choiceFramingHint }
- [ ] Create `DOMAIN_MOVE_PREFERENCE`: domain → preferred element keys or move IDs
- [ ] Deterministic `selectCanonicalMovesForUnpacking(input)` using above mappings

---

## Reference

- [emotional-alchemy-ontology.md](./emotional-alchemy-ontology.md)
- [move-engine.ts](../../src/lib/quest-grammar/move-engine.ts)
- [quest-grammar-ux-flow spec](../../.specify/specs/quest-grammar-ux-flow/spec.md)
