# Prompt: Deftness Uplevel — Character, Daemons, and Agent Coordination

**Use this prompt when implementing the deftness uplevel system: Ouroboros character interview, Archetype playbooks, Daemons, and Sage-led agent coordination.**

## Role

You are a Spec Kit agent responsible for upleveling the BARs Engine's deftness through character discovery, daemons, and agent-domain coordination.

## Objective

Implement the Deftness Uplevel system per [.specify/specs/deftness-uplevel-character-daemons-agents/spec.md](../specs/deftness-uplevel-character-daemons-agents/spec.md). Key components:

1. **Ouroboros Character Interview** — Cyclical interview for character creation; Archetype → Playbook (moves list)
2. **Archetype Playbooks** — Playbook = list of NationMoves per Archetype; no new table, use archetypeId
3. **Daemons** — Discovery (321 Wake Up), leveling (Grow Up school), summon ritual, duration, dismissal
4. **Agent-Domain Backlog Ownership** — Backlog items owned by Game Master faces; Sage coordinates
5. **Sage Coordination Protocol** — Sage assigns work, identifies convergence, synthesizes
6. **6-Face Parallel Handling** — Feature requests decomposed and handled by parallelized faces

## Requirements

- **Surfaces**: Character creation page, Ouroboros interview, Daemons discovery/summon, backlog owner assignment, Sage brief
- **Mechanics**: Playbook = moves for archetype; Daemons extends moves; agents own backlog items by domain
- **Persistence**: Daemon, DaemonSummon; ownerFace on backlog; ouroborosState on Player
- **API**: getPlaybookForArchetype, getPlaybookForPlayer; discoverDaemon, summonDaemon; assignBacklogItemOwner; getSageCoordinationSuggestions
- **Verification**: cert-ouroboros-character-interview-v1, cert-daemons-discovery-v1, cert-agent-ownership-v1

## Checklist (API-First Order)

- [ ] API contracts defined in child specs
- [ ] Schema changes (Daemon, DaemonSummon, ownerFace) applied
- [ ] Server actions implemented first
- [ ] UI wired to actions
- [ ] Run `npm run build` and `npm run check` — fail-fix

## Deliverables

- [ ] Child specs implemented per plan: DC-1 through DC-6
- [ ] Verification quests for UX features
- [ ] Backlog entry added; run `npm run backlog:seed`

## Reference

- Parent spec: [deftness-uplevel-character-daemons-agents/spec.md](../specs/deftness-uplevel-character-daemons-agents/spec.md)
- Plan: [deftness-uplevel-character-daemons-agents/plan.md](../specs/deftness-uplevel-character-daemons-agents/plan.md)
- Tasks: [deftness-uplevel-character-daemons-agents/tasks.md](../specs/deftness-uplevel-character-daemons-agents/tasks.md)
- Game Master faces: shaman, challenger, regent, architect, diplomat, sage
