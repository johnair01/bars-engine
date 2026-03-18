# Strand System — Implementation Plan

## MVP (Phase 1–2)

**Goal**: One strand type running end-to-end with one trigger.

### Recommended MVP: Diagnostic Strand + MCP Trigger

| Step | Deliverable | Rationale |
|------|-------------|-----------|
| 1 | Strand-as-BAR schema (minimal) | Architect/Regent define; or use placeholder: `{ type, subject, sectSequence, outputBarIds, branchRef? }` |
| 2 | Coordinator shell | Sage or Regent as coordinator; receives problem, selects 2–3 sects, runs sequence |
| 3 | Diagnostic strand preset | Researcher (Shaman?) → Fair Witness (Sage?) → Architect → Coordinator |
| 4 | MCP tool `strand:run` | IDE invocation; returns strandBarId + outputBarIds |
| 5 | Output: spec BAR | Strand produces at least one BAR (diagnostic spec) |

**Defer**: Git branch creation, player triggers, Cursor/Claude skills, full self-advocacy.

---

## Phase 2: Triggers + Git

- Cursor skill
- Claude Code skill
- Agent tool (sect invokes strand)
- Git branch creation + provenance link

---

## Phase 3: Content + Player

- Content strand (quest generation)
- Backlog strand (issue surfacing)
- Player-action trigger hook

---

## Phase 4: Self-Advocacy + Replay

- Before/during/after advocacy
- Coordinator uses advocacy for routing
- Strand replay (apply historical pattern to new problem)

---

## Open Questions for Architect/Regent

Before Phase 1 implementation, consult Architect and Regent agents on:

1. Strand-as-BAR canonical schema
2. Dodo agent → Sect mapping table
3. Temperature/flavor presets per strand type
