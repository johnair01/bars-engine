# Spec: Game Master Face Moves

## Purpose

Define explicit moves for each Game Master face in both the **codebase** and the **game**.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. Each face has applications in both dimensions; they must not leave their domains except with counsel from the Sage. The Sage, as wise trickster, can run *as* another face (same tools, different prompt) when that lens serves the aim.

**Parent**: [EXPLORATION.md](EXPLORATION.md)

## Design Decisions

| Topic | Decision |
|-------|----------|
| Symmetry | Each face has explicit applications in codebase and game |
| Sage as trickster | Sage runs as another face (same tools, different prompt) — not delegation |
| Priorities | Game first, then codebase |
| Domain constraint | Faces do not leave their domains except with Sage counsel |
| Agency | Players, admins, scripts, and agents can invoke face moves as appropriate |

## Per-Face Move Matrix

### Shaman (Earth — Mythic threshold, belonging, ritual)

| Dimension | Move | Description |
|-----------|------|-------------|
| **Game** | Create ritual | Moment before a quest (e.g. name a belief, light a candle); preside over 321 / Emotional First Aid |
| **Game** | Name shadow belief | Player names or acknowledges a shadow belief; Shaman witnesses |
| **Codebase** | Run 321 script | Scheduled or triggered script that runs 321 shadow process |
| **Codebase** | Map emotional channel | Map emotional_alchemy tags to quest grammar; suggest when BAR is stuck in a channel |

### Challenger (Fire — Proving ground, action, edge)

| Dimension | Move | Description |
|-----------|------|-------------|
| **Game** | Issue challenge | Time-bound quest, bid, or dare; "You're ready" / "Not yet" |
| **Game** | Propose move | Recommend one of 15 canonical moves; validate energy before action |
| **Codebase** | Flag blocked | Flag backlog items or quests as stuck; suggest Clean Up before ship |
| **Codebase** | Suggest unblock | Propose fork, energy shift, or move to unblock |

### Regent (Lake — Order, structure, roles, rules)

| Dimension | Move | Description |
|-----------|------|-------------|
| **Game** | Declare period | "We are in Coalition"; focus quests on coalition-building |
| **Game** | Grant role | Steward, quest-owner, campaign contributor |
| **Codebase** | Advance stage | Advance Kotter stage when threshold met |
| **Codebase** | Court view | List active players, threads, domains; suggest who does what next |

### Architect (Heaven — Blueprint, strategy, project)

| Dimension | Move | Description |
|-----------|------|-------------|
| **Game** | Offer blueprint | Quest template players can fork; strategy guide |
| **Game** | Design layout | Gameboard layout, slot order, draw logic (inform design) |
| **Codebase** | Draft quest | Create quest from narrative lock; compile grammar |
| **Codebase** | Steward backlog | Create, prioritize, decompose backlog items |

### Diplomat (Wind — Weave, relational field, care)

| Dimension | Move | Description |
|-----------|------|-------------|
| **Game** | Offer connection | "Player X is also in Gathering Resources; consider reaching out" |
| **Game** | Host event | Community event, shared reflection space |
| **Codebase** | Match player | Match stuck player to instance or campaign |
| **Codebase** | Create invitation | Generate or send invitation; community pulse tool |

### Sage (Mountain — Wise trickster, integration, flow)

| Dimension | Move | Description |
|-----------|------|-------------|
| **Game** | Witness | Hold paradox; witness completion; offer meta-perspective |
| **Game** | Cast hexagram | I Ching reading for player decision |
| **Codebase** | Run as face | Use another face's tools with Sage-inflected prompt (mask) |
| **Codebase** | Route and synthesize | Delegate to specialists; synthesize; suggest face ownership |

## Domain Constraint

Faces do not leave their domains except with counsel from the Sage. When a face would act outside its domain (e.g. Shaman touching schema, Regent doing emotional reading), the system should:

1. Route to Sage for counsel
2. Sage may run as the appropriate face (mask) or delegate
3. The originating face receives synthesized guidance

## Sage Mask Implementation

When Sage "uses a mask":

- **Same tools** as the target face (e.g. Architect's get_active_quests, get_nation_moves)
- **Different prompt**: Sage system prompt + "You are speaking through [Face]. Your aim is [Sage's aim]. Use [Face]'s tools and voice."
- **Not delegation**: Sage invokes the tools directly, not via consult_architect etc.

## BAR Output Requirement

**Every face move produces a BAR (CustomBar).** Each move, when executed, creates a CustomBar record. The BAR type, content, and gameMasterFace vary by move.

| Face | Move | BAR Produced |
|------|------|--------------|
| **Shaman** | Create ritual | BAR (type: vibe/insight) — ritual moment, named belief before quest |
| **Shaman** | Name shadow belief | BAR (type: insight) — shadow belief acknowledged; Shaman witnesses |
| **Challenger** | Issue challenge | BAR (type: vibe) — challenge issued; links to time-bound quest |
| **Challenger** | Propose move | BAR (type: vibe) — move recommendation with energy assessment |
| **Regent** | Declare period | BAR (type: vibe) — period declaration; "We are in Coalition" |
| **Regent** | Grant role | BAR (type: vibe) — role granted; steward/contributor assignment |
| **Architect** | Offer blueprint | BAR (type: vibe) — blueprint/template; players can fork as quest |
| **Architect** | Design layout | BAR (type: vibe) — layout suggestion; informs design |
| **Diplomat** | Offer connection | BAR (type: vibe) — connection suggestion; "consider reaching out to X" |
| **Diplomat** | Host event | BAR (type: vibe) — event invitation; community reflection |
| **Sage** | Witness | BAR (type: vibe/insight) — witness note; meta-perspective on completion |
| **Sage** | Cast hexagram | BAR (type: vibe) — hexagram reading; I Ching alignment |

All BARs MUST have `gameMasterFace` set to the face that produced them. BARs may link to quests, players, or instances via metadata.

## Implementation Phases

### Phase 1: Game moves (priority) — each produces a BAR

- **Shaman**: Create ritual (game) → BAR (ritual moment, named belief); Name shadow belief → BAR (insight)
- **Challenger**: Issue challenge (game) → BAR (challenge) + optional time-bound quest; Propose move → BAR (recommendation)
- **Regent**: Declare period (game) → BAR (period declaration); Grant role (game) → BAR (role granted)
- **Architect**: Offer blueprint (game) → BAR (blueprint); players fork as quest
- **Diplomat**: Offer connection (game) → BAR (connection suggestion); Host event → BAR (event)
- **Sage**: Witness (game) → BAR (witness note); Cast hexagram (game) → BAR (hexagram reading) — extend existing

### Phase 2: Codebase moves

- Shaman: Run 321 script; Map emotional channel
- Challenger: Flag blocked; Suggest unblock
- Regent: Advance stage (exists); Court view
- Architect: Steward backlog (extend sage:brief)
- Diplomat: Match player; Create invitation
- Sage: Run as face (mask implementation)

### Phase 3: Domain constraint enforcement

- Route out-of-domain actions to Sage
- Sage counsel or mask before cross-domain act

## API Contracts

Codebase moves invoke MCP tools (architect_draft, challenger_propose, shaman_read, regent_assess, diplomat_guide, sage_consult, etc.). Input/output contracts are documented in [docs/AGENT_WORKFLOWS.md](../../docs/AGENT_WORKFLOWS.md#mcp-tool-contracts).

## Reference

- [.agent/context/game-master-sects.md](../../.agent/context/game-master-sects.md)
- [sage-coordination-protocol](../deftness-uplevel-character-daemons-agents/sage-coordination-protocol/spec.md)
- [EXPLORATION.md](EXPLORATION.md)
