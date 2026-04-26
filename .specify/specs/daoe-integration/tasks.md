# DAOE Integration: Tasks

**Spec:** `.specify/specs/daoe-integration/spec.md`
**Plan:** `.specify/specs/daoe-integration/plan.md`

---

## Phase 1: Register Contract

### Task 1.1: Add resolutionRegister + authority to BarDef

**File:** `src/lib/bars.ts`

**Changes:**
1. Add `resolutionRegister?: 'fortune' | 'drama' | 'karma'` to `BarDef` interface
2. Add `authority?: { invoker: 'player' | 'gm' | 'either', narrator: 'player' | 'gm' | 'collaborative', tracker: 'system' | 'player' }` to `BarDef` interface
3. Tag `STARTER_BARS` entries with appropriate `resolutionRegister` values:
   - `bar_blessed_object` → `drama` (Twine path)
   - `bar_attunement` → `karma` (alchemy)
   - `bar_intention` → `karma`
   - `bar_commission` → `fortune` (I Ching path)

**Verification:** `npm run check` — no TypeScript errors

```bash
npx tsc --noEmit
```

---

### Task 1.2: Add resolutionRegister to BarAsset

**File:** `src/lib/bar-asset/types.ts`

**Changes:**
1. Add `resolutionRegister?: 'fortune' | 'drama' | 'karma'` to `BarAsset` interface
2. Add `resolutionRegister` to `BarAssetMetadata`

**Verification:** `npm run check`

---

### Task 1.3: Document registers in PROTOCOL.md

**File:** `src/lib/bar-asset/PROTOCOL.md`

**Changes:** Add section documenting the three registers:
- Fortune: I Ching casting (`cast-iching.ts`), prompt deck draw
- Drama: Twine state machine (`twine.ts`, `micro-twine.ts`)
- Karma: Emotional alchemy (`alchemy-engine/`), BSM maturity phases

**Verification:** File exists and covers all three registers with code references

---

## Phase 2: State Delta API

### Task 2.1: Create DAOE types file

**File:** `src/lib/daoe/types.ts`

**Create:** DeltaUpdate, HexagramResult, PersonalityIntakeAnswers, PlayerPersonalityProfile, NpcToneWeights interfaces (per spec.md API Contracts)

**Verification:** File compiles, types exportable

---

### Task 2.2: Create delta-service.ts

**File:** `src/lib/daoe/delta-service.ts`

**Create:** Delta computation logic — reads Fortune/Karma/Drama state from campaign, produces DeltaUpdate

**Verification:** Unit test — call with mock campaign, receive valid DeltaUpdate

---

### Task 2.3: Implement GET /api/daoe/state-delta

**File:** `src/app/api/daoe/state-delta/route.ts`

**Implement:**
- `GET /api/daoe/state-delta?campaignId={id}&frame={n}`
- JWT validation
- Campaign suspended check → return `{ suspended: true }` if suspended
- Return DeltaUpdate with current register states
- Include `predictionMismatch` if client frame is behind server frame

**Verification:** `npm run build` — route compiles

---

### Task 2.4: Implement POST /api/daoe/cast-fortune

**File:** `src/app/api/daoe/cast-fortune/route.ts`

**Implement:**
- `POST /api/daoe/cast-fortune` with `{ campaignId, intent? }`
- JWT validation
- Call `cast-iching.ts` (existing) to produce hexagram
- Return `{ hexagram: HexagramResult, delta: DeltaUpdate }`
- Record cast in fortuneState.castHistory

**Verification:** Cast produces valid hexagram + DeltaUpdate

---

## Phase 3: Player Personality Intake

### Task 3.1: Add personalityProfile to Campaign model

**File:** `prisma/schema.prisma`

**Changes:**
```prisma
model Campaign {
  // ... existing fields ...
  personalityProfile Json?
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_daoe_campaign_fields
```

**Verification:** Migration runs, `npm run db:sync` succeeds, no type errors

---

### Task 3.2: Create personality-mapper.ts

**File:** `src/lib/daoe/personality-mapper.ts`

**Create:** Maps `PersonalityIntakeAnswers` → `NpcToneWeights`
- `currentStage` → adjusts sage/architect weight
- `primaryAllyshipDomain` → adjusts challenger/regent weight
- `preferredGMFace` → boosts that face to 0.7+, others proportionally lower
- `developmental itch` → free text, stored but not mapped for MVP

**Verification:** Unit test — known inputs produce expected weight distribution

---

### Task 3.3: Implement POST /api/daoe/player-personality-intake

**File:** `src/app/api/daoe/player-personality-intake/route.ts`

**Implement:**
- `POST /api/daoe/player-personality-intake` with `{ campaignId, answers }`
- JWT validation
- Validate answers shape
- Call `personality-mapper.ts` → produce `PlayerPersonalityProfile`
- Store in `Campaign.personalityProfile`
- Return `{ personalityProfile, npcToneWeights }`

**Verification:** Complete intake flow, read back stored profile matches submitted answers

---

## Phase 4: Campaign Suspension (Kill-Switch)

### Task 4.1: Add suspendedAt to Campaign model

**File:** `prisma/schema.prisma`

**Changes:**
```prisma
model Campaign {
  // ... existing fields ...
  suspendedAt DateTime?
}
```

**Migration:** Same migration as Task 3.1 — combine into `add_daoe_campaign_fields`

**Verification:** Migration runs, `npm run db:sync` succeeds

---

### Task 4.2: Create campaign-suspension.ts

**File:** `src/lib/daoe/campaign-suspension.ts`

**Create:**
- `suspendCampaign(campaignId): Promise<void>` — set `suspendedAt = now()`
- `restoreCampaign(campaignId): Promise<void>` — clear `suspendedAt`
- `isCampaignSuspended(campaignId): Promise<boolean>`

**Verification:** Unit test — suspend → suspendedAt set, restore → cleared

---

### Task 4.3: Implement POST /api/daoe/campaign-suspend

**File:** `src/app/api/daoe/campaign-suspend/route.ts`

**Implement:**
- `POST /api/daoe/campaign-suspend` with `{ campaignId, revokedToken }`
- Validate token is actually revoked (check against auth layer)
- Call `suspendCampaign(campaignId)`
- Return `{ suspended: true, suspendedAt, gracePeriodEnded }`

**Verification:** Call with valid revoked token → campaign suspended

---

### Task 4.4: Implement POST /api/daoe/campaign-restore

**File:** `src/app/api/daoe/campaign-restore/route.ts`

**Implement:**
- `POST /api/daoe/campaign-restore` with `{ campaignId }`
- Call `restoreCampaign(campaignId)`
- Return `{ restored: true, suspendedAt: null }`

**Verification:** Restore clears suspendedAt, full access returns

---

### Task 4.5: Add suspended check to all DAOE routes

**Files:**
- `src/app/api/daoe/state-delta/route.ts`
- `src/app/api/daoe/cast-fortune/route.ts`
- `src/app/api/daoe/player-personality-intake/route.ts`

**Changes:** Each route checks `isCampaignSuspended(campaignId)` before processing. If suspended, return appropriate error (state-delta returns `{ suspended: true }`, others return 403).

**Verification:** Suspended campaign: all writes rejected, reads return suspended state

---

### Task 4.6: Commit migration

**Action:** `git add prisma/migrations/ && git commit -m "feat(DAOE): add suspendedAt + personalityProfile to Campaign model"`

**Verification:** Migration SQL committed, `npm run build` passes

---

## Phase 5: NPC Ecology Integration

### Task 5.1: Create personality-weigher.ts

**File:** `src/lib/daoe/personality-weigher.ts`

**Create:**
- `getNpcToneWeights(campaignId): Promise<NpcToneWeights>` — reads from campaign.personalityProfile
- `applyToneWeights(baseText: string, weights: NpcToneWeights): string` — flavors text based on weights (MVP: adjective insertion)

**Verification:** Unit test — known weights produce expected flavor change

---

### Task 5.2: Integrate tone weights into GM face sentence generation

**File:** `src/lib/gm-face-sentences.ts` (or existing NPC dialogue file)

**Changes:** Add `toneWeights?: NpcToneWeights` parameter to sentence generation functions. Flavor output based on weights.

**Verification:** NPC dialogue with tone weights reflects player's preferred GM face

---

## Verification Quest: cert-dao e-integration-v1

**Twine story:** `cert-dao e-integration-v1` — system CustomBar, `isSystem: true`

**Steps:**
1. Start campaign → complete player personality intake
2. Cast I Ching → verify Fortune register recorded in state-delta
3. Trigger campaign suspension → verify "paused" state and preserved data
4. Restore subscription → verify full access returns, no data loss
5. Call state-delta → verify `predictionMismatch` flag computes

**Seed script:** `scripts/seed-cert-dao e-integration-v1.ts` — idempotent, deterministic ID `cert-dao e-integration-v1`

---

## Pre-flight Checklist

- [x] Phase 1 complete — TSC clean, build clean
- [ ] Phase 2 (state-delta API) — in progress
  - [x] `src/lib/daoe/types.ts` — all shared interfaces defined
  - [x] `src/lib/daoe/delta-service.ts` — computeDelta + isSuspended
  - [x] `src/app/api/daoe/state-delta/route.ts` — GET handler
  - [x] `src/app/api/daoe/cast-fortune/route.ts` — POST handler (Fortune register)
  - [x] `src/lib/daoe/personality-mapper.ts` — Phase 3 prep
  - [x] TSC clean → `npm run build` clean
  - [ ] Write migration for Phase 4 (suspendedAt + personalityProfile)
  - [ ] Phase 3 complete
  - [ ] Phase 4 complete
  - [ ] Phase 5 complete
  - [ ] Verification quest: `cert-dao e-integration-v1`
  - [ ] `npm run check` passes before any phase
  - [ ] Each phase: `npm run build` + `npm run check` before declaring done
  - [ ] Migration SQL committed before Phase 4 closes
  - [ ] Verification quest implemented before declaring prototype complete