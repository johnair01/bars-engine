---
description: Feature roadmap mapping archetype needs across development stages
---

# Quest System Feature Roadmap

Horizontal emergence: all archetypes get value at each stage.

> *"The vibes must flow for everyone."*

---

## Development Stages

| Stage | Focus | Vibes Goal |
|-------|-------|------------|
| **Alpha** | Core loops work | Vibes exist |
| **Beta** | All archetypes engaged | Vibes flow reliably |
| **Launch** | Vibes have meaning | Vibes have provenance |

---

## Feature Pillars

> **Mechanics note:** BAR is the primary object. Quest is BAR-in-action.
> I Ching hexagrams are BARs first; they can be transformed into private story quests using archetype + story context.

### 1. Quest Creation
*How players birth new quests into the world*

### 2. Moves System  
*How players advance quests through Kotter stages*

### 3. Vibeulon Provenance
*How we track the origin and journey of each vibeulon*

---

## Archetype Needs by Stage

### ☳ Type 7: Enthusiast (Urgency)

| Stage | Quest Creation | Moves | Vibeulon |
|-------|---------------|-------|-----------|
| **Alpha** | ✅ Can create quests quickly | ⬜ Basic "start quest" | ⬜ Gets vibes for starting |
| **Beta** | ⬜ Templates for rapid creation | ⬜ `⚡ THUNDERCLAP` move | ⬜ Bonus for first-mover |
| **Launch** | ⬜ "What's trending?" discovery | ⬜ Chain lightning across quests | ⬜ Provenance: "Sparked by" |

**Frustration to solve**: Boredom, waiting for others

---

### ☷ Type 2: Helper (Coalition)

| Stage | Quest Creation | Moves | Vibeulon |
|-------|---------------|-------|-----------|
| **Alpha** | ⬜ Assign quests to others | ⬜ Basic "invite" | ⬜ Gets vibes for helping |
| **Beta** | ⬜ Create quests FOR someone | ⬜ `🤝 NURTURE` move | ⬜ Bonus for team vibes |
| **Launch** | ⬜ "Gift a quest" mechanic | ⬜ Support without claiming | ⬜ Provenance: "Supported by" |

**Frustration to solve**: Feeling unappreciated

---

### ☰ Type 1: Reformer (Vision)

| Stage | Quest Creation | Moves | Vibeulon |
|-------|---------------|-------|-----------|
| **Alpha** | ✅ Set quest title/description | ⬜ Define success criteria | ⬜ Gets vibes for completion |
| **Beta** | ⬜ Quest quality rating | ⬜ `👁 COMMAND` move | ⬜ Bonus for clean execution |
| **Launch** | ⬜ "Standard quests" templates | ⬜ Improve quest mid-flight | ⬜ Provenance: "Defined by" |

**Frustration to solve**: Sloppiness, ambiguity

---

### ☱ Type 4: Individualist (Communicate)

| Stage | Quest Creation | Moves | Vibeulon |
|-------|---------------|-------|-----------|
| **Alpha** | ⬜ Add story/narrative to quests | ⬜ Basic "comment" | ⬜ Gets vibes for expression |
| **Beta** | ⬜ Rich story editor | ⬜ `🎭 EXPRESS` move | ⬜ Bonus for resonance |
| **Launch** | ⬜ Custom quest aesthetics | ⬜ Narrative branches | ⬜ Provenance: "Expressed by" |

**Frustration to solve**: Superficiality, being unseen

---

### ☵ Type 8: Challenger (Obstacles)

| Stage | Quest Creation | Moves | Vibeulon |
|-------|---------------|-------|-----------|
| **Alpha** | ⬜ Mark blockers on quests | ⬜ Basic "flag issue" | ⬜ Gets vibes for clearing |
| **Beta** | ⬜ Challenge/contest quests | ⬜ `💧 INFILTRATE` move | ⬜ Bonus for breakthrough |
| **Launch** | ⬜ "Boss fight" quest type | ⬜ Override/force progress | ⬜ Provenance: "Cleared by" |

**Frustration to solve**: Injustice, being blocked

---

### ☲ Type 3: Achiever (Wins)

| Stage | Quest Creation | Moves | Vibeulon |
|-------|---------------|-------|-----------|
| **Alpha** | ✅ Complete quests for vibes | ⬜ Basic "finish" | ✅ Gets vibes for success |
| **Beta** | ⬜ Milestone sub-quests | ⬜ `🔥 IGNITE` move | ⬜ Bonus for speed/streak |
| **Launch** | ⬜ Leaderboards | ⬜ Combo completions | ⬜ Provenance: "Delivered by" |

**Frustration to solve**: Invisibility, wasted effort

---

### ☴ Type 9: Peacemaker (Build On)

| Stage | Quest Creation | Moves | Vibeulon |
|-------|---------------|-------|-----------|
| **Alpha** | ⬜ Link related quests | ⬜ Basic "relate" | ⬜ Gets vibes for harmony |
| **Beta** | ⬜ Quest family/tree view | ⬜ `🌬 PERMEATE` move | ⬜ Bonus for spreading |
| **Launch** | ⬜ "Peace treaty" quest type | ⬜ Merge conflicting quests | ⬜ Provenance: "Spread by" |

**Frustration to solve**: Conflict, fragmentation

---

### ☶ Type 6: Loyalist (Anchor)

| Stage | Quest Creation | Moves | Vibeulon |
|-------|---------------|-------|-----------|
| **Alpha** | ⬜ Mark quests as "official" | ⬜ Basic "verify" | ⬜ Gets vibes for stability |
| **Beta** | ⬜ Quest history/audit | ⬜ `⛰ IMMOVABLE` move | ⬜ Bonus for reliability |
| **Launch** | ⬜ "Foundation quests" (permanent) | ⬜ Lock quest state | ⬜ Provenance: "Anchored by" |

**Frustration to solve**: Uncertainty, chaos

---

## Vibeulon Provenance System

Every vibeulon carries its story:

```typescript
interface Vibeulon {
  id: string
  createdAt: Date
  
  // Origin
  sourceQuestId: string      // Quest that birthed it
  sourcePlayerId: string     // Player who earned it
  sourceMoveType: MoveType   // Move that generated it
  
  // Journey
  journey: VibulonEvent[]    // Where it's been
  currentOwnerId: string     // Who holds it now
  
  // Lineage
  generation: number         // How many hops from origin
}

interface VibulonEvent {
  questId: string
  playerId: string
  action: 'earned' | 'spent' | 'transferred' | 'multiplied'
  timestamp: Date
}
```

### Provenance Display

```
🌟 Vibeulon #12847
├─ Sparked by: Alice (⚡ THUNDERCLAP on "Ocean's 11 Heist")
├─ Supported by: Bob (🤝 NURTURE)
├─ Delivered by: Carol (🔥 IGNITE)
├─ Anchored by: Dave (⛰ IMMOVABLE)
└─ Now held by: Eve
   └─ Generation: 4
```

---

## Horizontal Emergence Priority

| Priority | Feature | Archetypes Served |
|----------|---------|-------------------|
| **P0** | Quest creation | All (entry point) |
| **P0** | Basic completion | 3, 1 (achievement) |
| **P1** | Assign to others | 2, 7 (social) |
| **P1** | Story/description | 4, 1 (meaning) |
| **P2** | Moves system | All (game loop) |
| **P2** | Vibeulon tracking | All (economy) |
| **P3** | Provenance chain | 6, 9 (trust/history) |
| **P3** | Quest linking | 9, 7 (network) |

---

## Implementation Path

### Alpha (Current)
- [x] Quest creation
- [x] Basic completion
- [ ] Assign to others
- [ ] Story/description

### Beta (Next)
- [ ] Moves system (8 move types)
- [ ] Vibeulons events table
- [ ] Quest family/tree
- [ ] Player archetype affinity

### Launch
- [ ] Full provenance tracking
- [ ] Archetype-specific bonuses
- [ ] Leaderboards by move type
- [ ] "The Sage" (AI guidance based on hexagram)
