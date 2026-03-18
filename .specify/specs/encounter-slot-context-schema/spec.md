# Spec: Encounter Slot Context Schema

## Purpose

Give each passage slot in a template enough structured context that a GM agent can generate **grammatically correct campaign content** — content that knows what face is speaking, what function it serves in the campaign, what player context it needs, and what real-world artifact it should produce.

**Problem**: Templates produce face-labeled placeholders (template-library-gm-placeholders) but carry no machine-readable semantics about _what belongs in the slot_ or _what campaign context is required_. A Shaman face writing `context_1` for a GATHERING_RESOURCES campaign needs to know the campaign goal, the current Kotter stage, and what specific blocker the player faces — none of which is currently available at generation time.

**Practice**: Deftness Development — spec kit first, no schema change for v0 (slot context lives in `passageSlots` JSON). Extend existing interfaces; no new models needed.

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Storage** | Slot context is stored in `AdventureTemplate.passageSlots` JSON (already a JSON string). No Prisma schema change for v0. |
| **Backward compat** | All new `PassageSlot` fields are optional. Existing templates continue to work. `getPlaceholderForSlot` is unchanged. |
| **Generation context** | `GenerateOptions` extended with campaign context fields. Passed to backend `generate_encounter_passages`. |
| **Canonical grammar** | Each slot type has a fixed `campaignFunction` per domain. GATHERING_RESOURCES grammar is defined here (v0). Other domains follow same pattern. |
| **Artifact contract** | Each slot declares its `outputArtifact` — the real-world thing a player should produce. Downstream completion effects can reference this. |
| **Agent routing** | `gameMasterFace` on each slot is the authoritative routing key for which backend agent generates that passage. |

---

## Conceptual Model

### The Slot as a Teaching Moment

Each passage slot is a single beat in a campaign encounter. It has:

- A **speaker** (GM face) — whose voice narrates this beat
- A **function** — what this beat accomplishes in the campaign arc
- A **context requirement** — what the agent needs to know to write it
- An **artifact** — what the player walks away with (tangible or relational)

### Gather Resources — Encounter Grammar

The canonical 9-slot grammar for a GATHERING_RESOURCES campaign encounter:

| Slot | Face | Campaign Function | Required Context | Output Artifact |
|------|------|------------------|-----------------|----------------|
| `context_1` | Shaman | Orient to the resource gap — what is needed and why it matters | `campaignGoal`, `kotterStage`, `domainContext` | Emotional understanding of the need |
| `context_2` | Shaman | Name the relational/emotional stakes — who suffers from the gap | `campaignGoal`, `playerNation` | Named relationship to the cause |
| `context_3` | Shaman | The threshold moment — what shifts when the resource arrives | `campaignGoal`, `kotterStage` | Vision of the transformed state |
| `anomaly_1` | Challenger | Surface the primary blocker — bureaucracy, gatekeeping, time | `blockers[0]`, `kotterStage` | Named blocker |
| `anomaly_2` | Challenger | The internal resistance the player carries | `playerArchetype`, `playerNation` | Named internal pattern |
| `anomaly_3` | Challenger | What has to be composted — what false story is blocking action | `playerArchetype` | Released assumption |
| `choice` | Diplomat | 2–3 paths forward: ask directly / build relationship first / offer something in exchange | `campaignGoal`, `blockers` | Choice architecture |
| `response` | Regent | The commitment that emerges — pledge, signed form, scheduled conversation | `campaignGoal`, `outputArtifact` | Concrete commitment |
| `artifact` | Architect | The deliverable — form submitted, donation made, intro email sent | `campaignGoal`, `completionEffectHint` | Real-world action taken |

### How the I Ching Connects

The hexagram drawn for a player in `/campaign/lobby` contextualizes *why this encounter matters to them right now*. The `pathHint` from `portal-context.ts` (voiced by the GM face governing the player's changing line) is the **invitation to enter the encounter**. The slot context schema is what makes that encounter respond meaningfully once the player accepts the invitation.

Flow:
```
Hexagram drawn (aligned to nation + archetype + Kotter stage)
  → pathHint voiced by GM face
  → Player enters Adventure (the encounter)
  → Each slot generates content using: hexagram tone + campaign context + player context
  → Artifact slot produces the real-world action
  → completionEffects fire → campaign goal moves
```

---

## Type Definitions

### Extended PassageSlot

```typescript
export interface PassageSlot {
  nodeId: string
  label?: string
  order: number

  // Agent generation context (v0 — optional, backward compatible)
  gameMasterFace?: 'shaman' | 'challenger' | 'diplomat' | 'regent' | 'architect'
  campaignFunction?: string       // e.g. "Orient to the resource gap"
  requiredContext?: SlotContextKey[]  // what GenerateContext fields this slot uses
  outputArtifact?: string         // e.g. "pledge form URL", "donor name", "intro email sent"
  choiceCount?: number            // for 'choice' nodes: how many branches to generate
}

export type SlotContextKey =
  | 'campaignGoal'
  | 'kotterStage'
  | 'domainContext'
  | 'playerNation'
  | 'playerArchetype'
  | 'blockers'
  | 'completionEffectHint'
  | 'hexagramTone'
```

### Extended GenerateOptions

```typescript
export interface GenerateOptions {
  // existing
  title?: string
  slug?: string
  campaignRef?: string
  subcampaignDomain?: string

  // campaign context for agent generation
  campaignGoal?: string           // e.g. "raise $5000 for Bruised Banana residency"
  kotterStage?: number            // 1–8
  domainContext?: string          // what this allyship domain means in this campaign
  playerArchetype?: string        // archetype key (e.g. 'bold-heart') if generating for specific player type
  playerNation?: string           // nation slug (e.g. 'argyra') if generating for specific player type
  blockers?: string[]             // known blockers admin wants to address
  hexagramTone?: string           // hexagram name/tone from I Ching alignment (optional enrichment)
  completionEffectHint?: string   // what the artifact slot should scaffold (e.g. "donation form", "pledge")
}
```

### Backend Generation Context

The shape passed to `generate_encounter_passages`:

```typescript
export interface EncounterGenerationContext {
  templateId: string
  campaignRef: string
  subcampaignDomain?: string
  campaignGoal: string
  kotterStage: number
  domainContext?: string
  playerArchetype?: string
  playerNation?: string
  blockers?: string[]
  hexagramTone?: string
  completionEffectHint?: string
}
```

---

## Functional Requirements

### Phase 1: Type + Seed Extension (No AI, No Schema Change)

- **FR1**: Extend `PassageSlot` interface with optional context fields (as above). Backward compatible.
- **FR2**: Extend `GenerateOptions` interface with campaign context fields (as above).
- **FR3**: Update `seed-adventure-templates.ts` — add slot context to the `encounter-9-passage` template using the GATHERING_RESOURCES grammar table above.
- **FR4**: `getPlaceholderForSlot` SHOULD use `campaignFunction` from slot context when available (richer placeholder than current). Falls back to current face guidance when no context.
- **FR5**: `generateFromTemplate` passes `options` through to `Passage` creation — no behavior change, but context is now available for phase 2.

### Phase 2: Backend Generation (AI per slot)

- **FR6**: Backend endpoint `generate_encounter_passages(context: EncounterGenerationContext)` → `{ [nodeId]: string }` — routes each slot to the appropriate GM face agent using `gameMasterFace` from the slot.
- **FR7**: Frontend "Generate with AI" button passes `EncounterGenerationContext` to backend; receives `contentPerSlot`; calls `generateFromTemplate(..., { contentPerSlot })`.
- **FR8**: `generateFromTemplate` accepts optional `contentPerSlot: Record<string, string>` — when provided, uses it instead of placeholder for each matching nodeId.
- **FR9**: Admin review gate: all AI-generated Adventures remain DRAFT until admin promotes.

### Phase 3: Gather Resources Templates

- **FR10**: Seed a `gather-resources-encounter` template with the canonical 9-slot grammar from this spec (slot context fields populated). This is distinct from the generic `encounter-9-passage`.
- **FR11**: Seed templates for the other 3 allyship domains (RAISE_AWARENESS, DIRECT_ACTION, SKILLFUL_ORGANIZING) — grammar table TBD per domain.
- **FR12**: Admin templates page: when domain is GATHERING_RESOURCES, default template selector to `gather-resources-encounter`.

---

## Minimum Quest Types — Gather Resources Campaign

A complete campaign in the GATHERING_RESOURCES domain needs these quest types seeded on the gameboard deck:

| Quest Type | `campaignGoal` pattern | `completionEffects` | Count |
|-----------|----------------------|---------------------|-------|
| **Orientation** | "Understand what [resource] is for" | `barTypeOnCompletion: insight` | 1 per campaign |
| **Blocker** | "Name what's blocking [resource]" | `barTypeOnCompletion: vibe` | 2–3 per Kotter stage |
| **Ask** | "Make the ask for [resource]" | `barTypeOnCompletion: insight` + `grantVibeulons` | 1–2 per stage |
| **Commitment** | "Secure a commitment for [resource]" | `forgeInvitationBar` or donation link | 1 per stage |
| **Delivery** | "Complete the [resource] transfer" | `grantVibeulons` + `strengthenResidency` | 1 per stage |

These five types map directly to the 9 passage slots: Orientation ≈ context_1–3, Blocker ≈ anomaly_1–3, Ask ≈ choice, Commitment ≈ response, Delivery ≈ artifact.

---

## How Campaign Goals Are Tracked

| Level | Where | Updated By |
|-------|-------|-----------|
| **Instance** | `Instance.goalAmountCents` / `currentAmountCents` | Admin (manual) or Donation automation |
| **Quest** | `CustomBar.campaignGoal` text | Seeded per quest |
| **Effect** | `completionEffects` JSON | Quest completion triggers donation/pledge |
| **Thread** | `ThreadProgress.completedAt` | Auto-set when last quest in thread completes |
| **Slot** | `GameboardSlot.cleanUpAt` / `wakeUpAt` | Player checkpoints on gameboard |

**Thread completes when**: `ThreadProgress.currentPosition` advances past the last `ThreadQuest.position`. At that point `completedAt = now()` and `assignGatedThreads()` unlocks dependent threads.

---

## Non-Functional Requirements

- No Prisma schema change for v0 and v1 (slot context lives in JSON).
- All new `PassageSlot` fields are optional — no migration needed for existing templates.
- `getPlaceholderForSlot` must remain callable without slot context (for generated adventures with old-format templates).
- Agent routing must be deterministic when `gameMasterFace` is set; must fall back to prefix-based mapping when not set (existing behavior).

---

## Dependencies

- [template-library-gm-placeholders](../template-library-gm-placeholders/spec.md) — ✅ Done
- [game-master-template-content-generation](../game-master-template-content-generation/spec.md) — Phase 2 of that spec is Phase 2 of this spec
- Backend GM agents: architect, shaman, challenger, diplomat, regent (already exist in `backend/app/agents/`)
- [portal-path-hint-gm-interview](../portal-path-hint-gm-interview/spec.md) — hexagram → pathHint → encounter entry

## References

- [ANALYSIS.md](../game-master-template-content-generation/ANALYSIS.md)
- [prisma/schema.prisma](../../prisma/schema.prisma) — CustomBar.campaignGoal, GameboardSlot, QuestThread, ThreadProgress
- [src/lib/template-library/index.ts](../../src/lib/template-library/index.ts)
- [src/lib/portal-context.ts](../../src/lib/portal-context.ts)
- [src/actions/quest-engine.ts](../../src/actions/quest-engine.ts) — completionEffects
- [src/actions/gameboard.ts](../../src/actions/gameboard.ts)
- [backend/app/agents/](../../backend/app/agents/) — shaman.py, challenger.py, diplomat.py, regent.py, architect.py
