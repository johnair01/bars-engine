# Plan: Strand BARs — dedicated creator identity

## Overview

Implement **explicit `Player` resolution** for strand-created `CustomBar` rows so automated outputs do not attach to an arbitrary first user. **Contract first** (`Settings` + resolution function), then **runner wiring**, then **seed + docs**, then **verify**.

**Authority**: [.specify/specs/strand-bars-creator-identity/spec.md](./spec.md)

## Phases

### Phase 1 — Backend contract (generative dependency)

1. **`backend/app/config.py`** — Add optional `strand_creator_player_id: str = ""` mapped from `STRAND_CREATOR_PLAYER_ID`.
2. **`backend/app/strand/creator.py`** (new) — `async def resolve_strand_creator_id(session: AsyncSession) -> str`:
   - Validate env id if set
   - Else lookup by `creator_type == 'agent'` and canonical name constant
   - Else raise `RuntimeError` with operator message
3. **`backend/app/strand/runner.py`** — Replace `_get_system_creator_id` calls with `resolve_strand_creator_id`.
4. **Tests** — `backend/tests/test_strand_creator_resolution.py` (or under `test_strand/`) covering three branches.
5. **Seed** — `scripts/seed-strand-agent-player.ts` or extend existing Prisma seed with upsert of agent player (name + `creatorType`); document optional fixed id for prod.
6. **Docs** — `docs/ENV_AND_VERCEL.md` + one line in `AGENT_WORKFLOWS.md` if strands section exists.

### Phase 2 — Optional operator visibility

- `GET /api/admin/strand-creator` with existing admin auth deps **or**
- Admin SQL runbook in spec **References** only.

**Defer** until Phase 1 ships and an operator asks for UI.

## File impacts (Phase 1)

| File | Change |
|------|--------|
| `backend/app/config.py` | New setting field |
| `backend/app/models/player.py` | Add `creator_type` / `creatorType` column on `Player` if missing (align with Prisma) |
| `backend/app/strand/creator.py` | New module |
| `backend/app/strand/runner.py` | Import resolver |
| `backend/tests/...` | New tests |
| `scripts/` or `prisma/seed.ts` | Agent player upsert |
| `docs/ENV_AND_VERCEL.md` | Env documentation |

## Risks

- **Production** without seed: strand fails until operator sets env or runs seed — **acceptable** (fail loud).
- **Duplicate agent players**: lookup should use **unique** canonical name or add partial unique constraint in a later migration if needed.

## Deftness note

Single schema field reuse (`creatorType`) avoids migration; **one** resolution module avoids scattering `LIMIT 1` logic — **generative** for future MCP tools that create BARs (same resolver).
