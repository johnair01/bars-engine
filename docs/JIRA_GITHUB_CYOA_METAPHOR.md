# Jira, GitHub, and CYOA: A Metaphorical Analysis

BARs Engine can be understood as **"if Jira could interface with GitHub via a procedurally generated choose-your-own-adventure game."** This document maps the metaphor and explains how backlog stewardship, version management, and narrative choice converge.

## The Three Systems

| System | Primary metaphor | What it does |
|--------|------------------|--------------|
| **Jira** | Backlog, sprints, issues | Tracks work items; prioritizes; assigns; measures throughput |
| **GitHub** | Branches, PRs, forks | Version control; divergence; merge; lineage |
| **CYOA** | Choices, paths, procedural narrative | Interactive story; player agency; emergent outcomes |

## Mapping to BARs Engine

| Jira concept | BARs equivalent |
|--------------|-----------------|
| Backlog | Campaign deck (quests available for the period) |
| Sprint | Period (Kotter stage; 8 slots per period) |
| Issue | Quest (CustomBar) |
| Assignee | Steward (player who has taken the slot quest) |
| Status (To Do, In Progress, Done) | Wake Up → Clean Up → Show Up → Complete |

| GitHub concept | BARs equivalent |
|-----------------|-----------------|
| Branch | Quest variant (fork) |
| Fork | `forkQuestPrivately` — offerer forks declined AID quest; steward keeps original |
| PR (pull request) | AID offer (quest-type) — helper proposes a quest to unblock steward |
| Merge | Steward accepts AID — quest assigned to steward |
| Lineage | `forkedFromId`; provenance preserved |

| CYOA concept | BARs equivalent |
|--------------|-----------------|
| Choice | Quest grammar; emotional alchemy; choice privileging |
| Path | Quest thread; adventure; campaign flow |
| Procedural narrative | Hexagram-aligned generation; unpacking → QuestPacket → Twine |
| Player agency | Nation, archetype, developmental lens; 4 moves |

## Core Thesis

**Quests are lightweight version-managed work items.** Forking and stewardship mirror git workflows: when a steward declines an AID offer, the offerer can fork the quest and complete it privately — divergence as evolution, not failure. The narrative layer (CYOA) makes backlog stewardship legible and playful: the Architect Game Master teaches players to steward the collective backlog with honor and amusement.

## Design Implications

- **Fork-on-decline**: When steward declines, offerer gets a fork in hand — no wasted work.
- **Decline clock**: Steward must respond within a window (configurable TTL); expired offers treat as declined.
- **Version management**: `forkedFromId`, `forkQuestPrivately`, `forkDeclinedAidQuest` — lineage is first-class.
- **Architect sect**: Virtual sys-admin teacher for backlog stewardship; Heaven trigram (strategy, blueprint).

## References

- [FOUNDATIONS.md](../FOUNDATIONS.md) — Evolution: Forking as First-Class Reality
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Core Objects, Governance
- [.agent/context/game-master-sects.md](../.agent/context/game-master-sects.md) — Architect sect
