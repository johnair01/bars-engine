# Spec: Strand System for BARS Engine

## Purpose

Implement a **strand system** — multi-agent investigation framework — adapted from the dodo project for BARS Engine. Strands orchestrate the 6 Game Master Sects into coordinated investigations that produce BARs (specs, quests, narratives) and optionally git branches, with agent self-advocacy flowing to a coordinator.

**Source**: [GitHub issue #20](https://github.com/johnair01/bars-engine/issues/20) — knowledge transfer package from dodo project.

**Problem**: BARS needs multi-agent coordination for content generation, backlog stewardship, and root cause analysis, but lacks a formal orchestration layer that produces versioned, replayable investigations.

---

## Design Decisions (from Socratic Interview)

| Topic | Decision |
|-------|----------|
| **Primary use cases** | Content generation (Quest/BAR seeds), backlog stewardship (surfacing issues), root cause analysis |
| **Artifacts** | Minimum: spec. Dev: git branch. Player-facing: narrative journey. |
| **Agents** | The 6 Game Master Sects (Shaman, Challenger, Regent, Architect, Diplomat, Sage) are what strands orchestrate. Sects are player-facing; strands are extensible. |
| **Dodo agent mapping** | Map dodo agents onto sects (e.g. dodo architect → BARS Architect). TBD in implementation. |
| **Ethos flavors** | Each sect trains a stat. See Ethos→Stat table below. |
| **Strand metadata** | Strands exist as BARs. Strands produce BARs (quests are subtypes). BARS metabolizes strands via BAR-first model. |
| **Agent self-advocacy** | Before (routing), during (flags), after (retrospective). Flows to coordinator/orchestrator. |
| **Triggers** | Agent tool (one agent invokes strand), MCP tool, Cursor skill, Claude Code skill. |
| **Output location** | Both: git branch + BAR(s), linked by provenance. |
| **Users** | Creator, admins, players (indirectly), developers. |
| **Player triggers** | Strands can be triggered by player action (e.g. complete quest → strand generates next). |
| **Branch–BAR link** | Branch and BAR are separate; linked by provenance. |
| **Strand-as-BAR schema** | Resolved via Architect + Regent consultation. See [Unified Schema](#unified-strand-as-bar-schema) below. |

---

## Unified Strand-as-BAR Schema

*(From Architect + Regent consultation; see [ARCHITECT_REGENT_CONSULT.md](./ARCHITECT_REGENT_CONSULT.md).)*

| Field | Type | Description |
|-------|------|-------------|
| `agent_sequence` | `string[]` | Ordered list of sect IDs that ran in the strand |
| `phase_temperature` | `number` | Narrative complexity / Kotter stage alignment; initiative per phase |
| `output_thread_links` | `object[]` | Maps strand outputs to next phases and Kotter alignment |
| `audit_trail` | `object[]` | Chronological log of sect events: advocacy, decisions, retrospectives. Each entry: `{ sect, event, actor?, timestamp, rationale?, data? }` |
| `branch_reference` | `string?` | Git branch ref when `createBranch`; marks decision-tree divergence points |
| `thread_linkage` | `string[]?` | CustomBar quest IDs this strand connects to. **Nullable stub** — define when Phase 4 player triggers land. |

Strand BARs use `CustomBar.type = "strand"` and store this schema in `strandMetadata` (JSON).

> **Sage deftness note**: `thread_linkage` is a nullable stub — do not define or query it until Phase 4 player triggers. `audit_trail` (renamed from `decision_audit_log`) is load-bearing.

---

## Conceptual Model

### Strand Lifecycle

```
Trigger (agent tool | MCP | Cursor skill | Claude skill | player action)
    → Create strand-as-BAR (metadata)
    → Coordinator selects sect sequence (with self-advocacy input)
    → Execute phases (each sect runs, may advocate before/during/after)
    → Coordinator synthesizes
    → Produce output BARs (spec, quest, narrative)
    → Optionally: create git branch, link by provenance
    → Update strand-as-BAR with results
```

### Agent Hierarchy (BARS-Adapted)

| Level | Role | BARS Mapping |
|-------|------|--------------|
| **L3 Orchestrator** | Coordinator, Composer, Fair Witness | Sage (routes, masks, synthesizes); Regent (order, structure) |
| **L2 Composite** | Artificer, Chronicler, Architect, Ontologist | Architect, Regent, Diplomat (weave), Shaman (mythic) |
| **L1 Specialist** | Researcher, Codemedic, Ontology Interviewer, etc. | Map to sect capabilities; Challenger (action), Diplomat (relational) |

**Canonical dodo→sect mapping** (finalized via Socratic interview + Sage review):

| Dodo Role | Level | BARS Sect |
|-----------|-------|-----------|
| Researcher | L1 | Shaman — liminal explorer, reads terrain |
| Codemedic | L1 | Challenger — diagnoses, breaks through |
| Ontology Interviewer | L1 | Diplomat — relational, bridges concepts |
| Artificer | L2 | Architect — designs structures |
| Chronicler | L2 | Regent — record-keeper, enforces order |
| Ontologist | L2 | Sage — synthesizes, integrates |
| Coordinator | L3 | Diplomat — harmonizes across agents |
| Composer | L3 | Diplomat — weaves narrative |
| Fair Witness | L3 | Sage — holds space, reflects |

> Note: Coordinator + Composer both map to Diplomat — watch for Diplomat overload as sect complexity grows.

### Strand Types (from dodo, BARS-adapted)

| Type | Use case | Example output |
|------|----------|----------------|
| `research` | Open exploration | Spec, BAR seeds |
| `postmortem` | Retrospective | INCIDENTS.md entry, lessons BAR |
| `implementation` | Code changes | Git branch, spec, tasks |
| `operational` | Process improvement | Runbook BAR |
| `diagnostic` | Root cause analysis | Spec, fix plan |
| `content` | Quest/narrative generation | Quest BAR, narrative journey |
| `backlog` | Backlog stewardship | New issues, prioritization BAR |

---

## API Contracts (API-First)

### Strand Execution

**Input**:
```ts
{
  type: 'research' | 'postmortem' | 'implementation' | 'operational' | 'diagnostic' | 'content' | 'backlog'
  subject: string
  context?: { playerId?: string; barId?: string; branch?: string }
  options?: { createBranch?: boolean; sects?: string[] }
}
```

**Output**:
```ts
{
  strandBarId: string
  outputBarIds: string[]
  branch?: string  // if createBranch
  provenance: { strandBarId; outputBarIds; branch? }
}
```

### Agent Self-Advocacy (internal)

**Before**: Sect returns `{ shouldRun: boolean; suggestRoute?: string; reason?: string }`  
**During**: Sect returns `{ flag: string; message: string; severity?: string }`  
**After**: Sect returns `{ retrospective: string; suggestedImprovements?: string[] }`  

Coordinator receives all; uses for routing and strand-as-BAR metadata.

---

## User Stories

### P1: Creator runs diagnostic strand from IDE

**As a** creator, **I want** to run a diagnostic strand from Cursor when something breaks, **so** I get a root-cause spec and optional fix branch without leaving the IDE.

**Acceptance**: MCP tool + Cursor skill; strand produces spec BAR + optional branch; provenance links them.

### P2: Admin triggers content strand for quest generation

**As an** admin, **I want** to trigger a content strand from the admin UI to generate quest seeds from a BAR, **so** I get narrative-ready quests without manual authoring.

**Acceptance**: Agent tool or admin UI; strand produces quest BARs; strand-as-BAR records sect sequence.

### P3: Player action triggers strand

**As a** player, **I want** my completion of a quest to optionally trigger a strand that generates my next narrative step, **so** my journey feels responsive and emergent.

**Acceptance**: Player action (e.g. quest complete) can invoke strand; output flows to player as narrative/quest.

### P4: Developer runs implementation strand

**As a** developer, **I want** to run an implementation strand from Claude Code that produces a spec + git branch, **so** I have a replayable investigation and clean branch to work from.

**Acceptance**: Claude Code skill; branch + BAR; provenance link.

---

## Functional Requirements

### Phase 1: Strand-as-BAR + Coordinator Shell

- **FR1**: Strand metadata stored as BAR (`CustomBar.type = "strand"`). Schema: `agent_sequence`, `phase_temperature`, `output_thread_links`, `decision_audit_log`, `branch_reference` (see [Unified Schema](#unified-strand-as-bar-schema)).
- **FR2**: Coordinator agent (Sage or Regent) can receive self-advocacy from sects and route accordingly.
- **FR3**: Strand execution produces at least one output BAR (spec minimum).

### Phase 2: Triggers

- **FR4**: MCP tool `strand:run` for IDE invocation.
- **FR5**: Cursor skill for strand execution.
- **FR6**: Claude Code skill for strand execution.
- **FR7**: Agent tool: any sect can invoke a strand (e.g. Architect invokes diagnostic strand).

### Phase 3: Git + Provenance

- **FR8**: When `createBranch`, strand creates `strand/{type}/{id[:8]}-{subject}` branch.
- **FR9**: Branch and output BARs linked by provenance (BAR references branch; branch referenced in BAR metadata).
- **FR10**: Strand-as-BAR records branch ref when created.

### Phase 4: Player Triggers

- **FR11**: Player action (e.g. quest complete) can trigger strand via configurable hook.
- **FR12**: Strand output for player context flows as narrative/quest to player.

### Phase 5: Self-Advocacy

- **FR13**: Sects return three advocacy signals:
  - **before**: `{ shouldRun: bool, suggestRoute?: str, reason?: str }` — coordinator logs objection to `audit_trail` but **runs anyway** (advisory only)
  - **during**: `{ flag: str, message: str, severity?: str }` — logged to `audit_trail` mid-execution
  - **after**: `{ retrospective: str, suggestedImprovements?: str[] }` — logged to `audit_trail` post-run
- **FR14**: All advocacy stored in `audit_trail` entries with `event` = `before_advocacy | during_flag | after_retro`.
- **FR15**: Admin strand view (Phase 5b) renders `audit_trail` — not built until data exists.

**Ethos→Stat (finalized):**

| Sect | Ethos | Stat |
|------|-------|------|
| Shaman | Compassion | Empathy |
| Challenger | Courage | Resolve |
| Regent | Balance | Equity |
| Architect | Balance | Clarity |
| Diplomat | Compassion | Harmony |
| Sage | Wisdom | Enlightenment |

---

## Non-Functional Requirements

- Strand execution should not block UI; use background/queue for long runs.
- MCP/Cursor/Claude skills must work offline-capable where possible (local backend).
- Strand-as-BAR must be queryable for replay (`dodo:replay_strand` equivalent).

---

## Resolved (Architect / Regent Consultation)

1. **Strand-as-BAR schema**: ✅ Unified schema above (Sage deftness review applied: `audit_trail` replaces `decision_audit_log`; `thread_linkage` stubbed nullable).
2. **Dodo→Sect mapping**: ✅ Finalized — see Agent Hierarchy table above.
3. **Ethos→Stat mapping**: ✅ Finalized — see Phase 5 table above.

---

## Dependencies

- Game Master Sects (existing)
- Backend agents (Regent, Architect, Sage, etc.)
- BAR/quest data model
- MCP server (existing)
- Cursor/Claude Code integration

---

## References

- [GitHub issue #20](https://github.com/johnair01/bars-engine/issues/20) — full knowledge transfer package
- [game-master-sects.md](.agent/context/game-master-sects.md)
- [FOUNDATIONS.md](../../FOUNDATIONS.md)
- [JIRA_GITHUB_CYOA_METAPHOR.md](../../docs/JIRA_GITHUB_CYOA_METAPHOR.md)
