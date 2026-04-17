# Technique Library — Design Spec

**Issue:** #57  
**Status:** Design resolved — content writing remains  
**Last updated:** 2026-04-17

---

## Core Thesis

The Technique Library is the **Council's long-term memory**.  
Techniques are discovered through collaborative work, stored in the library, and retrieved when similar problems arise.  
The library is not a product — it's a practice.

---

## Design Questions — RESOLVED

| # | Question | Answer |
|---|----------|--------|
| Q1 | Discovery mode? | **C. Hybrid** — guided first (3 core moves), free exploratory for emerging techniques |
| Q2 | How many techniques per player? | **C. Progressive unlock slots** — start with 1, earn more through teaching and demonstrated use |
| Q3 | How is a technique learned? | **D. Gate confrontation** (core) + all four paths — NPC, item drop, social teaching, and gate confrontation all valid |
| Q4 | How does orientation introduce this? | **No explicit welcome moment** — library reveals itself in the moment of need |
| Q5 | How do techniques get named/captured/stored from AI-human collaborative discovery? | The Council session is the discovery mechanism. Techniques emerge from work, get named by the pair, stored in library with context. |

---

## Core Moves — RESOLVED

The basic moves for the library are emergent from Wake Up / Clean Up / Grow Up / Show Up:

### Wake Up Channel
1. **Grounding** — Return to body, name what's present
2. **Orientation** — Where am I in the system?
3. **Naming** — Give shape to what's moving

### Clean Up Channel
4. **3-2-1 Shadow Process** — Felt-sense discharge of stuck emotional material
5. **Burn Offering** — Conscious release through ritual consumption
6. **Felt Sense Check-in** — Direct somatic inquiry (YK-1 style)

### Grow Up Channel
7. **AI Council Consultation** — Tap the Council as a thinking partner
8. **I Ching Cast** — Use hexagrams to surface pattern
9. **Integration Check** — Did this actually metabolize?

### Show Up Channel
10. **Commitment Track** — What did I say I'd do? Did I do it?
11. **Accountability Signal** — Send the check-in before being asked
12. **Contribution Log** — What's the record of what I gave?

---

## Slot System

Players start with **1 technique slot** (the first technique is auto-given as a scaffold).

Earn more slots by:
1. **Teaching** a technique to another player → +1 slot
2. **Using** a technique 5 times → +1 slot
3. **Gate discovery** — encountering a problem that has no current technique → +1 slot

The library is the full record. The loadout is the working set (3-5 active).

---

## Discovery Flow

- **Hybrid first:** When a new player arrives, they're given one core technique as scaffolding (a default from their archetype/nation)
- **Exploratory:** As they encounter problems they don't have techniques for, the library reveals itself
- **Gate confrontation:** The friction moment (problem without technique) IS the gate. You earn the technique by going through the need.

---

## Social Teaching Loop

Teaching a technique is how you prove mastery. When a player teaches another player:
- Teacher earns a slot
- Teaching is logged as a contribution
- Vibeulon reward for first-time teaching

---

## Data Model (existing — don't change)

```
Technique {
  id, name, moveType, nationId, description, steps (JSON), gateIndex, isStarter
}

PlayerTechnique {
  id, playerId, techniqueId, level (1=learned 2=practiced 3=teaching), timesUsed, discoveredAt, discoveredVia
}
```

---

## Definition of Done

- [x] Design questions Q1-Q5 resolved
- [ ] First three technique content sets (321 + Burn Offering + Grounding) written as structured CYOA JSON
- [ ] Technique discovery triggers in orientation/onboarding
- [ ] Social teaching loop (player to player) rewarded with vibeulons
- [ ] Wiki doc VIBEULON_ECONOMY.md updated with technique layer
- [ ] Core moves documented with AI Council integration

---

## Related Issues

- #47 (I Ching Prompt Deck) — techniques surface via hexagram casting
- #51 (Living Memory System) — techniques are what gets remembered
- #59 (AI Backlog Metabolism) — the Council metabolizing its own techniques IS the library