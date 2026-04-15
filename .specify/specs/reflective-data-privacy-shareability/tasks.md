# Tasks: Reflective Data Privacy + Shareability Model v0

## Phase 1: Contracts and Types

- [ ] Create `src/lib/data-privacy/types.ts` with DataClass, VisibilityLevel, IdentityLayer
- [ ] Add DataClassPolicy, VisibilityPolicy, AgentAccessPolicy interfaces
- [ ] Add DerivedArtifactMeta, ProvenanceRecord, ConsentRecord interfaces
- [ ] Create Zod schemas for runtime validation
- [ ] Export from `src/lib/data-privacy/index.ts`

## Phase 2: Policy Service

- [ ] Create `src/lib/data-privacy/policies.ts`
- [ ] Implement `getDataClass(recordType): DataClass`
- [ ] Implement `getVisibilityPolicy(level): VisibilityPolicy`
- [ ] Implement `getAgentAccessPolicy(role): AgentAccessPolicy`
- [ ] Map CustomBar, QuestPack, Player, etc. to data classes

## Phase 3: Visibility Enforcement

- [ ] Add `checkVisibility(record, viewerId, instanceId?): boolean`
- [ ] Integrate in at least one API route (e.g. market quests, pack listing)
- [ ] Document visibility level mapping for existing schema

## Phase 4: Provenance Helpers

- [ ] Add `recordProvenance(recordId, recordType, meta)` helper
- [ ] Ensure book analysis stores DerivedArtifactMeta in completionEffects
- [ ] Extend LibraryRequest provenanceJson to typed schema

## Phase 5: Consent Store (v0 optional)

- [ ] Define ConsentRecord API contract in spec
- [ ] Defer Prisma model to v1 unless required

## Phase 6: Agent Access Boundaries

- [ ] Map features (book_analysis, etc.) to AgentRole
- [ ] Add `requireAgentAccess(role, dataClasses)` guard
- [ ] Document agent access in agent skills
