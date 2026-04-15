# Plan: BARS Engine — Game Master Move

## Goal

1. **`POST /api/game-master/move`** — Wave moves with optional **player/collective context**; per-face artifact-shaped outputs (system + drafts).
2. **`POST /api/game-master/resolve-quest`** — **Savvy** quest + NPC face + **artifact prize** from instance position, charge, BARs, nation, archetype.
3. **`GET /api/game-master/collective-context`** — Read-only collective snapshot for agents and UI.
4. **Completion grant** — Wire quest completion → artifact prize (server actions or `POST /api/quests/{id}/complete` when models are clear).

Design intent: **GM characters issue quests**; **artifacts are completion prizes**; **GM agents** implement APIs and system artifacts. See [spec.md](spec.md) world model.

## Non-goals (initial)

- Replacing `match-bar-to-quests` (it becomes a **signal inside** resolve).
- Full LLM stack for all six faces in v1.

## Phase 0 — Contracts

- Types: `GmWaveMove`, `Artifact`, `QuestProposal`, `PlayerQuestContext`, request/response DTOs.
- Normalization: snake_case wave moves ↔ `BarWavePhase`.
- Auth matrix: `BARS_API_KEY` vs session per route.

## Phase 1 — Move + collective context

- Implement **`GET /api/game-master/collective-context`** (minimal safe fields + auth).
- Implement **`POST /api/game-master/move`** with optional `context` for `clean_up` + `wake_up`; stubs for `grow_up` / `show_up` as in spec.

## Phase 2 — Resolve quest

- Implement **`POST /api/game-master/resolve-quest`**: load `Instance` + `Player`, merge BAR registry / inline BARs, call existing match scoring, rank, attach **presentingFace** + **artifactPrize** (templates or AI).
- Optional: persist last proposals on `BarForgeRecord.metadataJson` or player metadata.

## Phase 3 — Show Up + completion

- Encounter / assignment hooks (quest threads, NPC tooling) consuming `QuestProposal`.
- Quest completion → grant **artifact** prize (inventory / `CustomBar` / ledger — align with product).

## Phase 4 — Docs + OpenAPI

- Keep [openapi/bars-engine-gm-quest.yaml](../../openapi/bars-engine-gm-quest.yaml) in sync.
- Cross-link [docs/BAR_FORGE_API.md](../../docs/BAR_FORGE_API.md) to new doc or spec section.

## Verification

- `npm run build` && `npm run check`
- If schema changes: `npm run db:sync`

## Dependencies

- [spec.md](spec.md)
- `src/lib/bar-forge/*`, Prisma `Instance`, `Player`, `CustomBar`
