# Spec: Starter Quest Generator v1 + Emotional Alchemy Integration

## Purpose

Implement domain-biased starter quest assignment after onboarding completion. Players receive 1 primary quest (by intended_impact_domain) plus up to 2 optional quests from a pool. Each quest resolves its emotional move from the canonical grammar—no hardcoded emotional logic in quest definitions.

**Problem**: All players currently get the same 2 short-win quests (Explore Market, Request from Library). No domain personalization. No canonical emotional move resolution for starter quests.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. Extend existing models; no new tables.

## Design Decisions

| Topic | Decision |
|-------|----------|
| No new tables | Use CustomBar for quests; ThreadQuest for assignment. |
| resolveMoveForContext | Internal module (not HTTP API). Uses move-engine + lens-moves + domain preference. |
| Domain-biased selection | Primary quest by allyshipDomain (from lens or campaignDomainPreference). |
| 5 starter templates | Seed as CustomBars with allyshipDomain. Integrate with bruised-banana-orientation-thread. |
| Fallback | When resolveMoveForContext returns null, quest still renders; moveType optional. |

## Conceptual Model (Game Language)

| Dimension | Meaning |
|-----------|---------|
| **WHO** | Player (completer), Campaign (Bruised Banana) |
| **WHAT** | Starter quests — CustomBar with allyshipDomain |
| **WHERE** | Allyship domains (GATHERING_RESOURCES, RAISE_AWARENESS, SKILLFUL_ORGANIZING, DIRECT_ACTION) |
| **Energy** | Vibeulons — minted on completion |
| **Personal throughput** | 4 moves; canonical move resolved from grammar |

## API Contracts

### resolveMoveForContext(params)

**Input**: `{ allyshipDomain: string; lens?: string; campaignPhase?: number }`  
**Output**: `CanonicalMove | null`

```ts
export function resolveMoveForContext(params: {
  allyshipDomain: string
  lens?: string
  campaignPhase?: number
}): CanonicalMove | null
```

- Uses DOMAIN_MOVE_PREFERENCE (emotional-alchemy-interfaces). When lens present, intersects with getMovesForLens.
- Returns first matching move. Null when no match; caller handles fallback.

### getStarterQuestsForPlayer(playerId, campaignRef)

**Input**: `playerId: string`, `campaignRef: string`  
**Output**: `{ primary: CustomBar; optional: CustomBar[] }`

```ts
export async function getStarterQuestsForPlayer(
  playerId: string,
  campaignRef: string
): Promise<{ primary: CustomBar; optional: CustomBar[] }>
```

- Resolves player's domain via campaignDomainPreference or lens→domain.
- Queries CustomBar with campaignRef, type onboarding, status active.
- Returns 1 primary (domain match) + 2 optional (other domains).

## User Stories

### P1: Domain-biased primary quest

**As a player** who completed onboarding with lens/domain preference, I want my first starter quest to match how I intend to contribute (Gather Resources, Raise Awareness, etc.), so I land in relevant work.

**Acceptance**: Primary quest selected by allyshipDomain. GATHERING_RESOURCES → Strengthen the Residency; RAISE_AWARENESS → Invite an Ally or Create Momentum; etc.

### P2: Canonical emotional move

**As the system**, I want starter quests to resolve their emotional move from the canonical grammar (domain + lens), so we never hardcode move logic in quest definitions.

**Acceptance**: resolveMoveForContext returns CanonicalMove when domain + lens match. Quest displays move metadata when resolved; safe fallback when null.

### P3: 1 primary + 2 optional

**As a player**, I want 1 primary quest plus up to 2 optional starter quests, so I have choice and momentum.

**Acceptance**: Max 3 quests total; primary by domain; optional from other domains.

## Functional Requirements

### Phase 1: resolveMoveForContext

- **FR1**: Create `src/lib/quest-grammar/resolveMoveForContext.ts`.
- **FR2**: Implement DOMAIN_MOVE_PREFERENCE (domain → preferred move IDs) from emotional-alchemy-interfaces (Water/Wood/Earth for Gather, etc.). Map to move-engine IDs.
- **FR3**: When lens present, intersect domain preference with getMovesForLens; return first match.
- **FR4**: Return null when no match; no throw.

### Phase 2: Seed 5 Starter Quest Templates

- **FR5**: Seed 5 CustomBars as starter quests: Strengthen the Residency (GATHERING_RESOURCES), Invite an Ally (RAISE_AWARENESS), Declare a Skill (SKILLFUL_ORGANIZING), Test the Engine (DIRECT_ACTION), Create Momentum (RAISE_AWARENESS).
- **FR6**: Each has allyshipDomain, campaignRef: 'bruised-banana', type: 'onboarding', isSystem: true.

### Phase 3: Domain-Biased Assignment

- **FR7**: Create `getStarterQuestsForPlayer(playerId, campaignRef)` — returns primary + optional from pool.
- **FR8**: Extend assignOrientationThreads or add `assignStarterQuestsForCampaign` — when lens present, call getStarterQuestsForPlayer and assign primary + optional to bruised-banana-orientation-thread (or dynamic per-player thread).
- **FR9**: Primary quest: domain match. Optional: up to 2 from other domains.

### Phase 4: Move Resolution on Quest

- **FR10**: When assigning starter quest, call resolveMoveForContext(domain, lens). Store result in quest metadata or pass to client. Optional: set CustomBar.moveType from primaryWaveStage.
- **FR11**: Unresolved case: quest still renders; no emotional copy; log for admin.

## Non-Functional Requirements

- No schema changes. Use existing CustomBar fields.
- resolveMoveForContext is db-free (client-bundle safe if needed).
- Seed script idempotent.

## Verification Quest

- **ID**: `cert-starter-quest-generator-v1`
- **Steps**: (1) Complete Bruised Banana signup with lens; (2) Confirm starter quests appear; (3) Primary matches domain; (4) Complete one quest; (5) Verify move/copy when resolved.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/spec.md)

## Dependencies

- [bruised-banana-post-onboarding-short-wins](../bruised-banana-post-onboarding-short-wins/spec.md) — assignOrientationThreads, bruised-banana-orientation-thread
- [campaign-onboarding-twine-v2](../campaign-onboarding-twine-v2/spec.md) — lens in campaignState
- move-engine, lens-moves — [src/lib/quest-grammar/](../../src/lib/quest-grammar/)

## References

- [docs/STARTER_QUEST_GENERATOR_INTEGRATION_ANALYSIS.md](../../docs/STARTER_QUEST_GENERATOR_INTEGRATION_ANALYSIS.md)
- [.agent/context/emotional-alchemy-interfaces.md](../../.agent/context/emotional-alchemy-interfaces.md)
- [src/actions/quest-thread.ts](../../src/actions/quest-thread.ts)
- [scripts/seed-onboarding-thread.ts](../../scripts/seed-onboarding-thread.ts)
