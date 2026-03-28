# Spec: Threshold Encounter

## Purpose

Build the Threshold Encounter `.twee` template system — a unified emotional alchemy scene generator that absorbs `SceneDsl` as its minimum viable form, is AI-generated with GM editing capability, and emits structured artifacts (BAR candidates, quest hooks, alchemy state updates) via a post-adventure overlay. Threshold Encounter becomes the canonical `.twee` output format for both check-in-triggered scenes and GM-authored encounters.

**Problem**: The system can generate emotional alchemy scenes (`SceneDsl`) but has no canonical `.twee` template format that ties together the emotional vector, wuxing routing, encounter phases, and artifact emission. Two template types (QuestPacket / Epiphany Bridge and Orb-style encounter) need a unified self-describing format so the game can emit `.twee` and ingest the right data regardless of which template produced the file.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Template unification | `SceneDsl` (situation/friction/invitation) maps directly to Context/Anomaly/Choice phases — same format, different beat counts |
| Phase structure | Fixed 5 phases: Context / Anomaly / Choice / Response / Artifact; beats per phase are flexible |
| BAR write-in | Post-adventure overlay in Next.js layer, NOT inside `.twee` macros — keeps Twine substrate clean |
| AI generation | AI drafts `.twee`; GM edits via existing `IRAuthoringClient` pattern (no new editing surface) |
| StoryData | `.twee` is self-describing via embedded `StoryData` JSON block — carries routing, artifacts, template type |
| Trigger | `DailyCheckInQuest` is the canonical player trigger — replaces legacy growth scene for check-in |
| SceneDsl compat | Existing growth scene runner unchanged; `SceneDsl` maps to 1-beat-per-phase minimum form |
| Beat modes | `minimal` (1 beat/phase = SceneDsl shape) vs `canonical` (3+3+1+1+1 = 9 passages) |

## Conceptual Model

| Dimension | Value |
|-----------|-------|
| **WHO** | Player (completes encounter); GM (edits/exports); Admin (reviews BAR candidates) |
| **WHAT** | `.twee` file with 5 phases → post-adventure overlay → BAR candidate / quest hook artifacts |
| **WHERE** | DailyCheckIn wizard → encounter player → `ThresholdEncounter` route |
| **Energy** | Emotional charge enters the system; encounter transforms it; artifact emits from the resolution |
| **Personal throughput** | Clean Up — encounters metabolize emotional friction into actionable artifacts |

## API Contracts (API-First)

### `POST /api/threshold-encounter/generate`

**Route Handler** (external AI call + heavy generation)

**Input**:
```ts
type GenerateThresholdEncounterInput = {
  emotionalVector: string        // "fear:dissatisfied→anger:neutral"
  hexagramId: number             // 1–64
  gmFace: string                 // shaman | challenger | regent | architect | diplomat | sage
  nationSlug: string             // argyra | pyrakanth | virelune | meridia | lamenth
  archetypeSlug: string          // e.g. "bold-heart"
  barCandidateSeeds?: string[]   // optional admin-flagged hints
  beatMode: 'minimal' | 'canonical'
}
```

**Output**:
```ts
type GenerateThresholdEncounterOutput = {
  encounterId: string
  tweeSource: string
  storydata: ThresholdStoryData
}

type ThresholdStoryData = {
  templateType: 'threshold_encounter' | 'quest_packet'
  emotionalVector: string
  wuxingRouting: {
    sceneType: 'transcend' | 'generate' | 'control'
    fromChannel: string
    toChannel: string
    altitudeFrom: string
    altitudeTo: string
  }
  phaseMap: { context: number; anomaly: number; choice: number; response: number; artifact: number }
  declaredArtifacts: DeclaredArtifact[]
}
```

### `GET /api/threshold-encounter/[id]/export`

**Route Handler** — returns `.twee` file download

### `saveBarCandidate` (Server Action)

**Input**: `{ encounterId: string; candidateText: string }`
**Output**: `{ artifactId: string }`

### `completeEncounter` (Server Action)

**Input**: `{ encounterId: string; checkInId?: string }`
**Output**: `{ artifacts: SceneArtifact[] }`

### `promoteBarCandidate` (Server Action, admin)

**Input**: `{ artifactId: string; targetType: 'bar' | 'quest_hook' }`
**Output**: `{ barId?: string; questHookId?: string }`

## User Stories

### P1: Player completes check-in and enters encounter

**As a player**, I want my daily check-in to launch a Threshold Encounter `.twee` scene keyed to my emotional state, so the game responds to how I actually feel.

**Acceptance**: `DailyCheckInQuest` → launches encounter at encounter player URL → adventure plays through 5 phases → post-adventure overlay appears.

### P1: Player writes in a BAR candidate

**As a player**, I want to name something that emerged for me during the encounter, so it can become a BAR I act on later.

**Acceptance**: Post-adventure overlay shows optional write-in field; saving stores `ArtifactType: bar_candidate` on `ThresholdEncounter.artifacts`; visible in admin queue.

### P2: GM promotes BAR candidate

**As a GM**, I want to review BAR candidates from encounters and promote them to live BARs or quest hooks, so player insights become in-game artifacts with proper governance.

**Acceptance**: Admin queue at `/admin/bar-candidates` lists pending candidates; promote action creates `CustomBar` or `QuestProposal`.

### P3: GM edits and exports `.twee`

**As a GM**, I want to edit the AI-generated encounter and export it as a `.twee` file, so I can use it in Twine or share it offline.

**Acceptance**: Edit surface via existing `IRAuthoringClient` pattern; export downloads `.twee` with valid `StoryData`.

## Functional Requirements

### Phase 1 (TE-1): Schema + Migration

- **FR1**: `ThresholdEncounter` Prisma model: `id`, `checkInId` (nullable FK), `tweeSource`, `storydata` (JSON), `beatMode`, `gmFace`, `hexagramId`, `status` (`draft|active|archived`), `artifacts` (JSON: `SceneArtifact[]`), timestamps
- **FR2**: Extend `AlchemyCheckIn` with optional `thresholdEncounterId` FK

### Phase 2 (TE-2): Generator API

- **FR3**: `POST /api/threshold-encounter/generate` accepts all 4 input axes, uses AI SDK to draft `.twee`, returns `tweeSource + storydata`
- **FR4**: System prompt encodes phase structure (Context/Anomaly/Choice/Response/Artifact), wuxing routing, `StoryData` schema, and GM face modulation
- **FR5**: `src/lib/threshold-encounter/generator.ts` — pure function; testable without HTTP

### Phase 3 (TE-3): StoryData parser + artifact extractor

- **FR6**: `parseStorydata(tweeSource): ThresholdStoryData` — extracts embedded JSON from `StoryData` passage
- **FR7**: `extractArtifacts(storydata): DeclaredArtifact[]` — returns artifact declarations for post-adventure processing

### Phase 4 (TE-4): Post-adventure overlay

- **FR8**: `PostAdventureOverlay` client component appears after final passage; shows optional BAR candidate write-in
- **FR9**: `saveBarCandidate` server action stores artifact on `ThresholdEncounter.artifacts`
- **FR10**: `completeEncounter` links `AlchemyCheckIn.thresholdEncounterId`

### Phase 5 (TE-5): DailyCheckIn wiring

- **FR11**: `DailyCheckInQuest` step 4 (move type selection) launches `ThresholdEncounter` instead of legacy `SceneDsl` growth scene
- **FR12**: Passes `hexagramId` (draw or random fallback), `gmFace` from player profile, `nationSlug`/`archetypeSlug` from `PlayerPlaybook`

### Phase 6 (TE-6): Admin BAR candidate review

- **FR13**: `/admin/bar-candidates` page lists `bar_candidate` artifacts with `pending` status
- **FR14**: `promoteBarCandidate` creates `CustomBar` (or `QuestProposal`) via existing patterns; marks artifact `promoted`

### Phase 7 (TE-7): Export + GM editing

- **FR15**: `GET /api/threshold-encounter/[id]/export` returns `.twee` file with correct `Content-Disposition`
- **FR16**: Admin encounter view at `/admin/encounters/[id]` shows passage-level edit via `IRAuthoringClient`

## Non-Functional Requirements

- `SceneDsl` backward compatibility: existing `AlchemySceneTemplate` + `selectScene` flows unchanged
- AI generation is rate-limited; existing env model override applies
- `.twee` is the canonical deliverable — all other abstractions (generator, parser) are secondary
- `storydata` JSON in `.twee` is machine-parseable at encounter completion — no loose parsing

## Persisted data & Prisma

| Check | Done |
|-------|------|
| `ThresholdEncounter` + `AlchemyCheckIn` extension in Design Decisions + API Contracts | |
| `tasks.md` includes `npx prisma migrate dev --name add_threshold_encounter` | |
| `npm run db:sync` after schema edit | |
| Human reviews migration SQL (additive) | |

**New model**:

```prisma
model ThresholdEncounter {
  id          String    @id @default(cuid())
  checkInId   String?
  checkIn     AlchemyCheckIn? @relation(fields: [checkInId], references: [id])
  tweeSource  String    @db.Text
  storydata   String    // JSON: ThresholdStoryData
  beatMode    String    // minimal | canonical
  gmFace      String
  hexagramId  Int
  status      String    @default("draft") // draft | active | archived
  artifacts   String    @default("[]")    // JSON: SceneArtifact[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("threshold_encounters")
}
```

**Extend**:
```prisma
// AlchemyCheckIn — add:
thresholdEncounterId String?
thresholdEncounter   ThresholdEncounter? @relation(fields: [thresholdEncounterId], references: [id])
```

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| AI calls (generate) | Env model override (`THRESHOLD_ENCOUNTER_MODEL`); cache generated `.twee` on `ThresholdEncounter` record |
| `.twee` size | `@db.Text` on `tweeSource`; max 9 passages × ~200 chars = ~2KB — within limits |

## Verification Quest

- **ID**: `cert-threshold-encounter-v1`
- **Steps**:
  1. Complete daily check-in — verify `ThresholdEncounter` is created and `.twee` loads in browser
  2. Complete all 5 encounter phases — verify post-adventure overlay appears
  3. Write in a BAR candidate — verify it appears in `/admin/bar-candidates`
  4. GM promotes BAR candidate to BAR — verify `CustomBar` created
  5. GM exports `.twee` — verify valid file with `StoryData` block downloads
  6. `npm run build + npm run check` pass; growth scene runner unaffected
- **Narrative**: "Verify the encounter generator so Bruised Banana residency players get alchemy scenes keyed to their emotional state at the April events."

## Dependencies

- `1.25 AES (phases 1–4)` — Emotional Alchemy Scene library
- `src/lib/alchemy/wuxing.ts` — `resolveMoveDestination`
- `src/lib/growth-scene/types.ts` — `SceneDsl`, `ArtifactType`
- `src/actions/alchemy.ts` — `createDailyCheckIn`, `linkCheckInScene`
- `src/components/dashboard/DailyCheckInQuest.tsx` — trigger point

## References

- Seed: [seed-threshold-encounter.yaml](../../../seed-threshold-encounter.yaml)
- AES spec: [emotional-alchemy-scene-library/spec.md](../emotional-alchemy-scene-library/spec.md)
- Related: Backlog `1.27 OTG`
