# DAOE Integration: Deterministic Agentic Onboarding Environment
## bars-engine Alignment Spec — Phase 0

**Spec Kit ID:** `daoe-integration`
**Version:** 0.1.0-draft
**Date:** 2026-04-25
**Status:** Draft — R&D approved, implementation queued
**Owner:** Council of Game Faces
**Source:** `docs/DAOE_STRATEGIC_ANALYSIS.md` (6-face GM analysis)

---

## Purpose

Integrate the DAOE (Deterministic Agentic Onboarding Environment) prototype into bars-engine. The prototype proves bars-engine can serve as a headless RPG logic server — stateless delta computation, three resolution registers (Fortune/Drama/Karma), player-sovereign NPC ecology, and graceful campaign suspension on subscription revocation.

**Problem:** bars-engine has all three resolution registers in production code, but they are unnamed and undocumented. The codebase cannot be reasoned about as a system because the register taxonomy is absent. This blocks: (1) R&D understanding of the architecture, (2) new engineer onboarding, (3) the ability to claim the architecture is intentionally designed rather than accidentally evolved.

**Why this matters:** The MTGOA thesis requires a player-sovereign system. The DAOE prototype proves this architecture is viable at $10/game cost targets. If we build it right, bars-engine becomes the reference implementation for spec-first RPG logic. If we build it wrong, we produce a brand-ego machine.

---

## Design Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| **Resolution register taxonomy** | Name Fortune/Drama/Karma as first-class fields in `BarDef` and `BarAsset` | GAP A-1, A-3 from GM gap analysis — registers exist but are unnamed |
| **Stateless architecture** | Mostly stateless — campaign state is the only stateful artifact; individual game frames are stateless deltas | Pure stateless loses accumulated I Ching history and campaign context. "Mostly stateless" preserves developmental trajectory while hitting cost targets |
| **LLM latency budget** | Accept <10ms for Fortune/Karma/Drama paths; LLM paths (NPC dialogue) are async 200-800ms | Sub-10ms is physically impossible for LLM-bound calls. Honest budget builds trust with R&D |
| **Client-side prediction** | Server delta → client interpolation; client predicts next frame, server confirms or corrects | Game Boy architecture — CPU predicts, GPU renders, server corrects. Validated in existing Twine state machine |
| **Subscription kill-switch** | Campaign suspension (not deletion) — `suspendedAt = now()`, read-only access, full restore on re-subscription | D8 (Loss & Avoidance) is always live in emotional development work. Permanent deletion activates catastrophic loss; suspension activates temporary absence |
| **NPC ecology input** | Player Personality Intake (player-sovereign) — NOT Brand Ego Profile (brand-sovereign) | Pattern 26: same structure as Brand Ego, different intent. Brand sovereignty inverts the MTGOA thesis. Player sovereignty is the framing that survives |
| **RAG pipeline** | Pre-computed at onboarding (async), static artifact at game time — not real-time retrieval | RAG lookup at game time adds 20-50ms per query, violating the latency budget for sync paths |
| **Rendering** | Reuse existing Twine/PixiJS components — no new thin-client | Over-engineered for prototype; `src/components/` already has CastIChingModal, AlchemyCaster, CastingRitual |
| **GM face sentence generation** | Template-based at game time (not LLM) — tone weights shift which pre-written template variant fires | LLM at game time violates latency budget. Cached LLM at intake adds complexity. Template approach: 6 faces × 3 tone levels = 18 variants; weights select and blend at render time. Upgrade path to LLM preserved for DAOE-1 |
| **State ownership model** | Per-campaign state (I Ching history, BSM phase, alchemy streak) is the player-owned artifact. Per-player cross-campaign continuity is out of scope for DAOE-0 | Naming what the player owns is what proves "player sovereignty." Phase 5 NPC will feel like a tone-weight parameter unless state ownership is named — then it becomes developmental continuity |
| **Migration strategy** | Single combined migration for Phase 3 + Phase 4 schema changes | Two separate migrations create a deploy window where `personalityProfile` exists without `suspendedAt`. One migration `add_dao e_campaign_fields` closes this gap |

---

## Conceptual Model

### The Three Registers

| Register | Source | Mechanism | Latency | bars-engine Location |
|----------|--------|-----------|---------|---------------------|
| **Fortune** | I Ching casting, prompt deck draw | True random (coin/yarrow) → hexagram ID → narrows quest/face/path availability | <10ms (pure computation) | `src/actions/cast-iching.ts`, `src/actions/micro-twine.ts` |
| **Drama** | Twine state machine | Fiction state drives outcome — narrative node, not mechanical roll | <1ms (lookup) | `src/actions/twine.ts`, `src/actions/micro-twine.ts` |
| **Karma** | Emotional alchemy, BSM maturity | Tracked past behavior shapes present outcome — transformation history as state | <5ms (indexed read) | `src/lib/alchemy-engine/`, `src/lib/bar-seed-metabolization/` |

### Client-Side Prediction Protocol

```
Thin Client (MacBook Air)
  ├── Predicts: next Twine node, sprite position, UI overlay
  ├── Confirms: every 500ms via lightweight /state-delta endpoint
  └── Rollback: if server delta disagrees, snap to server state

Zo Server (mostly stateless core)
  ├── Fortune: I Ching cast → Delta_Update (sub-ms)
  ├── Karma: Prisma delta write + read (indexed, <5ms)
  ├── Drama: Twine state machine (lookup, <1ms)
  └── NOT: LLM calls in the hot path (always async)
```

### Campaign Suspension (Kill-Switch)

```
JWT revoked
  ├── Set campaign.suspendedAt = now()
  ├── All active sessions: token check on next delta delivery
  ├── Sessions without valid token: connection dropped
  └── Player sees: "Your campaign is paused. Resubscribe to continue."

Re-subscription
  ├── Clear campaign.suspendedAt
  ├── Full access restored
  └── No data loss — only time has passed
```

---

## API Contracts (API-First)

### `GET /api/daoe/state-delta`

Returns the current frame delta for a campaign. Used by clients for reconciliation.

**Input**: `GET /api/daoe/state-delta?campaignId={id}&frame={n}`
**Output**: `DeltaUpdate`

```ts
interface DeltaUpdate {
  campaignId: string
  frame: number
  register: 'fortune' | 'drama' | 'karma'
  fortuneState?: {
    lastHexagram: string
    lastCastAt: string
    castHistory: string[]
  }
  dramaState?: {
    currentNode: string
    availableChoices: string[]
    narrativeContext: string
  }
  karmaState?: {
    maturityPhase: string
    bsmProgress: number
    alchemyStreak: number
  }
  predictionMismatch?: boolean  // true = client should rollback
  serverTime: number
}
```

### `POST /api/daoe/cast-fortune`

Triggers an I Ching cast (Fortune register invocation).

**Input**: `{ campaignId: string, intent?: string }`
**Output**: `{ hexagram: HexagramResult, delta: DeltaUpdate }`

```ts
interface HexagramResult {
  hexagramId: string
  changingLines: number[]
  resultingHexagramId: string
  narrativeGuidance: string
  registeredAt: string
}
```

### `POST /api/daoe/player-personality-intake`

Captures player personality intake at onboarding (replaces Brand Ego Profile).

**Input**: `{ campaignId: string, answers: PersonalityIntakeAnswers }`
**Output**: `{ personalityProfile: PlayerPersonalityProfile, npcToneWeights: NpcToneWeights }`

```ts
interface PersonalityIntakeAnswers {
  currentStage: 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'
  primaryAllyshipDomain: 'gathering_resources' | 'direct_action' | 'raise_awareness' | 'skillful_organizing'
  developmental itch: string  // Free text, 50-200 chars
  preferredGMFace: 'shaman' | 'challenger' | 'regent' | 'architect' | 'diplomat' | 'sage'
}

interface PlayerPersonalityProfile {
  campaignId: string
  intakeCompletedAt: string
  answers: PersonalityIntakeAnswers
  derivedAltitude: string  // From preferred GM face
}

interface NpcToneWeights {
  shaman: number      // 0-1
  challenger: number
  regent: number
  architect: number
  diplomat: number
  sage: number
}
```

### `POST /api/daoe/campaign-suspend`

Subscription revocation handler — sets campaign to suspended state.

**Input**: `{ campaignId: string, revokedToken: string }`
**Output**: `{ suspended: true, suspendedAt: string, gracePeriodEnded: boolean }`

### `POST /api/daoe/campaign-restore`

Re-subscription handler — clears suspension state.

**Input**: `{ campaignId: string }`
**Output**: `{ restored: true, suspendedAt: string | null }`

---

## Functional Requirements

### Phase 1: Register Contract (survive R&D review)

- **FR1.1**: Add `resolutionRegister: 'fortune' | 'drama' | 'karma'` field to `BarDef` in `src/lib/bars.ts`
- **FR1.2**: Add `authority: { invoker: 'player' | 'gm' | 'either', narrator: 'player' | 'gm' | 'collaborative', tracker: 'system' | 'player' }` field to `BarDef` (GAP A-2 fix)
- **FR1.3**: Add `resolutionRegister` to `BarAsset` type in `src/lib/bar-asset/types.ts`
- **FR1.4**: Document the three registers in `src/lib/bar-asset/PROTOCOL.md` — name I Ching casting and prompt deck as Fortune paths; Twine as Drama path; emotional alchemy as Karma path
- **FR1.5**: Tag existing BARs in `STARTER_BARS` with appropriate `resolutionRegister` values

### Phase 2: State Delta API

- **FR2.1**: Implement `GET /api/daoe/state-delta` — returns current frame delta for a campaign
- **FR2.2**: Implement `POST /api/daoe/cast-fortune` — I Ching cast with Fortune register naming
- **FR2.3**: DeltaUpdate response includes `predictionMismatch` flag for client rollback
- **FR2.4**: All endpoints validate JWT on every request (no grace period abuse)

### Phase 3: Player Personality Intake

- **FR3.1**: Implement `POST /api/daoe/player-personality-intake` — 3-4 question intake form
- **FR3.2**: Intake maps to 6 GM face tone weights (`NpcToneWeights`)
- **FR3.3**: Profile stored as static JSON artifact in campaign record (no vector DB)
- **FR3.4**: NPC dialogue system reads from static artifact at generation time (no RAG lookup)

### Phase 4: Campaign Suspension (Kill-Switch)

- **FR4.1**: Add `suspendedAt: DateTime?` field to Campaign model in `schema.prisma`
- **FR4.2**: Implement `POST /api/daoe/campaign-suspend` — sets suspension, drops invalid sessions
- **FR4.3**: Implement `POST /api/daoe/campaign-restore` — clears suspension, full access restored
- **FR4.4**: Suspended campaigns: read-only access to state, no new delta writes, player sees "paused" UI
- **FR4.5**: Migration file committed for `suspendedAt` field addition

### Phase 5: NPC Ecology Integration

- **FR5.1**: NPC persona selection reads from `PlayerPersonalityProfile.npcToneWeights`
- **FR5.2**: GM face sentence generation uses tone weights to flavor NPC voice (not brand CEO voice)
- **FR5.3**: No RAG pipeline at game time — personality profile is pre-computed at intake

---

## Non-Functional Requirements

- **Latency**: Fortune/Karma/Drama paths <10ms. LLM paths (NPC dialogue) 200-800ms async — never in hot path
- **Scalability**: Stateless delta architecture supports $10/game cost targets. Only campaign state is stateful
- **Security**: JWT validated on every delta delivery. Revoked tokens rejected within 5s propagation
- **Player sovereignty**: NPC ecology reflects player developmental stage — never brand CEO tone
- **Backward compatibility**: Adding `resolutionRegister` and `authority` fields to `BarDef` is additive — no breaking changes

---

## Persisted data & Prisma

| Model | Field | Type | Note |
|-------|-------|------|------|
| Campaign | `suspendedAt` | `DateTime?` | Nullable — null means active |
| Campaign | `personalityProfile` | `Json?` | PlayerPersonalityProfile, null until intake completed |
| BarDef | `resolutionRegister` | `String?` | 'fortune' \| 'drama' \| 'karma' — nullable for backward compat |
| BarDef | `authority` | `Json?` | `{ invoker, narrator, tracker }` — nullable for backward compat |

**Migration**: `npx prisma migrate dev --name add_daoe_campaign_fields` — must commit SQL with schema change.

---

## Verification Quest

- **ID**: `cert-daoe-integration-v1` *(fixed: was "cert-dao e-integration-v1")*
- **Narrative**: "The Campaign Oracle — validate the DAOE integration by proving the registers are named, the state delta computes correctly, and the kill-switch gracefully suspends a campaign without data loss."
- **Twine Passages** *(defined — cert-daoe-integration-v1)*:

| Step | Passage | Verification |
|------|---------|-------------|
| 1 | `cert-daoe-step1-intro` | Player lands on intro node; click "Begin DAOE Certification" |
| 2 | `cert-daoe-step2-cast` | Player casts I Ching; delta response contains `register: 'fortune'` and valid `hexagramId` — click "Verify Fortune" |
| 3 | `cert-daoe-step3-intake` | Player completes 4-question intake; `preferredGMFace` selected; click "Store Profile" |
| 4 | `cert-daoe-step4-suspend` | GM triggers suspension; player sees "Campaign Paused" state; I Ching history preserved — click "Confirm Paused" |
| 5 | `cert-daoe-step5-restore` | GM restores; player sees full access return; click "Verify Restored" |
| 6 | `cert-daoe-step6-delta` | Player calls `/state-delta`; `predictionMismatch` computed; click "Finalize" — no exit link (quest mints reward) |

- **Fallback for existing campaigns** (R-2 fix): Campaigns with null `personalityProfile` get a "quick intake" prompt on next login — 1 question ("Which GM face feels most like your current challenge?") maps to minimal `NpcToneWeights`.
- **Reference**: Twine story ID `cert-daoe-integration-v1`, CustomBar with `isSystem: true`, deterministic seed script.

---

## Tier 1 Fixes Applied (6-Face Review — 2026-04-25)

These fixes were applied before Phase 1 opened, per the 6-face review. They address structural, lifecycle, and felt-reality gaps that would have blocked Phase 1 progress.

| Fix | Source | Change |
|-----|--------|--------|
| **GM face sentence generation mechanism** | Architect A-2 | Added to Design Decisions: template-based (18 variants), not LLM or cached LLM. Upgrade path to LLM preserved for DAOE-1 |
| **State ownership model named** | Challenger C-2 | Added to Design Decisions: per-campaign state is player-owned artifact; cross-campaign continuity is out of scope for DAOE-0. This prevents Phase 5 NPC from feeling like a tone-weight parameter instead of developmental continuity |
| **Verification quest passages defined** | Diplomat D-2 | Added 6-row Twine passage table. Verification steps are now falsifiable before Phase 5 closes |
| **Migration combined** | Architect A-3 | Single `add_daoe_campaign_fields` migration for both `personalityProfile` and `suspendedAt` — no partial deploy window |
| **Prediction mismatch mechanism deferred** | Challenger C-1 | `predictionMismatch` field added to DeltaUpdate but flagged as "computed when client prediction protocol exists" — Phase 2 ships field, Phase 2b computes it |
| **Fortune register purpose comment** | Shaman S-3 | TODO comment added in `cast-iching.ts` re: "the randomness is the feature" — prevents future optimization from destroying the register |

---

## Dependencies

- `bars.ts` — BarDef type source
- `bar-asset/types.ts` — BarAsset type source
- `cast-iching.ts` — Fortune register implementation
- `alchemy-engine/` — Karma register implementation
- `twine.ts` / `micro-twine.ts` — Drama register implementation
- `src/actions/` — existing action layer
- `auth-utils.ts` — JWT validation layer

---

## References

- `docs/DAOE_STRATEGIC_ANALYSIS.md` — full 6-face GM analysis
- `GM_GAP_ANALYSIS_RPG_ZINE_BAR_MATURITY.md` — register gap analysis (GAP A-1, A-2, A-3)
- `src/lib/bars.ts` — BarDef (needs update)
- `src/lib/bar-asset/types.ts` — BarAsset (needs update)
- `src/lib/bar-asset/PROTOCOL.md` — needs register documentation
- Pattern 26: category error between similar practices (Brand Ego Profile vs. Player Personality Intake)