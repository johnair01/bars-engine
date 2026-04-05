# Plan: Reflective Data Privacy + Shareability Model v0

## Phases

### Phase 1: Contracts and Types (API-first foundation)

- Create `src/lib/data-privacy/types.ts` with TypeScript types for:
  - DataClass, VisibilityLevel, IdentityLayer
  - DataClassPolicy, VisibilityPolicy, AgentAccessPolicy
  - DerivedArtifactMeta, ProvenanceRecord, ConsentRecord
- Create Zod schemas for runtime validation
- Export from `src/lib/data-privacy/index.ts`

### Phase 2: Policy Service

- Create `src/lib/data-privacy/policies.ts`:
  - `getDataClass(recordType: string): DataClass`
  - `getVisibilityPolicy(level: VisibilityLevel): VisibilityPolicy`
  - `getAgentAccessPolicy(role: AgentRole): AgentAccessPolicy`
- Map existing schema (CustomBar, QuestPack, etc.) to data classes
- No DB changes yet; pure logic

### Phase 3: Visibility Enforcement

- Add `checkVisibility(record, viewerId, instanceId?): boolean` helper
- Use in API routes and server actions that return sensitive data
- Audit current visibility usage; align to new levels

### Phase 4: Provenance Helpers

- Add `recordProvenance(recordId, recordType, meta)` helper
- Extend `completionEffects` / `provenanceJson` patterns to use typed schema
- Ensure book analysis, feedback, exports record provenance

### Phase 5: Consent Store (optional for v0)

- Add `ConsentRecord` model to Prisma if scope includes consent UI
- Or defer to v1; document consent API contract only

### Phase 6: Agent Access Boundaries

- Define agent roles per feature (book_analysis, feedback_triage, etc.)
- Add `requireAgentAccess(role, dataClasses)` guard in server actions
- Log agent access for audit

## Dependencies

- No new external packages required for Phase 1–2
- Zod already in use for schemas

## Risks

- Over-engineering: Keep v0 minimal; policy service + types only. Defer consent UI.
- Schema churn: Prefer additive (new columns) over breaking renames.

## Success Criteria

- Types and policies are defined and exported
- At least one API route or action uses visibility check
- Spec is implementable incrementally
