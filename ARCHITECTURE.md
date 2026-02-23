# ARCHITECTURE — Mapping Foundations to Mechanics

This document maps BARs Engine’s ontology to implementable mechanics and schema patterns.

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

## Event Log Orientation
For durability and auditability, prefer append-only events:
- SpecPhaseAdvanced
- Ratified
- Forked
- VisibilityChanged
- ArtifactLinked

Events can be used to build timelines, dashboards, and narrative “history of the world.”
