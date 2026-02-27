# Conceptual Model — Game Language

Canonical ontology for the BARs Engine. Use this language in specs, plans, and implementation.

## The Five Dimensions

| Dimension | Meaning | Schema / Examples |
|-----------|---------|-------------------|
| **WHO** | Identity | Nation, Archetype (Playbook) |
| **WHAT** | The work | Quests (CustomBar) |
| **WHERE** | Context of work | Allyship domains |
| **Energy** | What makes things happen | Vibeulons |
| **Personal throughput** | How people get things done | 4 moves |

## Allyship Domains (WHERE)

Where the work happens. Mastering the Game of Allyship:

- **Gathering Resources**
- **Direct Action**
- **Raise Awareness**
- **Skillful Organizing**

Schema: `CustomBar.allyshipDomain`, `Player.campaignDomainPreference`

## The 4 Moves (Personal Throughput)

How people get things done. Distinct from allyship domains.

| Move | Meaning |
|------|---------|
| **Wake Up** | See more of what's available (who, what, where, how) |
| **Clean Up** | Get more emotional energy; unblock vibeulon-generating actions |
| **Grow Up** | Increase skill capacity through developmental lines |
| **Show Up** | Do the work of completing quests |

Schema: `Nation.wakeUp`, `Nation.cleanUp`, etc.; `CustomBar.moveType`

## Relationship

- **WHERE** (allyship domain) = context of the quest
- **Moves** = how the player gets it done
- A quest in "Direct Action" (WHERE) might require Show Up (move)
- A quest in "Raise Awareness" might benefit from Wake Up

## Reference

- Spec Kit Translator: [.agents/skills/spec-kit-translator/SKILL.md](../../.agents/skills/spec-kit-translator/SKILL.md)
- Cursor plan: Bruised Banana Campaign Unblock
- FOUNDATIONS.md, ARCHITECTURE.md (after lore update)
