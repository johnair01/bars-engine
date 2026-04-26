# DAOE Integration: Plan

**Spec:** `.specify/specs/daoe-integration/spec.md`
**Phase:** Implement bars-engine DAOE prototype — Phase 0 through Phase 5

---

## Implementation Order

### Phase 1: Register Contract — `bars.ts` + `bar-asset/types.ts`

**What changes:**
- `src/lib/bars.ts`: Add `resolutionRegister` + `authority` fields to `BarDef`
- `src/lib/bar-asset/types.ts`: Add `resolutionRegister` to `BarAsset`
- `src/lib/bar-asset/PROTOCOL.md`: Document all three registers with locations

**File impact:**
```
src/lib/bars.ts
src/lib/bar-asset/types.ts
src/lib/bar-asset/PROTOCOL.md (new section)
```

**Verification:** `npm run check` passes — no regressions on BarDef/BarAsset consumers

---

### Phase 2: State Delta API — `/api/daoe/state-delta` + `/api/daoe/cast-fortune`

**What changes:**
- `src/app/api/daoe/state-delta/route.ts` — GET handler, returns DeltaUpdate
- `src/app/api/daoe/cast-fortune/route.ts` — POST handler, wraps `cast-iching.ts`
- `src/lib/daoe/delta-service.ts` — delta computation logic (shared between routes)
- `src/lib/daoe/types.ts` — DeltaUpdate, HexagramResult, NpcToneWeights interfaces

**File impact:**
```
src/app/api/daoe/state-delta/route.ts
src/app/api/daoe/cast-fortune/route.ts
src/lib/daoe/delta-service.ts
src/lib/daoe/types.ts
```

**Verification:** `npm run build` — route compiles, TypeScript resolves all imports

---

### Phase 3: Player Personality Intake — `/api/daoe/player-personality-intake`

**What changes:**
- `src/app/api/daoe/player-personality-intake/route.ts` — POST handler
- `src/lib/daoe/personality-mapper.ts` — maps intake answers to NPC tone weights
- Campaign model: `personalityProfile` field populated from intake

**File impact:**
```
src/app/api/daoe/player-personality-intake/route.ts
src/lib/daoe/personality-mapper.ts
prisma/schema.prisma (add personalityProfile Json field)
prisma/migrations/xxxx_add_daoe_campaign_fields/migration.sql
```

**Verification:** Full intake flow completes and stores valid `NpcToneWeights` in DB

---

### Phase 4: Campaign Suspension (Kill-Switch) — `/api/daoe/campaign-suspend` + `/api/daoe/campaign-restore`

**What changes:**
- `schema.prisma`: Add `suspendedAt DateTime?` to Campaign model
- `src/app/api/daoe/campaign-suspend/route.ts` — JWT revocation handler
- `src/app/api/daoe/campaign-restore/route.ts` — re-subscription handler
- `src/lib/daoe/campaign-suspension.ts` — suspension logic (set state, drop sessions)
- All DAOE routes: add JWT validation + suspended campaign check

**File impact:**
```
prisma/schema.prisma
src/app/api/daoe/campaign-suspend/route.ts
src/app/api/daoe/campaign-restore/route.ts
src/lib/daoe/campaign-suspension.ts
src/app/api/daoe/state-delta/route.ts (add suspended check)
src/app/api/daoe/cast-fortune/route.ts (add suspended check)
src/app/api/daoe/player-personality-intake/route.ts (add suspended check)
```

**Verification:**
1. Suspended campaign: state-delta returns `{ suspended: true }` — no new delta writes
2. Restore: `suspendedAt` cleared, full access returns
3. `npm run db:sync` — Prisma client regenerated, no type errors

**Migration:** Must commit `prisma/migrations/xxxx_add_daoe_campaign_fields/migration.sql` with schema change.

---

### Phase 5: NPC Ecology Integration — read tone weights in dialogue generation

**What changes:**
- `src/lib/npc/personality-weigher.ts` — reads `PlayerPersonalityProfile.npcToneWeights`
- GM face sentence generation: flavor NPC voice from tone weights (not brand CEO)
- No RAG pipeline at game time — personality profile is static artifact

**File impact:**
```
src/lib/daoe/personality-weigher.ts
src/lib/gm-face-sentences.ts (add tone weight parameter)
```

**Verification:** NPC dialogue reflects player's preferred GM face in tone/style

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Delta format** | JSON with `register` discriminated union | Client-side prediction needs typed, predictable shape |
| **Suspension granularity** | Campaign-level, not session-level | Simpler implementation; player returns to same state |
| **Personality storage** | Static JSON in Campaign record, not vector DB | MVP doesn't need RAG complexity; upgrade path preserved |
| **NPC tone weighting** | 6 floats (0-1), one per GM face | Simple weighted sum for dialogue flavoring |
| **Register tagging** | Nullable on existing BarDefs | Backward compatible; new BARs must declare register |

---

## Dependency Graph

```
Phase 1 (types) ← Phase 2 (API) ← Phase 3 (intake) ← Phase 4 (suspension)
                                              ↓
                              Phase 5 (NPC integration, depends on Phase 3 output)
```

Phase 5 must follow Phase 3 — NPC tone weights are populated by Phase 3.

---

## Out of Scope (DAOE-1)

- Redis-backed JWT revocation list (5s propagation is acceptable for MVP)
- Real-time RAG pipeline at game time (pre-computed artifacts only)
- White-label Brand Ego Sync for B2B deployments
- Thin-client renderer (reuse existing PixiJS components)