# Spec: 321 Suggest Name (Deterministic Grammar + NPC / Daemon Bridge)

## Purpose

1. **Name the shadow quickly** — Give an apt synthetic name in the 321 flow without AI latency or token cost. Use a **deterministic 6-face name grammar** (MTG-style: Role + Description).
2. **Iterate until it resonates** — Players can click **Suggest Name** repeatedly; each click yields a **new** candidate (variant index), still deterministic per `(charge, mask, attempt)`.
3. **Teach NPCs from inner work** — When a player **accepts** a suggested name or **edits** it, the system **merges** that resolution (plus bounded 321 metadata) into **NPC records** whose profile **matches** the session’s inner-work metadata (nation, archetype, move alignment, etc.). The game “learns” collective texture from real shadow work without exposing raw PII.
4. **Daemon → NPC path (later)** — Daemons grown through 321 (and related flows) can **graduate** to first-class NPCs (`Player` with `creatorType: 'agent'`) at a high enough level / gate threshold, following a growth curve **parallel** to seeded NPCs: player choices and renames continue to enrich the same metadata substrate.

**Problem**: Earlier AI-based suggest name hung (404 / tokens). Blocked players need fast suggestions **and** repeated tries. Separately, inner work stays siloed: NPCs do not absorb player-shaped language unless hand-authored.

**Practice**: Deftness Development — spec kit first, API-first, deterministic over AI for suggest; **bounded** merges (matching keys only, no raw charge in NPC-facing copy unless policy allows).

## Design Decisions

| Topic | Decision |
|-------|----------|
| Primary suggest path | Deterministic grammar; no AI required |
| Multi-click suggest | `attempt` (non-negative int) mixed into hash → different name per click; same triple → same name |
| Name style | MTG-style patterns: `The {Descriptor} {Role}`, etc. |
| 6-face vocab | Each Game Master sect contributes role + descriptor words |
| AI path | Optional, gated; deterministic is default |
| Timeout | 15s client timeout for any legacy API path |
| NPC “matching” | `Player.creatorType === 'agent'` AND nation/archetype (and optional move/domain keys) align with **normalized 321 snapshot** |
| Merge payload | Final chosen/edited name + structured metadata slice + optional truncated charge excerpt (policy) |
| Privacy | No automatic publication of full charge text onto NPC cards; prefer hashes + short excerpts + structured fields |

## 6-Face Name Grammar

| Face | Role words | Descriptor words |
|------|------------|------------------|
| Shaman | Oracle, Keeper, Guardian, Seer, … | Mythic, Earthbound, Ritual, Hidden, … |
| Challenger | Dodger, Walker, Edge, Blade, … | Deft, Bold, Penetrating, Relentless, … |
| Regent | Steward, Keeper, Architect, Order, … | Structured, Disciplined, Calm, Steady, … |
| Architect | Blueprint, Builder, Strategist, … | Precise, Clever, Systematic, … |
| Diplomat | Connector, Weaver, Bridge, … | Quirky, Gentle, Penetrating, Subtle, … |
| Sage | Trickster, Integrator, Mountain, … | Wise, Emergent, Whole, Layered, … |

**Grammar pattern**: Multiple patterns in vocab (e.g. `The {D} {R}`, `{D} {R}`).

## Metadata for Matching (321 → NPC)

**Source**: `Shadow321Session.phase2Snapshot`, `phase3Snapshot` (JSON).

**Normalized “match key”** (conceptual):

- `nationName` or `nationId` (resolve name → id when possible)
- `archetypeName` or `archetypeId`
- `moveType` / `alignedAction` (from phase2) where applicable
- Optional: `developmentalLens`, domain prefs if present in snapshots

**Match rule (v1)**: NPC receives a merge if **at least** nation + archetype (or their canonical keys) match the session’s resolved keys. Stricter rules (move alignment) can be feature-flagged.

## User Stories

### P1: Blocked player gets instant name suggestion

**As a** player stuck at "Give it a name", **I want** to click Suggest Name and get an evocative name immediately, **so** I can move on without typing.

**Acceptance**: Suggest returns quickly; pattern matches Role + Descriptor style.

### P2: Player tries many suggestions until one resonates

**As a** player, **I want** to click Suggest Name again and get a **different** candidate, **so** I can browse until something fits.

**Acceptance**: Consecutive clicks with same charge/mask yield distinct names (until vocab exhausted); refresh preserves behavior (deterministic per `(inputs, attempt)`).

### P3: Chosen or edited name teaches matching NPCs

**As a** player who lands on a name (accepted suggestion or my own edit), **I want** that choice to **add context** to NPCs that share my inner-work profile, **so** the world reflects collective shadow language.

**Acceptance**: On name **commit** (next step / submit), server records merge events for all matching `creatorType: 'agent'` players; audit includes session id + metadata keys, not necessarily full charge.

### P4: Daemon growth aligns with NPC development path

**As a** player growing a daemon from 321, **I want** high-level daemons to **become** NPCs over time, **so** “growing up” the daemon mirrors how NPCs accrue depth.

**Acceptance**: Deferred to Phase 3+; spec defines thresholds and links to [NPC & Simulated Player Content Ecology](../npc-simulated-player-content-ecology/spec.md).

### P5: Clear error when backend unavailable

**As a** player, **I want** a clear error (not infinite loading) when suggest fails.

**Acceptance**: 15s timeout on any network suggest path; toasts or inline error.

## Functional Requirements

- **FR1**: `deriveShadowName(chargeDescription, maskShape, attempt?)` — deterministic, pure; `attempt` defaults to `0`; higher `attempt` shifts hash salt so outputs vary.
- **FR2**: Backend Python port stays in sync with TS (`derive_shadow_name(..., attempt=0)`).
- **FR3**: Frontend: each “Suggest Name” click increments local `suggestionAttempt` and calls grammar with that index.
- **FR4**: On **name resolution** (user proceeds with final string): persist whether final string equals last suggestion (`acceptedSuggestion`) or was edited.
- **FR5**: **NPC merge** (server): given `playerId` (human), `shadow321SessionId` (or inline snapshots), `finalName`, `nameSource` (`suggested_accepted` | `edited` | `typed_no_suggest`), enqueue or write **merge records** for each matching NPC.
- **FR6**: Merge record is **append-only**; NPC “display” copy may summarize recent merges (product decision); default v1 = log only + optional admin/debug view.
- **FR7**: **Daemon link**: when 321 outcome creates/updates a `Daemon`, store `finalShadowName` and session id on daemon if not already present; daemon level-ups append to same conceptual log for future NPC promotion.

## Non-Functional Requirements

- Deterministic suggest: same `(charge, mask, attempt)` → same name.
- Fast: grammar path &lt;100ms.
- No external API calls for default suggest path.
- Merges are **bounded** (rate limit per session / per NPC if abuse becomes a concern).

## API / Server Contracts (Phase 2+)

### Optional: `POST /api/shadow-321/resolve-name` (or server action)

**Input** (conceptual):

```json
{
  "shadow321SessionId": "string",
  "finalName": "string",
  "lastSuggestedName": "string | null",
  "suggestionAttempts": 0
}
```

**Behavior**:

1. Validate session belongs to authenticated player.
2. Update session row with `finalShadowName`, `nameResolution` enum.
3. Run `merge321NameIntoMatchingNpcs(...)`.
4. If linked daemon exists, attach merge summary to daemon metadata (JSON field TBD in schema task).

### NPC merge (internal)

- Query: `Player` where `creatorType = 'agent'` AND match keys from session snapshots.
- Insert: append-only merge table rows OR append JSON array on agent profile (plan picks one).

## Schema (proposed — implement in tasks)

- Extend `Shadow321Session` with optional `finalShadowName`, `nameResolution`, `suggestionCount` (or derive count from client log only in v1).
- New table **`Npc321InnerWorkMerge`** (or equivalent): `id`, `createdAt`, `humanPlayerId`, `npcPlayerId`, `shadow321SessionId`, `finalName`, `nameSource`, `metadataKeys` (Json), `chargeExcerpt` (optional, short).

**Daemon promotion (Phase 8)**: `Daemon` has optional `shadow321SessionId`, `innerWorkDigest` (JSON), and `promotedToPlayerId` when graduated to an NPC. Full-runner awakening uses `awakenDaemonFrom321` (outcome `daemon_awakened`). Promotion runs when `level >= DAEMON_NPC_PROMOTION_MIN_LEVEL` (default 5) via `advanceDaemonLevel` / `maybePromoteDaemonToNpc`.

## References

- [321 Shadow Process](../321-shadow-process/spec.md)
- [Shadow321Runner](../../../src/app/shadow/321/Shadow321Runner.tsx)
- [Game Master Sects](../../../.agent/context/game-master-sects.md)
- [Shadow Name Library (SNL)](../shadow-name-library/spec.md) — feedback + vocab growth
- [Daemons Inner Work Collectibles](../daemons-inner-work-collectibles/spec.md)
- [NPC & Simulated Player Content Ecology](../npc-simulated-player-content-ecology/spec.md)

## Out of Scope (v1 of NPC bridge)

- Full public-facing NPC bios rewritten auto-magically from merges without editorial guard.
- Cross-player visibility of which merge came from whom (privacy).
