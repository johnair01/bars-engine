# Spec: 321 Shadow Process

## Purpose

Enable a digital 3→2→1 flow (Integral Theory shadow work) so shadow work can become BARs and quests and drive vibeulon flow. Players complete a 321 session, are prompted to create a BAR with optional metadata import, and BAR creators receive vibeulons when their public BARs are used in completed quests.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| 6 unpacking questions | Pull from `@/lib/quest-grammar` — single source of truth |
| 321 storage | No persistent model. Transient; used for prompt and metadata import only |
| BAR creation | Player creates BAR manually after 321; system prompts with option to import metadata |
| BAR-quest attachment | Option A: Use existing `parentId`; mint 1 vibeulon per public BAR creator on quest completion |

## User Stories

### P1: 321 Form (3→2→1 Flow)

**As a player**, I want to complete a 321 shadow session (Face It → Talk to It → Be It), so I can process shadow work and optionally turn it into a BAR.

**Acceptance**:
- Phase 3 (Face It): Nation/archetype, developmental level, gender of personified charge
- Phase 2 (Talk to It): 6 unpacking questions from `UNPACKING_QUESTIONS` (import from `@/lib/quest-grammar`)
- Phase 1 (Be It): Identification and integration (freeform or structured)
- Post-321: Prompt "Create a BAR?" with option to import metadata; skip allowed

### P2: BAR Creator Mint on Quest Completion

**As a BAR creator**, I want to receive 1 vibeulon when someone completes a quest that uses my public BAR, so my contribution is recognized.

**Acceptance**:
- On quest completion: find BARs where `parentId = questId`, `visibility = 'public'`, `creatorId != completer`
- Mint 1 vibeulon to each such BAR creator; log `VibulonEvent` with `source: 'bar_creator_quest_completion'`

### P3: Metadata Import for BAR Creation

**As a player**, I want to import metadata from my 321 session when creating a BAR, so I can pre-fill title, description, and tags without re-typing.

**Acceptance**:
- `createCustomBar` accepts optional `metadata321` (FormData or JSON)
- When provided, pre-fill title, description, tags derived from 321 answers
- Deterministic derivation: rules only, no AI

## API Contracts

### Metadata321 Type

```ts
type Metadata321 = {
  title?: string
  description?: string
  tags?: string[]
  linkedQuestId?: string
}
```

### createCustomBar (extend)

**Existing**: FormData with `title`, `description`, `linkedQuestId`, etc.

**Extend**: Accept optional `metadata321` (JSON string in FormData) for pre-fill.

| Field | Type | Purpose |
|-------|------|---------|
| `metadata321` | `string` (JSON) | Pre-fill from 321 session; `linkedQuestId` when user chooses to append to quest |

**Response**: `{ success, barId, visibility, warning }` or `{ error }` (unchanged).

### deriveMetadata321 (deterministic)

**Input**: Phase 3 (taxonomic), Phase 2 (unpacking answers), Phase 1 (identification)
**Output**: `Metadata321`

**Rules** (no AI):
- `title`: q1 (experience) + truncated q5, or first 50 chars of combined
- `description`: Concatenate unpacking answers (q1–q6) with separators
- `tags`: Selected options from q2, q4, q6; dedupe

## Integration Flow

```
321 digital input (phases 3→2→1)
  → Opt-out for metadata usage
  → Prompt: "Create a BAR" with option to import metadata
  → Player creates BAR (public or private); optionally linkedQuestId
  → BAR appended to quest (parentId = questId)
  → Quest completed
  → Vibeulon minted for BAR creator (if public)
```

## References

- Unpacking constants: [src/lib/quest-grammar/unpacking-constants.ts](../../src/lib/quest-grammar/unpacking-constants.ts)
- Deftness: [.agents/skills/deftness-development/SKILL.md](../../.agents/skills/deftness-development/SKILL.md)
