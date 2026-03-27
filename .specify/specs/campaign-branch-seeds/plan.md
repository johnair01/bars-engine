# Plan: Campaign branch seeds

Implement per [.specify/specs/campaign-branch-seeds/spec.md](./spec.md).

## Dependencies

- [unified-cyoa-graph-authoring](../unified-cyoa-graph-authoring/spec.md) — validation spine must be in place for **metabolize** (already partially implemented: `validateFullAdventurePassagesGraph`, `upsertCampaignPassage` validation).
- [campaign-onboarding-cyoa](../campaign-onboarding-cyoa/spec.md) — align steward/instance matrix when implementing **FR4** scoping (may stub to “instance owner + admin” if COC matrix still TBD).

## Decisions to lock before build

1. **FR5 visibility:** Recommend **C (hybrid)** for v1—lowest griefing surface: show **aggregate** interest at node, full text for **planter** and **stewards/admins**; optional “public opt-in” on plant form later.
2. **Threading:** Allow **multiple seeds** per node; **water** attaches to a **specific seed** (not a single thread per node) unless UX research prefers one thread—document choice in tasks.
3. **Steward definition v1:** `Instance` hosts/owners + users with existing **campaign edit** capability used by `CampaignPassageEditModal` / instance policy; **global admin** always.
4. **Prisma models (sketch):**
   - `CampaignBranchSeed`: id, adventureId, nodeId, planterPlayerId, trigger enum, brokenTargetId nullable, title nullable, body, optional barId/questId JSON, tags JSON, status (`open` | `archived` | `metabolized`), metabolizedAt, metabolizedByPlayerId, resultingPassageIds JSON nullable, createdAt/updatedAt.
   - `CampaignBranchSeedWater`: id, seedId, actorPlayerId, role enum (`player` | `steward` | `admin`), note nullable, internalNote nullable (steward-only), createdAt.
5. **Sort score:** e.g. `score = playerWaters + 3 * stewardWaters + 5 * adminWaters` (tune in QA).

## Phases

### Phase 0 — Spec & alignment

- Confirm FR5 and steward matrix; add **BACKLOG.md** row + optional prompt under `.specify/backlog/prompts/` if used.
- Cross-link from [player-facing-cyoa-generator](../player-facing-cyoa-generator/spec.md) “Use cases / Improve expand” to CBS.

### Phase 1 — Data + plant

- Prisma schema + migration (`npm run db:sync` in dev; ship with `migrate dev` per fail-fix rules).
- Server actions: `plantCampaignBranchSeed`, `listSeedsForNode` (respecting FR5 visibility).
- `CampaignReader` (and/or API route): broken-path UI + quiet CTA; no metabolize yet.

### Phase 2 — Water

- Server action: `waterCampaignBranchSeed` with role detection (reuse admin check + steward check helper).
- Player UI: seed list or count at node per FR5; water button.
- Steward queue: sort by weighted score + recency.

### Phase 3 — Metabolize

- Steward flow: jump to existing **admin passage create/edit** with **prefill** from seed (node id, suggested target, draft text) OR embedded modal that calls same actions as `upsertCampaignPassage` / `createPassage`.
- On successful graph write, mark seed `metabolized` and store passage ids.
- Optional: integrate **cert-style** “verify metabolize” checklist quest (later).

### Phase 4 — Agents (optional)

- Script or MCP-backed **draft suggestion** attached to seed; steward copies or applies via metabolize flow.

## File impacts (expected)

| Area | Files (illustrative) |
|------|----------------------|
| Schema | `prisma/schema.prisma` |
| Actions | `src/actions/campaign-branch-seed.ts` (new) |
| Campaign UI | `src/app/campaign/components/CampaignReader.tsx`, new small components under `campaign/components/` |
| Steward UI | `src/app/admin/...` or campaign hub route (align with COC campaign author) |
| Validation | Reuse `src/lib/story-graph/adventurePassagesGraph.ts`, `src/actions/campaign-passage.ts` |

## Verification

- `npm run check`, `npm run build` after each phase.
- Manual: plant → water as player → water as steward → metabolize → `CampaignReader` navigates new edge; `npm run test:story-graph` still passes.
