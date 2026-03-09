# Transformation Encounter Geometry v0

## Purpose

Encounter geometry determines **how the interaction unfolds**, not just what moves occur. The system is based on three orthogonal axes that define the **shape of the interaction**, independent of transformation moves.

---

## Axis Definitions

### Axis 1: Hide ↔ Seek

Proximity and disclosure dynamics.

| Pole | Interaction Type | Typical Quests |
|------|------------------|----------------|
| **Hide** | concealment, boundaries, withdrawal, protection | reflection, internal observation, boundary setting |
| **Seek** | exploration, discovery, approach, invitation | curiosity, investigation, connection attempts |

### Axis 2: Truth ↔ Dare

Risk type.

| Pole | Interaction Type | Typical Quests |
|------|------------------|----------------|
| **Truth** | revelation, insight, understanding, clarity | reflection, truth speaking, pattern recognition |
| **Dare** | action, challenge, risk, experiment | courage actions, behavior experiments, pattern disruption |

### Axis 3: Interior ↔ Exterior

Locus of action.

| Pole | Interaction Type | Typical Quests |
|------|------------------|----------------|
| **Interior** | internal awareness, emotion processing, belief examination | journaling, emotional alchemy, shadow dialogue |
| **Exterior** | behavior, social interaction, environment change | conversation, boundary action, world engagement |

---

## Encounter Coordinate Model

```ts
interface EncounterCoordinate {
  hide_seek: 'hide' | 'seek'
  truth_dare: 'truth' | 'dare'
  interior_exterior: 'interior' | 'exterior'
}
```

Example: `{ hide_seek: 'seek', truth_dare: 'dare', interior_exterior: 'exterior' }` → exploratory action challenge in the external world.

---

## 8 Primary Encounter Types

| Type | Hide/Seek | Truth/Dare | Interior/Exterior | Interaction Type | Typical Moves |
|------|-----------|------------|-------------------|------------------|---------------|
| **Hidden Truth** | hide | truth | interior | internal reflection, shadow recognition | Observe, Name, Feel |
| **Hidden Challenge** | hide | dare | interior | inner courage, internal confrontation | Externalize, Feel, Experiment |
| **Revealed Insight** | seek | truth | interior | self-discovery, clarity generation | Observe, Reframe, Integrate |
| **Inner Breakthrough** | seek | dare | interior | internal transformation, belief disruption | Invert, Feel, Integrate |
| **Protected Truth** | hide | truth | exterior | boundary clarity, truth held privately | Name, Observe, Integrate |
| **Quiet Action** | hide | dare | exterior | private behavioral change | Experiment, Integrate |
| **Revealed Truth** | seek | truth | exterior | truth sharing, communication | Externalize, Reframe, Experiment |
| **Courageous Action** | seek | dare | exterior | bold external challenge | Invert, Experiment, Integrate |

---

## Move Alignment (Default)

| Move | Hide/Seek | Truth/Dare | Interior/Exterior |
|------|-----------|-------------|-------------------|
| Observe | hide | truth | interior |
| Name | hide | truth | interior |
| Externalize | seek | truth | interior |
| Feel | hide | truth | interior |
| Reframe | seek | truth | interior |
| Invert | seek | dare | interior |
| Experiment | seek | dare | exterior |
| Integrate | hide | truth | interior |

These are default alignments, not rigid rules.

---

## Quest Template Geometry

| Template | Hide/Seek | Truth/Dare | Interior/Exterior |
|----------|-----------|-------------|-------------------|
| Reflection Arc | hide | truth | interior |
| Shadow Dialogue Arc | seek | truth | interior |
| Somatic Alchemy Arc | hide | truth | interior |
| Courage Experiment Arc | seek | dare | exterior |
| Integration Arc | hide | truth | interior |

---

## Nation Encounter Weighting

| Nation | Geometry Bias |
|--------|---------------|
| Argyra | Seek, Truth |
| Pyrakanth | Dare, Exterior |
| Lamenth | Hide, Interior |
| Meridia | Balanced center |
| Virelune | Seek, Exterior |

---

## Archetype Encounter Tendencies

| Archetype | Geometry Tendency |
|-----------|-------------------|
| Bold Heart | Seek, Dare, Exterior |
| Danger Walker | Seek, Dare, Interior |
| Truth Seer | Seek, Truth, Interior |
| Still Point | Hide, Truth, Interior |
| Subtle Influence | Seek, Truth, Exterior |
| Devoted Guardian | Hide, Exterior |
| Decisive Storm | Dare, Exterior |
| Joyful Connector | Seek, Exterior |

Tendencies shape quest expression but do not restrict possibilities.

---

## Generation Flow

```
Narrative parsed
→ transformation lock detected
→ encounter geometry chosen
→ quest template selected
→ moves chosen from registry
→ nation/archetype overlays applied
→ Quest Seed
```

---

## Constraints

- Remain independent of move registry
- Remain independent of quest templates
- Provide encounter classification only
- Simple coordinate model
- Composable systems
- Explicit encounter metadata

---

## Three Octagonal Structures

The engine now has three 8-fold structures that can be mapped intentionally:

| System | Count |
|--------|-------|
| Archetypes | 8 |
| Transformation moves | 8 |
| Encounter geometries | 8 |

Procedural coherence emerges when these systems are aligned.
