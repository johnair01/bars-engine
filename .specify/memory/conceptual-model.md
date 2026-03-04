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

- **Gathering Resources** — additive; accessing emotional energy; inner/outer resources
- **Direct Action** — action needs doing; removing obstacles
- **Raise Awareness** — helping people SEE there is a higher level to operate at
- **Skillful Organizing** — coordinating efforts; creating structures (external + internal)

Schema: `CustomBar.allyshipDomain`, `Player.campaignDomainPreference`

**Parser context**: For AI classification (book analysis), see `src/lib/allyship-domains-parser-context.ts`.

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

## Emotional Alchemy (Narrative Movement)

Energy economy, not morality. 5 elements (Metal=Fear, Water=Sadness, Wood=Joy, Fire=Anger, Earth=Neutrality). WAVE: Wake → Clean → Grow → Show. 15 canonical moves: 5 Transcend (+2), 5 Generative (+1), 5 Control (-1). Control = high-cost precision, not negative.

**Mastery**: Wake Up quests = choice-based (orientation, teaching). Show Up quests = action-based (required attestation on end passage). Quest threads end with action; Wake Up is the exception.

**Onboarding scaffolding**: Emotional alchemy informs onboarding arc. Confusion → Metal; expectation violation → Fire. Story progresses with emotional beats.

Derived from unpacking data. See [.agent/context/emotional-alchemy-ontology.md](../../.agent/context/emotional-alchemy-ontology.md).

## Integral Emergence / AI Agents (Vision)

AI agents act as NPCs in the game. They can create and resolve quests, make I Ching draws, and (future) create quests that call in archetypes from hexagrams for players to create next. Agents are Kotter-stage-context-aware (quest thread or campaign). To other users they appear as regular players. Design goal: real users outpace AI via collaboration and ability to mint vibeulons from real lives. AI agents can only mint vibeulons by completing story quests — not from capital injections or real-world actions.

## Admin 3-2-1 Shadow Process & Agent Forge

Admin-only flow. Stuckness triggers the 3-2-1 shadow process (an Emotional First Aid Kit move). After completing it:

1. Admin mints a vibeulon for doing the process (friction-gated: measurable delta required).
2. Admin is offered an optional **Agent Wizard**: create a new agent OR update an existing agent's context using the liberated energy from the emergent part.
3. **New agent**: Starts with the vibeulon generated from the EFAK move.
4. **Update existing agent**: Admin can use that vibeulon to modify the context of an existing AI agent — infusing the agent with the vibeulon.
5. **Agent vibeulon acquisition**: Agents can acquire vibeulons by being infused through the 3-2-1 shadow process (admin routes liberated energy to agent context).

Private emotional data (transcript, beliefs, distortion, sabotage) stays admin-only. Public: agent deltas, vibeulon routing, timestamp.

## Reference

- Spec Kit Translator: [.agents/skills/spec-kit-translator/SKILL.md](../../.agents/skills/spec-kit-translator/SKILL.md)
- Cursor plan: Bruised Banana Campaign Unblock
- FOUNDATIONS.md, ARCHITECTURE.md (after lore update)
- Sustainability lore: [sustainability-onboarding-lore](../specs/sustainability-onboarding-lore/spec.md)
- Admin Agent Forge: [admin-agent-forge](../specs/admin-agent-forge/spec.md)
