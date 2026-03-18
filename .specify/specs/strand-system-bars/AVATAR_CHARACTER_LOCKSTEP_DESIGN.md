# Avatar + Character Creation Lock-Step Design

**Lens**: Architect — quest design, strategy, versatile design  
**Goal**: Highest-leverage *structure* for avatar + character lock-step across onboarding, profile, and character-creator flows.

---

## 1. Current State

### Avatar Layers (avatar-parts.ts)

| Layer | Unlocks when (BB flow) | Data source |
|-------|-------------------------|-------------|
| `base` | Always | genderKey (pronouns) |
| `nation_body` | BB_ChooseNation / BB_SetNation_* / nationId | nationKey |
| `archetype_outfit` | BB_ChoosePlaybook / BB_SetPlaybook_* / archetypeId | archetypeKey |
| `nation_accent` | BB_ChooseDomain / BB_SetDomain_* / campaignDomainPreference | domainKey |
| `archetype_accent` | BB_Moves_* nodes only | — |

`getUnlockedLayersForNode(nodeId, campaignState)` maps BB node IDs to layers. **Character Creator has no equivalent** — it uses phases, not node IDs.

### Character Creator Phases (CharacterCreatorRunner)

| Phase | What resolves |
|-------|----------------|
| `landing` | — |
| `discovery` | archetype scores (accumulating) |
| `archetype_reveal` | **resolvedArchetype** |
| `archetype_alternatives` | optional re-select |
| `archetype_moves` | selectedArchetypeMoves (2 chosen) |
| `nation_discovery` | **resolvedNationId** |
| `nation_moves` | selectedNationMoves (2 chosen) |
| `story_community` | communityKey |
| `story_dreams` | dreamAnswers |
| `story_fears` | fearChoices |
| `complete` | — |

**Order difference**: Character Creator resolves **archetype before nation**; BB flow resolves **nation before archetype**.

### Onboarding / Profile

- **Profile** (`/onboarding/profile`): nation + archetype dropdowns, both required. No progressive reveal.
- **Guided onboarding**: Story nodes → nation_discovery → playbook_discovery. Uses BB-style nodes when `campaignRef=bruised-banana`.

---

## 2. Phase → Layer Mapping

### Unified mapping (all flows)

| Step | BB node / phase | Unlocked layers |
|------|-----------------|-----------------|
| 1 | base | `base` |
| 2 | Nation chosen | `nation_body` |
| 3 | Archetype chosen | `archetype_outfit` |
| 4 | Domain chosen | `nation_accent` |
| 5 | Moves chosen | `archetype_accent` |

### Character Creator phase → layer

| Phase | Unlocked layers | Rationale |
|-------|-----------------|-----------|
| `landing`, `discovery` | `base` | No identity yet |
| `archetype_reveal`, `archetype_alternatives`, `archetype_moves` | `base`, `archetype_outfit` | Archetype resolved first |
| `nation_discovery` | + `nation_body` | Nation resolved |
| `nation_moves` | + `nation_accent` | Domain = nation toolkit (moves) |
| `story_community` … `complete` | + `archetype_accent` | Moves committed (archetype + nation) |

**Design choice**: `nation_accent` unlocks at nation_moves (player has chosen nation toolkit). `archetype_accent` unlocks when both archetype and nation moves are chosen — i.e. at `story_community` (first step after nation_moves).

### Onboarding / Profile

- **Minimal**: Both dropdowns → all layers at once.
- **Medium**: Nation dropdown → base + nation_body; Archetype dropdown → + archetype_outfit; no domain/moves → nation_accent + archetype_accent stay locked or default.
- **Full**: Add domain preference step → nation_accent; add “choose 2 moves” step → archetype_accent.

---

## 3. Unification Strategy

### Single source of truth: `getUnlockedLayersForProgress`

Introduce a **source-agnostic** function that accepts a progress descriptor:

```ts
type ProgressSource = 'bb' | 'character-creator' | 'onboarding-profile'

type ProgressState = {
  nationId?: string | null
  archetypeId?: string | null
  campaignDomainPreference?: string[] | null
  // Character-creator specific:
  phase?: Phase
  resolvedArchetype?: { id: string; name: string } | null
  resolvedNationId?: string | null
  selectedArchetypeMoves?: string[]
  selectedNationMoves?: string[]
}

function getUnlockedLayersForProgress(
  source: ProgressSource,
  state: ProgressState,
  nodeId?: string  // for BB: currentNodeId
): PartLayer[]
```

- **BB**: Pass `nodeId`; delegate to existing `getUnlockedLayersForNode` when `source === 'bb'`.
- **Character Creator**: Use `phase` + `resolvedArchetype`, `resolvedNationId`, etc. to compute layers.
- **Onboarding/Profile**: Use `nationId` + `archetypeId`; optionally `campaignDomainPreference` for accents.

---

## 4. Implementation Options

### Option A: Minimal

**Scope**: Character Creator only. No changes to BB or profile.

- Add `getUnlockedLayersForCharacterCreatorPhase(phase, state)` in `avatar-parts.ts`.
- Add `CharacterCreatorAvatarPreview` component; render in `CharacterCreatorRunner` sidebar or header.
- Phase→layer mapping: base (landing/discovery) → archetype_outfit (archetype_reveal+) → nation_body (nation_discovery+) → nation_accent (nation_moves+) → archetype_accent (story_community+).
- **Effort**: ~1 day. **Risk**: Low.

### Option B: Medium

**Scope**: Unify BB + Character Creator; profile unchanged.

- Add `getUnlockedLayersForProgress(source, state, nodeId)`; refactor `getUnlockedLayersForNode` to call it when `source === 'bb'`.
- Use same `OnboardingAvatarPreview` (or a thin wrapper) for both CampaignReader (BB) and CharacterCreatorRunner.
- Character Creator: derive `AvatarConfig` from `resolvedArchetype` + `resolvedNationId` (with placeholder keys when partial).
- **Effort**: ~2–3 days. **Risk**: Low. **Benefit**: Single avatar logic, consistent UX.

### Option C: Full

**Scope**: BB + Character Creator + Profile, with progressive avatar in profile.

- Implement Option B.
- Profile page: add optional domain preference (or “skip”) and a “Choose 2 moves” micro-step. Avatar builds progressively as user selects nation → archetype → domain → moves.
- Shared `AvatarProgressPreview` used in: CampaignReader, CharacterCreatorRunner, profile page.
- **Effort**: ~4–5 days. **Risk**: Medium (profile flow changes). **Benefit**: Coherent avatar-as-quest across all entry points.

---

## 5. Recommendation

**Option B** is the highest-leverage structure:

1. **Reuses** existing `getUnlockedLayersForNode` semantics for BB.
2. **Extends** cleanly to Character Creator without touching profile.
3. **Single** `getUnlockedLayersForProgress` becomes the canonical mapping.
4. **Avatar** appears in Character Creator as a discovery reward — each phase reveals a new layer, reinforcing “you are becoming.”

Profile can stay dropdown-only for now; Option C can follow if profile becomes a guided flow.

---

## 6. Phase → Layer Quick Reference (Character Creator)

| Phase | base | nation_body | archetype_outfit | nation_accent | archetype_accent |
|-------|------|-------------|------------------|---------------|------------------|
| landing, discovery | ✓ | | | | |
| archetype_reveal … archetype_moves | ✓ | | ✓ | | |
| nation_discovery | ✓ | ✓ | ✓ | | |
| nation_moves | ✓ | ✓ | ✓ | ✓ | |
| story_community … complete | ✓ | ✓ | ✓ | ✓ | ✓ |

*Note*: Config keys for partial state — use `resolvedArchetype?.name` → archetypeKey, `resolvedNationName` → nationKey. Before nation resolved, use placeholder (e.g. `unknown`) for nation_body so base + archetype_outfit still render.
