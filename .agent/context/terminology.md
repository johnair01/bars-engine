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
| **Quest** | `CustomBar` | User-created mission |
| **Bar** | `Bar` | System/I Ching hexagram (1-64) |
| **Move** | - | Archetype action (⚡🤝👁🎭💧🔥🌬⛰) |

---

## The 4 Moves (Personal Throughput)

| Move | Meaning |
|------|---------|
| Wake Up | See more of what's available (who, what, where, how) |
| Clean Up | Get more emotional energy; unblock vibeulon-generating actions |
| Grow Up | Increase skill capacity through developmental lines |
| Show Up | Do the work of completing quests |

---

## Allyship Domains (WHERE)

| Key | Label |
|-----|-------|
| GATHERING_RESOURCES | Gathering Resources |
| DIRECT_ACTION | Direct Action |
| RAISE_AWARENESS | Raise Awareness |
| SKILLFUL_ORGANIZING | Skillful Organizing |

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
