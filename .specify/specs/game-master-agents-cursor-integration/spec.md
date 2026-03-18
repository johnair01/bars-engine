# Spec: Game Master Agents Cursor Integration

## Purpose

Align Cursor AI with the six Game Master faces (shaman, regent, challenger, architect, diplomat, sage) so bars-agents MCP is used for BARS domain work and Cursor subagents are used as subagents for the faces. Ensure bars-agents MCP starts reliably by auto-starting the backend before the MCP spawns.

**Problem**: Cursor falls back to built-in mcp_task subagents (evaluator, contrarian, etc.) because (1) bars-agents has no trigger to ensure the backend is live before MCP starts, and (2) there are no rules telling the AI to prefer bars-agents for domain work or which Cursor subagent each face should use.

**Practice**: Deftness Development — spec kit first, deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **bars-agents vs mcp_task** | bars-agents as orchestrators; Cursor subagents as their tools. Hierarchy, not replacement. |
| **MCP startup** | Wrapper script ensures backend is ready before spawning MCP; Cursor invokes wrapper instead of MCP directly. |
| **Subagent mapping** | Use Sage's mapping (from consult): shaman→explore, regent→evaluator, challenger→contrarian, architect→generalPurpose, diplomat→simplifier, sage→evaluator. |
| **Integration work** | Use `sage_consult` from bars-agents MCP, or mcp_task with subagent_type evaluator (Sage's subagent). |

## Bars-Agents Self-Analysis (Sage Consult)

The Sage was consulted. Resulting mapping:

| Game Master | Cursor Subagent | Rationale |
|-------------|-----------------|-----------|
| Shaman | explore | Emotional states, hidden aspects; exploratory nature |
| Regent | evaluator | Structures, systems; assessment and optimization |
| Challenger | contrarian | Boundaries, narratives; skeptical lens |
| Architect | generalPurpose | Quest design, strategy; versatile design work |
| Diplomat | simplifier | Community, relationships; clarifies and connects |
| Sage | evaluator | Integration, synthesis, emergence |

## User Stories

### P1: bars-agents MCP available when backend is down

**As a contributor**, I want Cursor to spawn bars-agents MCP and have it work even when I haven't started the backend manually, so I don't need to remember to run `npm run dev:backend` first.

**Acceptance**: When Cursor invokes bars-agents, the wrapper ensures the backend is ready (auto-starts if needed), then the MCP runs. bars-agents tools (sage_consult, etc.) succeed.

### P2: Correct agent names and tool selection

**As a contributor**, I want Cursor AI to use the six Game Master faces (shaman, regent, challenger, architect, diplomat, sage) and prefer bars-agents tools for BARS domain work, so integration work goes to the Sage and domain work uses the right face.

**Acceptance**: Cursor rule encodes canonical names and when to use bars-agents vs mcp_task. For integration/synthesis, AI uses sage_consult or mcp_task evaluator.

### P3: Subagent mapping when delegating

**As a contributor**, I want Cursor AI to use the Sage's mapping when delegating via mcp_task, so each Game Master face delegates to the right Cursor subagent.

**Acceptance**: Cursor rule includes the mapping. When embodying Challenger, AI uses contrarian; when embodying Sage, AI uses evaluator; etc.

## Functional Requirements

### Phase 1: MCP Wrapper

- **FR1**: Create `scripts/mcp-serve-with-backend.ts` that awaits `ensureBackendReady({ autoStart: true })`, then spawns `uv run python -m app.mcp_server` in backend/ with stdio inherit, exits with child's exit code.
- **FR2**: Update `.cursor/mcp.json` so bars-agents command invokes the wrapper (`npx tsx scripts/mcp-serve-with-backend.ts`), not the MCP directly.
- **FR3**: Add `mcp:serve:with-backend` to package.json for manual testing.

### Phase 2: Cursor Rules

- **FR4**: Create `.cursor/rules/game-master-agents.mdc` (alwaysApply: true) with: canonical six faces; Sage = integration agent; bars-agents as orchestrators, Cursor subagents as tools; Sage's mapping; when to use sage_consult vs mcp_task; tool mapping (architect_draft→architect, etc.).
- **FR5**: Add See Also entry in `.cursorrules` pointing to game-master-agents.

### Phase 3: MCP Instructions

- **FR6**: Expand FastMCP `instructions` in `backend/app/mcp_server.py`: six faces listed; Sage = integration/synthesis; do not confuse with Cursor mcp_task subagents; for BARS domain work, use these tools.

### Phase 4: Documentation

- **FR7**: Update `docs/AGENT_WORKFLOWS.md` with: when to use bars-agents vs mcp_task; Game Master → Cursor subagent mapping table; MCP wrapper behavior.

## Non-Functional Requirements

- Wrapper must not block Cursor startup indefinitely; `ensureBackendReady` has 30s timeout.
- Cursor rule must be concise enough to be always-applied without token bloat.

## Dependencies

- [agent-workflows-cursor](.specify/specs/agent-workflows-cursor/) — ensureBackendReady, bars-agents MCP, mcp.json
- [src/lib/backend-health.ts](../../src/lib/backend-health.ts)
- [backend/app/mcp_server.py](../../backend/app/mcp_server.py)

## References

- [src/lib/feature-decomposition.ts](../../src/lib/feature-decomposition.ts) — FACE_HINTS, GameMasterFace
- [src/lib/sage-coordination.ts](../../src/lib/sage-coordination.ts) — FACE_KEYWORDS
- [docs/AGENT_WORKFLOWS.md](../../docs/AGENT_WORKFLOWS.md)
