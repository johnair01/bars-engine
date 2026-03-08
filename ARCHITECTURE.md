# ARCHITECTURE — Mapping Foundations to Mechanics

This document maps BARs Engine’s ontology to implementable mechanics and schema patterns.

## Conceptual Model

The five dimensions (WHO, WHAT, WHERE, Energy, Personal throughput) map to schema as follows:

| Dimension | Schema / Models |
|-----------|-----------------|
| **WHO** | `Nation`, `Playbook`, `allowedNations`, `allowedTrigrams` |
| **WHAT** | `CustomBar` (quests) |
| **WHERE** | `allyshipDomain`, `campaignDomainPreference` |
| **Energy** | `Vibulon`, `InstanceParticipation.localBalance` |
| **Personal throughput** | `moveType`, Playbook/Nation `wakeUp`/`cleanUp`/`growUp`/`showUp` |

**Allyship domains** (WHERE): `GATHERING_RESOURCES`, `DIRECT_ACTION`, `RAISE_AWARENESS`, `SKILLFUL_ORGANIZING`. Quests can have `allyshipDomain`; players can filter by `campaignDomainPreference`.

**4 moves** (personal throughput): Wake Up = see more, Clean Up = emotional energy/unblocking, Grow Up = skill capacity, Show Up = completing quests. Distinct from the 8 archetype moves (Kotter stages).

**Domain × Kotter**: The same 8 Kotter stages manifest differently per allyship domain. See [.agent/context/kotter-by-domain.md](.agent/context/kotter-by-domain.md).

**Emotional alchemy** (narrative movement): 5 elements, WAVE, 15 canonical moves. Energy economy: Transcend +2, Generative +1, Control -1. Binary `translate` | `transcend` per node via `deriveMovementPerNode()` in `src/lib/quest-grammar/emotional-alchemy.ts`. Move engine: `src/lib/quest-grammar/move-engine.ts`; elements: `src/lib/quest-grammar/elements.ts`. Schema: `EmotionalAlchemySignature.movementPerNode`, `moveType`; `NodeEmotional.movement`. **Mastery**: Wake Up = choice-based completion; Show Up = action-based (required attestation on end passage). See [.agent/context/emotional-alchemy-ontology.md](.agent/context/emotional-alchemy-ontology.md).

## Core Objects

### BAR (Kernel)
A BAR is the atomic seed object. It can link to multiple downstream artifacts.

Recommended core fields (conceptual):
- `specPhase` (structural maturity)
- `kotterStage` (social adoption)
- `kernelState` (optional derived lifecycle)
- `weight` (derived/descriptive)
- `visibilityLevel` (access control)
- `parentBarId`, `forkRootId`, `forkDepth`, `branchTag` (evolution)

BARs should maintain provenance:
- author
- origin context (quest, admin action, import, fork)
- references to other BARs/artifacts

### Artifacts
Artifacts are the “blooms” from kernels. Examples:
- Specs, plans, task lists
- Quest drafts, quest runs
- Twine stories/modules and bindings
- Lore entries
- Validation notes

Artifacts should be linkable to BARs with typed relationships:
- `DERIVED_FROM`
- `VALIDATES`
- `IMPLEMENTS`
- `SUPPORTS`
- `FORK_OF`

## Axes

### Structural Axis (SpecPhase)
SpecPhase is per-BAR and represents maturity of formulation:
- CONSTITUTION → principles/constraints exist
- SPEC → desired end-state is explicit
- PLAN → approach and architecture exist
- TASKS → atomic steps exist
- IMPLEMENT → artifacts exist
- ANALYZE → validated and coherent

Rules:
- SpecPhase cannot skip forward without required artifacts.
- Advancement should be recorded as events.

### Social Axis (KotterStage)
KotterStage can be per-instance, per-campaign, or per-BAR (choose intentionally).
If per-BAR:
- advancement is governance-based (ratification), not automatic
- advancement is recorded as events

Rules:
- KotterStage changes must create a ratification record.
- Stage changes should respect domain scope.

## Governance

### Roles + Domain Scope
Permissions should be expressed as roles:
- roles are scoped to a domain (Nation, Archetype, System, Feature)
- role assignments determine what a user can see/ratify

Governance primitives:
- `Role`
- `RoleAssignment`
- `RatificationEvent`

Design stance:
- start with minimal role-based ratification
- evolve toward circles/quorum only if needed

## Visibility and Affordances

### Visibility Levels
Visibility is not purely “public/private.” It is domain-shaped.

Suggested levels:
- PUBLIC
- NATION
- ARCHETYPE
- ADMIN
- SYSTEM

Access rules should be implemented as:
- `canViewBar(user, bar) -> boolean`
- `barWhereClauseFor(user) -> PrismaWhereInput`

Affordances:
- players can manipulate their own BARs and public/domain-visible BARs
- admins/role-holders can see deeper metadata (validation notes, weight breakdown, ratification logs)
- domain roles can see domain-hidden BARs, incentivizing depth in nation/archetype

## Quest Fork Lifecycle and AID Offer Lifecycle

**Quest forking**: `forkQuestPrivately(questId)` creates a private copy for the player; `forkDeclinedAidQuest(offerId)` lets the offerer fork a declined/expired quest-type AID offer. Lineage: `forkedFromId` on CustomBar.

**AID offer lifecycle**: `offerAid` creates offer with `expiresAt` (configurable TTL, default 24h). Steward can accept or decline. When declined or expired, offerer can fork via `forkDeclinedAidQuest`. Status: pending → accepted | declined; expired treated as declined at read time.

**Architect Game Master**: Virtual sys-admin teacher for backlog stewardship; Heaven trigram. See [.agent/context/game-master-sects.md](.agent/context/game-master-sects.md) and [docs/JIRA_GITHUB_CYOA_METAPHOR.md](docs/JIRA_GITHUB_CYOA_METAPHOR.md).

## Evolution (Forking)

Forking is first-class. It should:
- preserve lineage (forkRootId / parentBarId)
- preserve structural maturity (specPhase can remain)
- restart social adoption if needed (kotterStage reset is allowed/typical)
- copy or reference artifacts per chosen semantics

Fork operation:
- `forkBar(barId, userId)` creates a new BAR with lineage updated
- forking should be recorded as an event

## Weight and Currency

Weight is descriptive. It should:
- be deterministically computed from artifacts + maturity
- increase as a BAR becomes more “loaded”
- support vibeulon minting rules tied to real work

Avoid:
- predictive “momentum multipliers”
- engineered acceleration mechanics

Prefer:
- event logs
- observable signals (artifact density, ratifications, forks, contributors)

## Economy and Translation (Attunement)
Vibeulons are modeled as:
- Global balance (player-level reserve)
- Local balance (per instance participation)

Mechanics:
- Attunement allocates from global → local.
- Spending happens locally within an instance.
- Transmutation is a governance-sanctioned conversion of local value into another context (global or another instance).

Recommended primitives:
- `InstanceParticipation(playerId, instanceId, localBalance, caps...)`
- `VibeulonLedger(playerId, sourceInstanceId?, targetInstanceId?, amount, type, createdAt, metadata)`

Ledger event types:
- MINT (global reserve increases)
- ATTUNE (global decreases, local increases)
- SPEND (local decreases)
- TRANSMUTE (local decreases; global or target-local increases; requires ratification)

Operational constraint (first 30 days):
- Default conversion rate is 1:1.
- No automatic reverse attunement; transmutation requires governance ratification and is logged.

## Event Log Orientation
For durability and auditability, prefer append-only events:
- SpecPhaseAdvanced
- Ratified
- Forked
- VisibilityChanged
- ArtifactLinked

Events can be used to build timelines, dashboards, and narrative “history of the world.”
