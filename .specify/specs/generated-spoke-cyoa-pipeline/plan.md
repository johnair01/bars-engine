# Plan: Generated spoke CYOA pipeline

## Outcome

One **implementable** sequence: **landing (existing)** → **collect inputs** (move, charge, face) → **generate + validate** CYOA → **play** → **terminal** (BAR + nursery) → **hub**.

## Phases

### Phase 0 — Contracts & flags

- Freeze **input DTO** and **output DTO** (passage list + terminal bindings).
- Add **feature flag** or **campaign allowlist** (e.g. `bruised-banana` only) for generation v1.
- Document **idempotency**: e.g. `PlayerAdventureProgress` or `GeneratedSpokeRun` row keyed by `(playerId, campaignRef, spokeIndex, periodId?)` — **one active generated graph per key** unless steward resets.

### Phase 1 — Opening + intake UI

- **Embed or precede** generator: UI blocks for **FR1** (context, fortune, milestone, fundraising) — may reuse **landing** data + BBMT strip components; avoid duplicating instance queries.
- **FR2** UI: four-move picker + **charge capture** (reuse GD patterns — short path, private-by-default).
- **FR3** UI: **six-face** picker with **signature move** copy per face (content table in repo or CMS).

### Phase 2 — Generator service

- Implement **generator** (AI SDK or internal orchestrator): prompts + **structured output** matching **UGA** passage shape.
- **Post-process:** run **validateFullAdventurePassagesGraph** (or export to `Passage` + validate).
- **Persistence:** write to **draft** adventure or **ephemeral session store** → promote to player-bound adventure id when validated.
- **Latency:** if generation &gt; 2–3s, show **progress** state after opening beat; optional **skeleton** first node.

### Phase 3 — Play integration

- **Route** generated content into **`AdventurePlayer`** (or thin wrapper) with **terminal hooks**.
- Terminal passage `metadata` (or server-detected completion) calls:
  - `emitBarFromPassage` / extended action with **charge injection** + face blueprint
  - `plantSeedFromSpoke` / `plantKernelFromBar` per SMB (exact pairing in tasks)
- **FR5.3:** `router.push` to `/campaign/hub?ref=…`

### Phase 4 — Polish & cert

- Copy pass: **cultivation sifu** tone per face.
- Admin: **preview** generated graph with `preview=1`.
- Cert quest + **BACKLOG** id when shipping.

## Dependencies

| Dependency | Role |
|------------|------|
| UGA | Graph validation |
| SMB | Terminal nursery plant |
| BBMT | Milestone / honest next-step copy |
| CHS runtime | Spoke index, hexagram handoff |
| Instance | Fundraising URLs, kotter |

## Risks

| Risk | Mitigation |
|------|------------|
| Invalid graphs | Validate before bind to player |
| Cost / latency | Cache template chunks; limit max tokens; allowlist |
| Vault block | FR6 compost modal before terminal emit |

## Open questions (resolve in tasks)

- Store **generated passages** in DB vs **blob** vs **inline session** for v1.
- **Period** key for idempotency (Kotter period vs calendar).
