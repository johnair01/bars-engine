# Spec: Auto Flow Chained Initiation

## Purpose

Match Bruised Banana's structural depth and longitude in the auto-generated initiation flow by chaining multiple quest packets (intro, character creation, moves/GM) into a single adventure, with branching at lens, nation, playbook, and domain.

**Problem**: The current grammatical initiation flow has 6 spine nodes + depth branches. Bruised Banana has ~20+ nodes with character creation (lens, nation, playbook, domain), 4 moves learning, and GM selection. The auto flow lacks this depth and the branching structure.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Chaining | Use existing `appendQuestToAdventure` to chain three packets: intro → character creation → moves/GM |
| Character creation | New packet type with fixed branching (hub → Set nodes → converge). Not Epiphany/Kotter spine. |
| State persistence | Use `linkedQuestId` + completion effects: each Set passage links to a quest; completing it runs `processCompletionEffects` (setNation, setPlaybook, setDomain) |
| Intro packet | Short Epiphany (4 beats: orientation, rising, tension, integration). Terminal node connects to packet 2. |
| Moves/GM packet | Heuristic passages for 4 moves + GM face selection (6 choices). Reuses FACE_META, FACE_SENTENCES. |

## Conceptual Model

- **WHO**: Nation, Playbook, Game Master face — selected during character creation and GM phases
- **WHAT**: Initiation quest — chained packets as one adventure
- **WHERE**: Allyship domain — selected in character creation
- **Energy**: Vibeulons — minted on completion (existing)
- **Personal throughput**: 4 Moves — learned in packet 3 before commitment

## API Contracts (API-First)

### compileCharacterCreationPacket (pure function)

**Input**: `{ segment: 'player' | 'sponsor' }` (optional; for text variants)

**Output**: `SerializableQuestPacket`

```ts
export function compileCharacterCreationPacket(opts?: {
  segment?: 'player' | 'sponsor'
}): SerializableQuestPacket
```

- Lens hub: 3 choices (cognitive, emotional, action) → SetLens_* → converge to nation hub
- Nation hub: choices from `db.nation.findMany` → SetNation_* → converge to playbook hub
- Playbook hub: choices from `db.playbook.findMany` → SetPlaybook_* → converge to domain hub
- Domain hub: choices from ALLYSHIP_DOMAINS → SetDomain_* → terminal (no internal choices)
- Node IDs prefixed `char_` to avoid collision with append prefix

### compileMovesGMPacket (pure function)

**Input**: `{ segment?: 'player' | 'sponsor' }`

**Output**: `SerializableQuestPacket`

```ts
export function compileMovesGMPacket(opts?: {
  segment?: 'player' | 'sponsor'
}): SerializableQuestPacket
```

- Moves_Intro, Moves_WakeUp, Moves_CleanUp, Moves_GrowUp, Moves_ShowUp (heuristic text)
- ChooseGM hub: 6 choices (Shaman, Challenger, Regent, Architect, Diplomat, Sage) → SetGM_*
- SetGM_*: each converges to Commit (transcendence) → Signup (consequence)
- Node IDs prefixed `moves_` or `gm_`

### compileIntroPacket (or compileQuest with spineLength)

**Input**: `QuestCompileInput` with `spineLength?: 'short' | 'full'`

**Output**: `SerializableQuestPacket`

```ts
// Option A: New function
export function compileIntroPacket(input: QuestCompileInput): SerializableQuestPacket

// Option B: Extend compileQuest
// Add spineLength: 'short' → 4 beats only (orientation, rising, tension, integration)
```

- Last node is terminal (choices only to external targets or single "Continue" placeholder for append)

### publishChainedInitiationAdventure (Server Action)

**Input**:
- `introPacket: SerializableQuestPacket`
- `charPacket: SerializableQuestPacket`
- `movesGMPacket: SerializableQuestPacket`
- `slug: string` (e.g. `bruised-banana-initiation-player`)
- `campaignRef?: string`
- `sourceQuestId?: string | null` (for linkedQuestId on final passage)

**Output**:
- Success: `{ success: true; adventureId: string; passageCount: number }`
- Error: `{ error: string }`

```ts
export async function publishChainedInitiationAdventure(
  introPacket: SerializableQuestPacket,
  charPacket: SerializableQuestPacket,
  movesGMPacket: SerializableQuestPacket,
  slug: string,
  opts?: { campaignRef?: string; sourceQuestId?: string | null }
): Promise<
  | { success: true; adventureId: string; passageCount: number }
  | { error: string }
>
```

- **Route**: Server Action (`'use server'`). Admin-only.
- Creates Adventure with intro packet passages, then `appendQuestToAdventure(charPacket)`, then `appendQuestToAdventure(movesGMPacket)`.
- Sets last passage `linkedQuestId` = sourceQuestId when provided.
- Status: ACTIVE (or DRAFT per project convention).

## User Stories

### P1: Admin generates full initiation from chained packets

**As an admin**, I want to generate a full Bruised Banana-style initiation adventure from three chained packets (intro, character creation, moves/GM), so the auto flow matches the structural depth of the existing flow.

**Acceptance**: Admin can trigger `publishChainedInitiationAdventure`; adventure is created with all passages; flow plays from start to signup.

### P2: Player experiences character creation branching

**As a new player**, I want to choose my lens, nation, playbook, and domain through branching choices that converge, so my choices are recorded and the flow feels like Bruised Banana.

**Acceptance**: At each hub (lens, nation, playbook, domain), I see multiple choices; selecting one leads to a Set passage; "Continue" returns to the spine; choices persist to storyProgress.

### P3: Player learns 4 moves and selects Game Master face

**As a new player**, I want to learn the 4 moves and choose my Game Master face before signing up, so I arrive at the dashboard with context.

**Acceptance**: Moves_Intro through Moves_ShowUp present each move; ChooseGM offers 6 faces; selecting one sets active_face; Commit → Signup completes the flow.

## Functional Requirements

### Phase 1: Packet Compilers

- **FR1**: `compileCharacterCreationPacket` — returns packet with lens/nation/playbook/domain branching. Uses DB for nation/playbook choices.
- **FR2**: `compileMovesGMPacket` — returns packet with 4 moves + GM selection. Heuristic text.
- **FR3**: `compileIntroPacket` or `compileQuest` with `spineLength: 'short'` — 4-beat intro, terminal last node.

### Phase 2: Chain Publish

- **FR4**: `publishChainedInitiationAdventure` — creates adventure, publishes intro, appends char, appends moves/GM.
- **FR5**: Last passage gets `linkedQuestId` when sourceQuestId provided.

### Phase 3: State Persistence

- **FR6**: Set passages (SetLens_*, SetNation_*, etc.) link to CustomBars with completion effects. `processCompletionEffects` supports setNation, setPlaybook, setDomain, setDevelopmentalHint.
- **FR7**: Reaching a Set passage (or completing its linked quest) updates Player.storyProgress or campaign state.

## Non-Functional Requirements

- No new Prisma models; reuse Passage, Adventure, CustomBar, QuestThread
- Character creation packet is deterministic (no AI for structure)
- Moves/GM packet uses heuristic text (no AI required for v1)

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| DB reads | `compileCharacterCreationPacket` needs nations/playbooks; cache or pass as input |
| Append | `appendQuestToAdventure` already handles prefixing; ensure node ID prefixes don't collide |

## Dependencies

- `appendQuestToAdventure` ([src/actions/quest-grammar.ts](src/actions/quest-grammar.ts))
- `processCompletionEffects` in quest-engine for setNation, setPlaybook, setDomain
- ALLYSHIP_DOMAINS, FACE_META, FACE_SENTENCES
- Nation, Playbook models (Prisma)

## References

- [src/actions/quest-grammar.ts](../../../src/actions/quest-grammar.ts) — appendQuestToAdventure (line 885)
- [src/app/api/adventures/[slug]/[nodeId]/route.ts](../../../src/app/api/adventures/[slug]/[nodeId]/route.ts) — BB node order (line 471)
- [scripts/seed-bruised-banana-adventure.ts](../../../scripts/seed-bruised-banana-adventure.ts) — BB passage structure
