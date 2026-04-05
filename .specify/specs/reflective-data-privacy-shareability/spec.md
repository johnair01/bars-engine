# Spec: Reflective Data Privacy + Shareability Model v0

## Purpose

Define infrastructure to preserve people's data skillfully and deftly. Establish clear data classes, visibility levels, identity layers, derived artifact rules, agent access boundaries, provenance rules, and consent controls—so the system can handle personal and collective data with care while enabling appropriate sharing.

**Problem**: Data flows across players, quests, threads, feedback, and AI agents without a unified privacy model. Visibility is ad-hoc (public/private strings). Provenance and consent are partial. Agent access is implicit. We need a coherent, API-first model.

**Practice**: API-first development — define typed contracts and schemas first; implement against them. Deftness Development — minimal, intentional data handling.

## Design Principles

| Principle | Meaning |
|-----------|---------|
| **Reflective** | System can reason about its own data handling; policies are inspectable |
| **Skillful** | Right data to right context; no over-exposure, no under-sharing |
| **Deft** | Minimal surface area; clear boundaries; deterministic when possible |
| **API-first** | Typed APIs and schemas before implementation; contracts drive behavior |

## 1. Data Classes

Data classes categorize records by sensitivity and lifecycle.

| Class | Description | Examples | Retention |
|-------|-------------|----------|-----------|
| **Identity** | Directly identifies a person | Player.id, email, name | Account lifetime |
| **Behavioral** | Actions, choices, completions | PlayerQuest, BarClaim, feedback | Configurable |
| **Content** | User-created or -contributed text/media | CustomBar, reflection inputs, LibraryRequest | Configurable |
| **Derived** | System-generated from other data | AI-extracted quests, analytics aggregates | Configurable |
| **Operational** | System state, logs, config | GlobalState, migrations | Operational need |
| **Collective** | Shared, non-personal | Quest packs, wiki, public quests | Public domain |

### API Contract

```ts
type DataClass = 'identity' | 'behavioral' | 'content' | 'derived' | 'operational' | 'collective'

interface DataClassPolicy {
  class: DataClass
  retentionDefault: 'account' | 'configurable' | 'operational' | 'indefinite'
  exportable: boolean
  deletableByUser: boolean
}
```

## 2. Visibility Levels

Visibility controls who can read a record. Levels are ordered; higher implies broader access.

| Level | Who can read | Use case |
|-------|--------------|----------|
| **private** | Owner only | Draft quests, personal notes |
| **invite_only** | Owner + explicitly invited | Pack shared with friends |
| **instance** | Members of a campaign/instance | Event-specific quests |
| **public** | Authenticated players | Market quests, packs |
| **public_anon** | Anyone (no auth) | Landing, marketing |
| **system** | System/agents only | Internal state, logs |

### API Contract

```ts
type VisibilityLevel = 'private' | 'invite_only' | 'instance' | 'public' | 'public_anon' | 'system'

interface VisibilityPolicy {
  level: VisibilityLevel
  requiresAuth: boolean
  scope: 'owner' | 'invitees' | 'instance' | 'authenticated' | 'world' | 'system'
}
```

### Migration from Current Schema

- `CustomBar.visibility`: 'public' | 'private' → map to `public` | `private`; add `instance` for campaign-linked
- `QuestPack.visibility`: same
- `MicroTwine.visibility`: `PUBLIC_ONBOARDING` | `PRIVATE_QUEST` → map to visibility levels

## 3. Identity Layers

Identity layers separate "who" from "what they did" to support anonymization and pseudonymization.

| Layer | Description | Example |
|-------|-------------|---------|
| **Account** | Stable, authenticated identity | Player.id, auth tokens |
| **Persona** | Display identity (name, avatar) | Player.name, avatarConfig |
| **Pseudonym** | Optional alternate identity | Handle, display name override |
| **Anonymized** | No link to account | Aggregated feedback, stats |
| **Collective** | Shared identity (nation, archetype) | Nation membership, playbook |

### API Contract

```ts
type IdentityLayer = 'account' | 'persona' | 'pseudonym' | 'anonymized' | 'collective'

interface IdentityBinding {
  layer: IdentityLayer
  playerId?: string
  anonymizedId?: string
  collectiveRef?: string
}
```

### Use Cases

- **Feedback**: Store with `anonymized` or `persona` per consent
- **Quest completion**: Bind to `account` for assignment; optionally expose `persona` in feed
- **Analytics**: Use `anonymized` aggregates only when consent allows

## 4. Derived Artifact Rules

Rules for data generated from other data (AI outputs, aggregates, exports).

| Rule | Description |
|------|-------------|
| **Provenance required** | Every derived artifact MUST reference source(s) |
| **Inherit visibility** | Derived artifact visibility ≤ min(source visibilities) unless explicit override |
| **Inherit data class** | Derived artifact class = max(source classes) |
| **Deletion cascade** | When source is deleted, derived artifacts are marked or deleted per policy |
| **Export watermark** | Exports include provenance and export timestamp |

### API Contract

```ts
interface DerivedArtifactMeta {
  sourceIds: string[]
  sourceTypes: string[]
  derivedAt: string  // ISO
  derivationMethod: 'ai_extraction' | 'aggregate' | 'export' | 'transform'
  visibilityOverride?: VisibilityLevel
}
```

## 5. Agent Access Boundaries

Define what AI agents and system processes can read/write.

| Boundary | Read | Write | Notes |
|----------|------|-------|-------|
| **Analysis** | Content, Behavioral (chunk text, quest metadata) | Derived (CustomBar from books) | Book analysis, quest extraction |
| **Personalization** | Identity (persona), Behavioral | None | Recommendations, hints |
| **Moderation** | Content, Behavioral | Operational (flags) | Report handling |
| **Support** | Identity, Content (with consent) | Operational | Admin support flows |
| **Analytics** | Anonymized aggregates only | Operational | Metrics, dashboards |

### API Contract

```ts
type AgentRole = 'analysis' | 'personalization' | 'moderation' | 'support' | 'analytics'

interface AgentAccessPolicy {
  role: AgentRole
  dataClasses: DataClass[]
  read: boolean
  write: boolean
  requireConsent?: boolean
}
```

### Enforcement

- Server actions and API routes check `AgentAccessPolicy` before DB access
- Agent context (e.g. `feature: 'book_analysis'`) maps to role
- Audit log for agent reads/writes when sensitive

## 6. Provenance Rules

Provenance tracks origin and lineage of data.

| Rule | Description |
|------|-------------|
| **Creation** | Record creatorId, createdAt, sourceRef when applicable |
| **Transformation** | Store sourceIds, derivationMethod in metadata |
| **Consent** | Link to consent record when consent-gated |
| **Export** | Export events include what was exported, when, by whom |

### API Contract

```ts
interface ProvenanceRecord {
  recordId: string
  recordType: string
  createdAt: string
  creatorId?: string
  sourceRef?: { type: string; id: string }[]
  consentId?: string
  exportHistory?: { exportedAt: string; exportedBy: string; scope: string }[]
}
```

### Existing Hooks

- `CustomBar.completionEffects` (JSON): source, bookId
- `LibraryRequest.provenanceJson`: libraryRequestId, questIds, etc.
- `Feedback.privacy`: private | anonymized | public

## 7. Consent Controls

Consent gates access to and use of personal data.

| Consent Type | Scope | Granularity |
|--------------|-------|-------------|
| **Storage** | Retention of behavioral/content data | Per data class |
| **Sharing** | Visibility to other players/instances | Per record or bulk |
| **AI use** | Use in AI analysis, personalization | Per agent role |
| **Analytics** | Aggregation, metrics | Per purpose |
| **Export** | Data export, portability | Per request |

### API Contract

```ts
type ConsentType = 'storage' | 'sharing' | 'ai_use' | 'analytics' | 'export'

interface ConsentRecord {
  playerId: string
  consentType: ConsentType
  scope: string
  granted: boolean
  grantedAt?: string
  revokedAt?: string
  version: number
}
```

### Defaults

- **Storage**: Implicit for account data; explicit opt-in for extended retention
- **Sharing**: Per record visibility; explicit for public/anonymized
- **AI use**: Per feature; explicit for book analysis, feedback
- **Analytics**: Opt-in; anonymized by default
- **Export**: Per request; user-initiated

## API-First Implementation Plan

1. **Define contracts** — TypeScript types and Zod schemas for all policies
2. **Implement policy service** — `getVisibilityPolicy`, `getDataClass`, `getAgentAccessPolicy`
3. **Middleware** — API routes and server actions check policies before access
4. **Schema migration** — Add `dataClass`, `visibilityLevel` (enum) where missing
5. **Consent store** — `ConsentRecord` table and CRUD API
6. **Provenance helpers** — `recordProvenance`, `getProvenanceRecord`

## Verification

- [ ] All data classes have a defined policy
- [ ] Visibility levels are enforced per record type
- [ ] Agent access is gated by role
- [ ] Provenance is recorded for derived artifacts
- [ ] Consent can be requested, granted, revoked
- [ ] API contracts are typed and exported

## Reference

- Current schema: `prisma/schema.prisma` (visibility, privacy, provenanceJson)
- Related: GDPR, CCPA, data portability
