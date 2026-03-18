# Individuation Engine — Implementation Plan

**Ambiguity**: 0.16
**Phase 1 target**: Wire existing infrastructure, no migrations

---

## Phase 1 — Wire Existing Infrastructure (no migrations)

### 1.1 Create `/src/lib/quest-seed-composer.ts`

New file. Exports `buildQuestSeedInput(playerId: string, barId: string): Promise<QuestSeedContext>`.

```ts
interface QuestSeedContext {
  archetypeProfile: ArchetypeInfluenceProfile | null
  daemonChannel: string | null
  daemonAltitude: string | null
  kotterStage: number           // Phase 1 proxy for NationFaceEra
  activeFaceKey: string | null  // null until Phase 3
  sceneType: SceneType          // from wuxing resolution
  chargeBarId: string
}
```

Reads:
- Player archetype via `db.player.findUnique({ select: { archetypeId: true } })` → `getArchetypeInfluenceProfile(archetypeId)`
- Active Daemon channel/altitude (extend `getActiveDaemonMoves` or new `getActiveDaemonState`)
- Kotter stage from active `GameboardInstance` (use existing `getActiveInstance()`)
- `sceneType` from `barId` inputs JSON

Guard: all reads wrapped in try/catch; null values returned on error, never throw.

### 1.2 Wire `applyArchetypeOverlay()` into quest generation

Edit: `/src/actions/charge-capture.ts` → `generateQuestSuggestionsFromCharge()`

After resolving bar inputs, call `buildQuestSeedInput()`. If `context.archetypeProfile` is non-null, pass it to `applyArchetypeOverlay()` before generating quest suggestions. Overlay failure must not block quest generation — catch and log.

Edit: `/src/actions/quest-generation.ts` → `compileQuestWithAI()` or `generateQuestFromBar()`

Same pattern: compose context, apply overlay before AI compilation.

### 1.3 Wire Daemon state into `selectScene()`

Edit: `/src/lib/alchemy/select-scene.ts`

Add to `SelectSceneOpts`:
```ts
daemonChannel?: string
daemonAltitude?: string
```

Add to `scoreCandidate()`:
```ts
if (opts.daemonChannel && template.archetypeBias?.includes(opts.daemonChannel)) score += 3
```

Edit: `/src/actions/alchemy.ts` → wherever `selectScene()` is called

Fetch active Daemon's channel/altitude and pass to `selectScene()`.

### 1.4 New daemon state reader

Edit: `/src/actions/daemons.ts`

Add `getActiveDaemonState(playerId: string): Promise<{ channel: string | null, altitude: string | null } | null>`.

Reads the most recently summoned active Daemon for the player.

---

## Phase 2 — Schema Migrations + Daemon Codex

### Migrations

**`add_individuation_engine_daemon_codex`**
Add to `model Daemon`:
- `voice String?`
- `desire String?`
- `fear String?`
- `shadow String?`
- `evolutionLog String @default("[]")` — JSON array

**`add_individuation_engine_scene_biases`**
Add to `model AlchemySceneTemplate`:
- `kotterStageBias String?` — JSON: `"[1,2,3]"`
- `campaignFrontBias String?` — JSON: `'["challenger","regent"]'`

**`add_individuation_engine_charge_archetype`**
Add to `model CustomBar`:
- `archetypeKey String?`

### Actions

**Edit `/src/actions/daemons.ts`:**
- `updateDaemonCodex(daemonId, codex: { voice?, desire?, fear?, shadow? })` — player-scoped write
- `appendDaemonEvolution(daemonId, entry: EvolutionEntry)` — internal, called from:
  - Quest completion in `/src/actions/quest-completion.ts`
  - BlessedObject unlock in `/src/lib/blessed-objects.ts` (pass `daemonId` in metadata)

**Edit `/src/lib/blessed-objects.ts` → `unlockBlessedObject()`:**
- Accept optional `daemonId` and include in `metadata.daemonId`

**Edit `/src/lib/alchemy/select-scene.ts` → `scoreCandidate()`:**
- Score `kotterStageBias` (JSON parse, check if `kotterStage` is in array, score += 5)
- Score `campaignFrontBias` (check if `activeFaceKey` is in array, score += 5)

### UI

**Create `/src/app/daemons/[id]/codex/page.tsx`:**
Server component + form. Backed by `updateDaemonCodex()`. Shows voice, desire, fear, shadow fields. Shows `evolutionLog` as read-only timeline.

**Create `/src/components/charge-capture/TransitionCeremony.tsx`:**
Full-screen overlay. Shows `sceneType` in large text, Kotter stage below. `onClick` or `onTransitionEnd` advances. Duration: `const TRANSITION_CEREMONY_MS = 2500`.

**Edit `/src/components/charge-capture/ChargeCaptureForm.tsx` (or equivalent):**
After BAR creation, before showing quest suggestions: render `<TransitionCeremony />`. On ceremony complete: proceed to suggestions phase.

### Stamp `archetypeKey` on charge capture

**Edit `/src/actions/charge-capture.ts` → `createChargeBar()` or equivalent:**
After reading player, add `archetypeKey: player.archetypeId ?? null` to the `CustomBar` create data.

---

## Phase 3 — NationFaceEra + Full Ecology

### Migration

**`add_nation_face_era`**
New model:
```prisma
model NationFaceEra {
  id                 String    @id @default(cuid())
  instanceId         String
  faceKey            String    // shaman|challenger|regent|architect|diplomat|sage
  startedAt          DateTime  @default(now())
  endedAt            DateTime?
  kotterStageAtStart Int
  transitionTrigger  Json?
  eraDescription     String?

  instance Instance @relation(fields: [instanceId], references: [id], onDelete: Cascade)

  @@index([instanceId, endedAt])
  @@map("nation_face_eras")
}
```

### New file: `/src/actions/nation-face-era.ts`

- `getActiveFaceEra(instanceId): Promise<NationFaceEra | null>`
- `openFaceEra(instanceId, faceKey, trigger): Promise<NationFaceEra>` — closes previous first
- `closeFaceEra(eraId, trigger): Promise<void>`

### Wire into composer

**Edit `/src/lib/quest-seed-composer.ts`:**
Replace `kotterStage` proxy with real `NationFaceEra` lookup. `activeFaceKey` is now live.

### Admin UI

**Create `/src/app/admin/instances/[id]/face-era/page.tsx`:**
GM declares new era: select `faceKey`, write `eraDescription`, trigger. Calls `openFaceEra()`.

### Collective Daemon scoring

**Edit `/src/lib/alchemy/select-scene.ts`:**
Add `collectiveDaemonState?: { channel: string }` to `SelectSceneOpts`. Score union channel at weight 4 in `scoreCandidate()`.

**Edit call site in `/src/actions/alchemy.ts`:**
Query collective Daemons scoped to active instance (`collective: true, communityScope: instanceId`). Union channels. Pass to `selectScene()`.

---

## Acceptance Criteria

### Phase 1
- `buildQuestSeedInput()` returns a populated `QuestSeedContext` for a player with archetype + active Daemon
- `applyArchetypeOverlay()` is called inside `generateQuestSuggestionsFromCharge()` when archetype is non-null
- `selectScene()` accepts and scores `daemonChannel`/`daemonAltitude` when provided
- `npm run build` passes; `npm run check` passes

### Phase 2
- Daemon codex fields writable via `updateDaemonCodex()` action
- `evolutionLog` appended on quest completion and 321/EFA unlock
- `AlchemySceneTemplate` scoring includes `kotterStageBias` and `campaignFrontBias`
- `archetypeKey` stamped on new `CustomBar` records at charge capture time
- Transition ceremony renders before quest suggestions, is interruptible

### Phase 3
- `NationFaceEra` model live; `getActiveFaceEra()` returns current era
- `openFaceEra()` closes previous era before opening new one
- Admin UI for GM era declaration functional
- Collective Daemon channel scored in `selectScene()`
- `npm run build` passes; `npm run check` passes after each migration
