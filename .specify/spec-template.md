# Spec: [Feature Name]

## Purpose

[One to three sentences: what this feature does and why.]

**Problem** (optional): [What pain or gap this addresses.]

**Practice** (when persistence/UI/API): Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| [Key decision 1] | [Choice and rationale] |
| [Key decision 2] | [Choice and rationale] |

## Conceptual Model

[Diagram or table. Use game language: WHO, WHAT, WHERE, Energy, Personal throughput. See [conceptual-model.md](.specify/memory/conceptual-model.md).]

## API Contracts (API-First)

> **Required** for features with persistence, UI, or external surface. Define before Functional Requirements.

### [Action or Route Name]

**Input**: [Shape or type]  
**Output**: [Shape or type]

```ts
// Signature or example
function actionName(input: InputType): Promise<OutputType>
```

- **Route Handler** (`/api/*`): External consumers, webhooks → `NextResponse.json()`
- **Server Action** (`'use server'`): Form submissions, React `useTransition` → `{ success, error, data }`

See [deftness-development/reference.md](.agents/skills/deftness-development/reference.md) — Route vs Action Decision Tree.

## User Stories

### P1: [Title]

**As a [role]**, I want [goal], so [benefit].

**Acceptance**: [Concrete criteria.]

## Functional Requirements

### Phase 1: [Phase Name]

- **FR1**: [Requirement]
- **FR2**: [Requirement]

## Non-Functional Requirements

- [Scaling, perf, security, backward compatibility]

## Persisted data & Prisma (required when schema changes)

> **Process contract:** Shipping a schema change without a committed migration breaks deploys (`migrate deploy`) and causes production 500s. See [.agents/skills/prisma-migration-discipline/SKILL.md](../.agents/skills/prisma-migration-discipline/SKILL.md).

| Check | Done |
|-------|------|
| Prisma models/enums/fields named in **Design Decisions** or **API Contracts** | |
| **`tasks.md`** includes: create migration (`npx prisma migrate dev --name …`), commit `prisma/migrations/…` with `schema.prisma` | |
| **Verification**: `npm run db:sync` after schema edit (regenerates client); `npm run check` | |
| **Human** glanced at new `migration.sql` (additive vs destructive) | |

**Do not** rely on `db push` alone for changes that merge to main / deploy.

## Scaling Checklist (when AI, upload, filesystem)

| Touchpoint | Mitigation |
|------------|------------|
| Filesystem | Use Blob/S3; no `public/` writes in serverless |
| AI calls | Cache, env model override, feature flags |
| Request body | `serverActions.bodySizeLimit` for large payloads |
| Env | Document in spec; add to `docs/ENV_AND_VERCEL.md` |

See [deftness-development/reference.md](.agents/skills/deftness-development/reference.md).

## Verification Quest (required for UX features)

- **ID**: `cert-[feature]-v1`
- **Steps**: [List verification steps]
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [Other specs this depends on]

## References

- [Relevant code paths, docs]
- Prisma workflow: [prisma-migration-discipline skill](../.agents/skills/prisma-migration-discipline/SKILL.md), [fail-fix-workflow](../../.cursor/rules/fail-fix-workflow.mdc)
