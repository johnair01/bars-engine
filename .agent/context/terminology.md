---
description: Canonical spelling and terminology for the project
---

# Terminology

**Canonical spellings for consistent usage across docs and code.**

---

## Core Terms

| Canonical | DB/Code | Context |
|-----------|---------|---------|
| **Vibeulon** | `vibulon`, `Vibulon` | The currency/token (prose uses Vibeulon, code uses vibulon) |
| **Kotter Stage** | `kotterStage` | 8-step change model position |
| **Archetype** | - | Enneagram type (1-9, excluding 5) |
| **Trigram** | - | I Ching base element (☰☷☳☵☶☴☲☱) |
| **Hexagram** | - | Pair of trigrams = quest reading |
| **BAR** | `Bar` / `CustomBar` | Primary game object: signal unit (I Ching reading, inspiration, prompt) |
| **Quest** | `CustomBar` + assignment/progression | Actionable BAR state (a BAR transformed into a mission loop) |
| **Move** | - | Archetype action (⚡🤝👁🎭💧🔥🌬⛰) |

---

## The 8 Moves

| Symbol | Name | Stage | Trigram |
|--------|------|-------|---------|
| ⚡ | THUNDERCLAP | 1. Urgency | Thunder |
| 🤝 | NURTURE | 2. Coalition | Earth |
| 👁 | COMMAND | 3. Vision | Heaven |
| 🎭 | EXPRESS | 4. Communicate | Lake |
| 💧 | INFILTRATE | 5. Obstacles | Water |
| 🔥 | IGNITE | 6. Wins | Fire |
| 🌬 | PERMEATE | 7. Build On | Wind |
| ⛰ | IMMOVABLE | 8. Anchor | Mountain |

---

## Usage Guidelines

- **Prose/docs**: Use "Vibeulon" (capitalized)
- **Code/schema**: Use `vibulon` (lowercase, as per Prisma convention)
- **Relation names**: Use `Vibeulon` prefix (e.g., `VibulonEvent`)
- **Mechanics**: Treat BAR as the primary object; Quest is a promoted BAR state.
- **I Ching**: A cast hexagram is a BAR first, then may be transformed into a private story quest.
