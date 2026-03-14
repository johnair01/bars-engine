# Spec: Ouroboros Character Creation Interview

## Purpose

Define the Ouroboros interview flow for the character creation page. A cyclical, reflective interview that guides players through identity discovery (Nation, Archetype, Playbook) and surfaces their most effective contribution. The Ouroboros metaphor: the snake eating its tail — discovery feeds creation feeds discovery.

**Parent**: [deftness-uplevel-character-daemons-agents](../spec.md)

## Design Decisions

| Topic | Decision |
|-------|----------|
| Interview vs form | Interview-style (questions, reflection, branching) not a static form. CYOA or conversational. |
| Archetype → Playbook | Archetype chosen first; then Playbook (list of moves) revealed. Playbook extends what the player can do. |
| Ouroboros loop | Questions circle back to refine; "What draws you?" → Nation → Archetype → Playbook → "How do you want to contribute?" → refine. |

## Conceptual Model

- **WHO**: Nation (element), Archetype (8 I Ching), Playbook (moves list)
- **WHAT**: Character creation page; interview nodes
- **WHERE**: Allyship domain (campaign path) — emerges from interview
- **Energy**: Vibeulons — not minted in interview; character creation unlocks contribution
- **Personal throughput**: Interview surfaces which moves (Wake/Clean/Grow/Show) fit the player

## User Stories

### P1: Ouroboros interview flow

**As a player**, I want an interview that guides me through Nation, Archetype, and Playbook selection, so I discover my character and how I contribute.

**Acceptance**: Interview has nodes for: developmental lens → Nation → Archetype → Playbook (moves) → domain preference. Branching based on prior answers. State persists.

### P2: Playbook as moves list

**As a player**, I want to see the moves available to my Archetype (Playbook), so I know what I can do.

**Acceptance**: After Archetype selection, Playbook (list of NationMoves) is displayed. Player understands Archetype = identity, Playbook = what I can do.

### P3: Contribution emergence

**As a player**, I want the interview to surface my most effective contribution, so I know where to focus.

**Acceptance**: Final node or summary: "Your contribution: [domain] + [primary move]. Quests in your domain await."

## API Contracts (API-First)

### getOuroborosInterviewState(playerId)

**Input**: `playerId: string`  
**Output**: `{ currentNodeId, answers, archetypeId?, nationId?, playbookMoveIds?, domainPreference? }`

### advanceOuroborosInterview(playerId, nodeId, answer)

**Input**: `playerId: string`, `nodeId: string`, `answer: Record<string, unknown>`  
**Output**: `{ success: boolean, nextNodeId?: string, error?: string }`

## Functional Requirements

### Phase 1: Interview structure

- **FR1**: Interview nodes stored in Adventure or Passage; nodeIds: `OUROBOROS_START`, `OUROBOROS_LENS`, `OUROBOROS_NATION`, `OUROBOROS_ARCHETYPE`, `OUROBOROS_PLAYBOOK`, `OUROBOROS_DOMAIN`, `OUROBOROS_COMPLETE`
- **FR2**: State persisted in `Player` or `CampaignPlayer`; `ouroborosState` JSON or equivalent
- **FR3**: Playbook node fetches moves for selected Archetype; displays as list or cards

### Phase 2: Character creation page

- **FR4**: `/character/create` or `/onboarding/character` renders interview; uses CampaignReader or custom OuroborosInterview component
- **FR5**: On completion: derive `avatarConfig`, `campaignDomainPreference`, `archetypeId`, `nationId`; persist

## Dependencies

- [archetype-playbooks](../archetype-playbooks/spec.md) — Playbook = moves per Archetype
- [bruised-banana-allyship-domains](../bruised-banana-allyship-domains/spec.md) — Domain preference
- [existing-players-character-generation](../existing-players-character-generation/spec.md) — Build Your Character; Ouroboros may extend or replace

## Verification Quest

- **ID**: `cert-ouroboros-character-interview-v1`
- **Steps**: Complete interview; verify Nation, Archetype, Playbook, domain persisted; verify avatar/contribution summary
