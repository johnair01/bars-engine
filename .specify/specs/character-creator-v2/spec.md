# Spec: Character Creator v2

## Purpose

Build a narrative-first PbtA character creator — a step wizard where players answer guided discovery questions that surface archetype resonance, choose one of 8 named archetypes, answer archetype-specific questions, pick 2-of-4 archetype moves and 2-of-4 nation moves, then receive a completed character that updates their player profile and generates a public shareable character card.

**Problem**: v1 implemented the PlayerPlaybook model and basic wizard but lacks a discovery question layer that surfaces archetype resonance before selection. I Ching trigram archetypes appear in player-facing UI despite being mechanical-only. Move selection (2-of-4 per archetype and nation) and the shareable card need full implementation.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Named archetypes only | 8 player-facing archetypes: Truth Seer, Bold Heart, Still Point, Danger Walker, Subtle Influence, Devoted Guardian, Joyful Connector, Decisive Storm |
| Trigrams excluded | The 8 I Ching trigram archetypes (Heaven, Earth, Thunder, etc.) MUST NOT appear in player-facing UI — mechanical background only |
| Discovery questions | Same questions for all players before archetype selection; answers generate resonance scores |
| No AI generation | All moves are GM-authored and stored in archetype/nation records — no AI at creation time |
| Move structure | 4 moves per archetype keyed to Wake Up/Clean Up/Grow Up/Show Up; player picks 2 |
| Nation moves | 4 available per nation (from `NationMove`); player picks 2 — requires `player.nationId` to be set |
| Auth | Character creation requires auth; shareable card at `/character/[shareToken]` is public |
| Deferred | Stats/dice system deferred to v3 |
| Supersedes | v2 supersedes prior seed. Key changes: discovery layer, trigram exclusion, 2-of-4 move picks. |

## Conceptual Model

| Dimension | Value |
|-----------|-------|
| **WHO** | Authenticated player (creates character); GM (configures templates via `/admin`) |
| **WHAT** | `PlayerPlaybook` record with archetype, chosen moves, discovery answers, `shareToken` |
| **WHERE** | `/character-creator` (archetype grid) → `/character-creator/[archetypeId]` (full wizard) |
| **Energy** | Self-discovery answers → resonance scores → archetype → moves = player identity in the system |
| **Personal throughput** | Wake Up — discovery questions surface what's already present |

## API Contracts (API-First)

### `getArchetypeResonanceScores` (Server Action)

**Input**: `{ answers: { questionId: string; answer: string }[] }`
**Output**: `{ scores: { archetypeId: string; archetypeKey: string; score: number }[] }` — sorted descending

```ts
function getArchetypeResonanceScores(
  input: { answers: DiscoveryAnswer[] }
): Promise<{ scores: ArchetypeScore[] }>
```

Rules-based: each answer has `archetypeWeights` map; scores are summed per archetype.

### `getCharacterCreatorTemplate` (Server Action)

**Input**: `{ archetypeId: string }`
**Output**: `{ template: CharacterCreatorTemplate }` — from `Adventure.playbookTemplate` JSON

```ts
type CharacterCreatorTemplate = {
  archetypeId: string
  discoveryQuestions: DiscoveryQuestion[]   // shared across all archetypes
  archetypeQuestions: ArchetypeQuestion[]   // archetype-specific
  moves: { wakeUp: Move; cleanUp: Move; growUp: Move; showUp: Move }
  nationMoves?: Move[]  // 4 from player's nation, fetched separately
}
```

### `saveCharacterPlaybook` (Server Action)

**Input**: `{ archetypeId: string; discoveryAnswers: DiscoveryAnswer[]; archetypeAnswers: ArchetypeAnswer[]; chosenMoveIds: string[]; chosenNationMoveIds: string[] }`
**Output**: `{ playbook: PlayerPlaybook; shareToken: string }`

```ts
function saveCharacterPlaybook(input: SaveCharacterInput): Promise<{ playbook: PlayerPlaybook; shareToken: string }>
```

### `getPublicPlaybook` (no auth required)

**Input**: `{ shareToken: string }`
**Output**: `{ playbook: PublicPlaybook }` — archetype, moves, answers (no PII)

## User Stories

### P1: Player answers discovery questions and sees resonant archetypes

**As a player**, I want to answer questions that surface which archetypes resonate most with me, so I make a meaningful choice rather than picking blindly.

**Acceptance**: Discovery questions presented before archetype grid. After answering all, archetypes show resonance scores. I Ching trigrams absent.

### P1: Player completes full wizard and receives shareable character card

**As a player**, I want to complete all wizard steps and receive a character card I can share publicly, so my identity in the game is visible outside the app.

**Acceptance**: Full wizard: discovery → archetype confirm → archetype-specific questions → move picks (2-of-4 archetype + 2-of-4 nation) → complete. `PlayerPlaybook` saved with `shareToken`. Card accessible at `/character/[shareToken]` without auth.

### P2: GM configures archetype template

**As a GM**, I want to author discovery question weights and archetype-specific questions for each of the 8 archetypes, so the wizard reflects my world's specific resonance patterns.

**Acceptance**: `/admin/adventures/[id]` with `adventureType=CHARACTER_CREATOR` shows template editor. GM sets per-answer archetype weights, archetype-specific questions, and 4 move texts.

## Functional Requirements

### Phase 1: Discovery Layer

- **FR1**: `getCharacterCreatorDiscoveryQuestions()` returns shared discovery questions from all active `CHARACTER_CREATOR` Adventures
- **FR2**: Each question option has `archetypeWeights: { archetypeId: number }` stored in `Adventure.playbookTemplate` JSON
- **FR3**: `getArchetypeResonanceScores` computes weighted sum per named archetype (NOT trigrams); returns sorted scores

### Phase 2: Archetype Selection Grid

- **FR4**: `/character-creator` fetches 8 named `Archetype` records (filtered by `isPlayerFacing: true` or name filter)
- **FR5**: Resonance scores displayed as visual indicator on each archetype card
- **FR6**: I Ching trigram archetypes are completely absent from this page

### Phase 3: Full Wizard

- **FR7**: Discovery Qs → archetype select → archetype-specific Qs → move picks (2-of-4 archetype) → nation move picks (2-of-4) → confirmation
- **FR8**: Nation moves require `player.nationId` to be set; if not set, player is prompted to choose nation first
- **FR9**: Back navigation works at each step; wizard state held in React state

### Phase 4: Save + Shareable Card

- **FR10**: `saveCharacterPlaybook` creates/updates `PlayerPlaybook` with `playerAnswers`, `playbookMoves`, `playbookBonds`, `shareToken`
- **FR11**: Sets `player.archetypeId` on the current player
- **FR12**: `/character/[shareToken]` public page shows archetype, chosen moves, selected answers — no auth required
- **FR13**: PDF export at `/api/character-creator/[id]/export`

### Phase 5: Admin Template Editor

- **FR14**: `/admin/adventures/[id]` with `CHARACTER_CREATOR` type shows `CharacterCreatorTemplateEditor`
- **FR15**: GM configures per-answer archetype weights for discovery questions
- **FR16**: GM authors archetype-specific questions and 4 move texts (Wake Up / Clean Up / Grow Up / Show Up)

## Non-Functional Requirements

- No AI generation at character creation time — all moves are GM-authored
- `shareToken` is a unique, opaque token (`cuid()` or similar)
- Trigram archetypes are never returned by any query that feeds player-facing pages
- `npm run check` passes with 0 TypeScript errors

## Persisted data & Prisma

`PlayerPlaybook` already has `shareToken`, `playerAnswers`, `playbookMoves`, `playbookBonds` fields (added in v1 migration). No new schema migration required.

| Check | Done |
|-------|------|
| Confirm `PlayerPlaybook.shareToken` exists in current schema | |
| Confirm `Adventure.playbookTemplate` can store discovery question weight structure | |
| `npm run db:sync` if any field additions needed | |

## Verification Quest

- **ID**: `cert-character-creator-v2-v1`
- **Steps**:
  1. Navigate to `/character-creator` — verify 8 named archetypes shown, no trigrams
  2. Answer discovery questions — verify resonance scores appear on archetypes
  3. Select Bold Heart — verify archetype-specific questions load
  4. Pick 2-of-4 archetype moves + 2-of-4 nation moves — verify save succeeds
  5. Navigate to `/character/[shareToken]` without auth — verify public card renders
  6. GM configures template in `/admin/adventures/[id]` — verify changes reflected in wizard
- **Narrative**: "Verify character creation so Bruised Banana guests at the April events can create their character before playing."

## Dependencies

- `PlayerPlaybook` model (v1 migration applied)
- `Archetype` + `Nation` models with move fields
- `Adventure` model with `adventureType=CHARACTER_CREATOR` + `playbookTemplate` JSON
- `src/lib/auth.ts` — `getCurrentPlayer()`

## References

- Seed: [seed-character-creator-v2.yaml](../../../seed-character-creator-v2.yaml)
- v1 implementation: branch `ooo/run/character-creator` (2026-03-10)
- Key changes from v1: discovery question layer with resonance scoring; trigram exclusion enforced; 2-of-4 move picks
