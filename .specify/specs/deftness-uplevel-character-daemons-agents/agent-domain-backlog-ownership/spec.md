# Spec: Agent-Domain Backlog Ownership

## Purpose

Assign backlog items to Game Master agent specialty domains so each face owns work within its domain and gets better at solving problems there. The Sage coordinates; other faces (Shaman, Challenger, Regent, Architect, Diplomat) own items by domain.

**Parent**: [deftness-uplevel-character-daemons-agents](../spec.md)

## Design Decisions

| Topic | Decision |
|-------|----------|
| Ownership field | Backlog item has `ownerFace?: GameMasterFace` — which agent owns this item |
| Assignment | Sage or admin assigns; can be manual initially, automated later |
| Domain mapping | Each face has a specialty domain; new items routed by keyword/heuristic or manual |
| Agent improvement | Agents receive context about items they own; prompts tuned per domain |

## Agent Specialty Domains

| Face | Domain | Example Keywords / Areas |
|------|--------|-------------------------|
| Shaman | Mythic, belonging, ritual, identity | daemons, character, talisman, blessed object, identity |
| Challenger | Action, edge, proving ground | nation moves, quest completion, show up, gameboard |
| Regent | Order, structure, roles | schema, playbook, campaign structure, rules |
| Architect | Strategy, blueprint, quest design | quest grammar, CYOA, character creation, compilation |
| Diplomat | Relational, care, connector | copy, community, campaign narrative, feedback |
| Sage | Integration, coordination, meta | backlog coordination, deftness, cross-cutting |

## Schema (Backlog)

```prisma
// Extend SpecKitBacklogItem or equivalent
model SpecKitBacklogItem {
  // ... existing fields
  ownerFace String?  // shaman | challenger | regent | architect | diplomat | sage
}
```

Or in BACKLOG.md / items.json: add `ownerFace` column or field.

## API Contracts

### assignBacklogItemOwner(itemId, face)

**Input**: `itemId: string`, `face: GameMasterFace`  
**Output**: `{ success }`

### getBacklogItemsByOwner(face?)

**Input**: `face?: GameMasterFace` — if omitted, return all with owners  
**Output**: `BacklogItem[]`

### suggestOwnerForItem(itemName, itemDescription)

**Input**: Item metadata  
**Output**: `{ suggestedFace, confidence }` — heuristic routing

## User Stories

### P1: Assign owner to backlog item

**As an admin or Sage**, I want to assign a backlog item to an agent face, so work is owned by the right specialist.

**Acceptance**: Backlog item has `ownerFace`; can be set via admin UI or API. Displayed in backlog list.

### P2: Filter by owner

**As an agent or admin**, I want to see backlog items I own (or by face), so I can focus on my domain.

**Acceptance**: Backlog view filterable by `ownerFace`. Sage sees all; each face sees its items.

### P3: Agent context includes owned items

**As an agent**, I want my context to include the backlog items I own, so I can reason about my domain.

**Acceptance**: When agent is invoked, include `getBacklogItemsByOwner(face)` in context. Agent prompt: "You own these items; prioritize within your domain."

## Functional Requirements

- **FR1**: Backlog model has `ownerFace` (nullable)
- **FR2**: `assignBacklogItemOwner` updates item
- **FR3**: `getBacklogItemsByOwner` returns filtered list
- **FR4**: Admin UI or Sage brief shows ownership; allows assignment
- **FR5**: Agent context builder includes owned items when face is known

## Dependencies

- [agent-admin-wiring](../../agent-admin-wiring/spec.md)
- [sage-brief-v2](../../sage-brief-v2/spec.md)
- [backlog-api-sync](../../backlog-api-sync/spec.md) — if backlog in DB
