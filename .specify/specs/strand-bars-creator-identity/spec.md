# Spec: Strand BARs — dedicated creator identity (agent hand)

## Purpose

Ensure **strand and MCP-generated BARs** are owned by a **stable, explicit `Player`** (system agent), **not** an accidental “first row in `players`,” so **Hand / vault / admin triage** stay clean and **human admin accounts** are not mixed with automated outputs.

**Problem**: [`run_strand`](../../../backend/app/strand/runner.py) uses `_get_system_creator_id` → `SELECT id FROM players LIMIT 1`, which binds strand output to **whoever sorts first** (often the real admin). That violates separation between **human ops** and **agent/dev artifacts**.

**Practice**: Deftness Development — spec kit first, **API-first** (config + resolution contract before any UI), **deterministic** identity (env + seed), minimal schema churn (reuse `Player.creatorType`).

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Identity model** | Dedicated **`Player`** row with `creatorType = 'agent'` (existing Prisma field), human-readable name (e.g. `BARS Strand Agent`). |
| **Binding mechanism** | Backend **`STRAND_CREATOR_PLAYER_ID`** (optional). If set and valid → use; else **deterministic lookup** by `(creatorType, name)`; else **clear startup/runtime error** with operator hint (no silent fallback to `LIMIT 1`). |
| **Separation from main admin** | Strand BARs use **`creatorId` = agent player** only; human admins use their own login; optional future UI lists “agent hand” without impersonation. |
| **Scope** | **Phase 1**: Backend resolution + seed + docs. **Phase 2** (optional): Admin or Hand filter UI for `creatorId` / `isSystem` strand BARs. |
| **Relation to strand-system** | Extends [strand-system-bars](../strand-system-bars/spec.md) — **output location** becomes explicit; does not replace strand metadata or sect sequence. |
| **SQLAlchemy ↔ Prisma** | Prisma already has `Player.creatorType`. If [`backend/app/models/player.py`](../../../backend/app/models/player.py) lacks that column, **add** `creator_type` mapped to the same DB column as Prisma before relying on ORM lookup (or use raw SQL once — deftness prefers one ORM mapping). |

---

## Conceptual Model

| Dimension | Mapping |
|-----------|---------|
| **WHO** | **Agent `Player`** — the “hand” that holds system/strand BARs (`CustomBar.creatorId` → agent). |
| **WHAT** | Strand BAR (`type=strand`) + output BARs (`vibe`/spec) — same as today; **ownership** changes. |
| **WHERE** | N/A (not domain-scoped); **governance** via env + seed per environment. |
| **Energy / moves** | N/A |

---

## API Contracts (API-First)

> Define before implementation. **No change** to public strand **request** shape unless we add optional override (out of scope for Phase 1).

### Backend settings (FastAPI)

**Input**: Environment variable  

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `STRAND_CREATOR_PLAYER_ID` | `string` (UUID/cuid) | No | If set, must reference an existing `Player.id`; used as sole `creatorId` for strand BARs. |

**Resolution order** (deterministic):

1. If `STRAND_CREATOR_PLAYER_ID` is non-empty → load `Player` by id; if missing → **error** (do not fall back silently).
2. Else → `SELECT id FROM players WHERE creator_type = 'agent' AND name = <canonical name constant>` (exact match policy in plan).
3. Else → **error**: `"Strand creator Player not configured; run seed or set STRAND_CREATOR_PLAYER_ID"` (no `LIMIT 1` fallback).

**Output**: Resolved `player_id: str` used wherever strand creates `CustomBar` rows.

### HTTP (existing)

**`POST /api/strands/run`** — [strands router](../../../backend/app/routes/strands.py)

- **Request body**: Unchanged (`type`, `subject`, …).
- **Response**: Unchanged (`strand_bar_id`, `output_bar_ids`, …).
- **Behavioral contract**: Created BARs’ `creatorId` **must** equal resolved strand creator id (testable).

### Optional Phase 2 — discovery endpoint

**`GET /api/admin/strand-creator`** (admin-auth only)

- **Response**: `{ "playerId": string, "playerName": string, "source": "env" | "lookup" }`
- **Purpose**: Operators confirm identity without SQL; implement only if admin auth pattern exists in FastAPI.

---

## User Stories

### P1: Operator — stable ownership

**As an operator**, I want strand-generated BARs to belong to a **known agent account**, so my **personal admin hand** is not polluted.

**Acceptance**:

- [ ] With env set to a valid agent player id, new strand runs create BARs with `creatorId` = that id.
- [ ] With env unset but seeded agent player present, resolution finds that player by `(creatorType, name)`.
- [ ] With neither configured, strand fails with a **readable** error (no silent `LIMIT 1`).

### P2: Developer — documented env

**As a developer**, I want **`docs/ENV_AND_VERCEL.md`** to document `STRAND_CREATOR_PLAYER_ID`, so production and local stay aligned.

**Acceptance**:

- [ ] Env var documented with example and “when to set.”

### P3 (optional): Admin — visibility

**As an admin**, I want to **find** strand/system BARs by creator (filter or doc query), so I can review outputs.

**Acceptance** (Phase 2): TBD — filter in Admin or SQL runbook in spec **References**.

---

## Functional Requirements

### Phase 1 (required)

- **FR1**: Add `strand_creator_player_id` (or equivalent) to FastAPI `Settings`; read `STRAND_CREATOR_PLAYER_ID` from env.
- **FR2**: Replace `_get_system_creator_id` with **`resolve_strand_creator_id(session)`** implementing the resolution order above.
- **FR3**: Idempotent **seed** (script or extension of existing seed) that upserts agent `Player` with canonical name and `creatorType = 'agent'` (and stable id **optional** via env for first-time bootstrap).
- **FR4**: **Tests**: unit/integration tests for resolution (mock session / test DB): env wins, lookup wins, missing → error.
- **FR5**: Document env in **`docs/ENV_AND_VERCEL.md`** and cross-link from [`AGENT_WORKFLOWS.md`](../../../docs/AGENT_WORKFLOWS.md) if strands are mentioned.

### Phase 2 (optional)

- **FR6**: Admin discovery endpoint or Admin UI filter for strand BARs by `creatorId` / `type = strand`.

---

## Non-Functional Requirements

- **Backward compatibility**: Existing databases may have strand BARs on old creator; **no automatic migration** in Phase 1 (optional follow-up spec).
- **Security**: Agent player should **not** receive admin `PlayerRole` unless explicitly desired; document recommendation.

---

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| Env | Document `STRAND_CREATOR_PLAYER_ID`; validate at strand run, not every request if cached per process |
| DB | No new tables; optional unique partial index on `(creator_type, name)` only if duplicates become a problem |

---

## Verification

**Phase 1** (no player-facing UX change): **Automated tests** replace a full CYOA verification quest. Run:

- `cd backend && uv run pytest` (targeted tests for `resolve_strand_creator_id`)

**Phase 2** (if admin UI): Add verification quest per [cyoa-certification-quests](../cyoa-certification-quests/) — `cert-strand-creator-v1` walking admin to confirm filter.

---

## Dependencies

- [strand-system-bars](../strand-system-bars/spec.md) — strand execution, BAR types, MCP `strand_run`
- Prisma `Player.creatorType` — `human` | `agent`

---

## References

- [`backend/app/strand/runner.py`](../../../backend/app/strand/runner.py) — `_get_system_creator_id`
- [`backend/app/config.py`](../../../backend/app/config.py) — Settings pattern
- [Spec Kit Translator — API-first prompt](../../../.agents/skills/spec-kit-translator/SKILL.md)
- [Deftness — API-first](../../../.agents/skills/deftness-development/SKILL.md)

---

## Spec Kit Prompt (API-First) — for implementers

```markdown
Implement **strand BAR creator identity** per [.specify/specs/strand-bars-creator-identity/spec.md](./spec.md).
**API-first**: add `STRAND_CREATOR_PLAYER_ID` to backend Settings; implement `resolve_strand_creator_id(session)` with deterministic order; replace `_get_system_creator_id`; add seed + tests; document env. No UI required for Phase 1.
```
