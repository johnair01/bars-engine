# Spec: Creator Milestone Interview

## Purpose

A campaign creator completes a structured step-wizard interview gated by their campaign archetype. Completing the interview seeds ≥1 BAR onto the campaign and persists a `CampaignMilestone` record. The wizard mirrors the 3-2-1 UX rhythm: one question per step, progress indicator, back navigation. Retaking layers additional BARs without wiping prior seeds.

**Problem**: Campaign creators have no structured pathway to generate meaningful BARs from their own goals and campaign archetype. The milestone interview closes the gap between "campaign exists" and "campaign has seeded work."

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Generator | Rules-based/deterministic for MVP; AI personalization deferred to Phase 2 |
| Auth | Anonymous OK via `shareToken` (same pattern as `/character/[shareToken]`); account optional |
| Retake behavior | Additive — retaking layers additional BARs; no re-seed/wipe |
| Cardinality | One canonical interview per campaign for the creator; idempotent insert; multiple retakes stack |
| Question authoring | Campaign-archetype level — one template per archetype type, shared across all campaigns of that type |
| Scope | Phase 1 = creator interview only. Supporter sub-campaign forking = Phase 2 |
| Role selection | Creator role adds archetype template structures; future: supporter/target roles seed different BAR types |

## Conceptual Model

| Dimension | Value |
|-----------|-------|
| **WHO** | Campaign creator (owner/admin) |
| **WHAT** | Structured interview → BAR seeds (`seeded_campaign_bar`) + `CampaignMilestone` record |
| **WHERE** | Campaign hub (`/campaign/[campaignRef]/interview`) |
| **Energy** | Interview completion = campaign activation energy; each BAR seed = a planted intention |
| **Personal throughput** | Show Up — creator declares their campaign's work into the system |

## API Contracts (API-First)

### `getMilestoneInterviewTemplate`

**Input**: `{ campaignArchetype: string }`
**Output**: `MilestoneInterviewTemplate | null`

```ts
function getMilestoneInterviewTemplate(
  input: { campaignArchetype: string }
): Promise<MilestoneInterviewTemplate | null>

type MilestoneInterviewTemplate = {
  id: string
  archetypeKey: string
  questions: InterviewQuestion[]
  status: 'draft' | 'active'
}

type InterviewQuestion = {
  id: string
  text: string
  type: 'text' | 'select'
  options?: string[]  // for select type
  barHint?: string    // influences which BAR type is seeded
}
```

### `createMilestoneInterview`

**Input**: `{ campaignRef: string; answers: { questionId: string; answer: string }[] }`
**Output**: `{ milestone: CampaignMilestone; seededBars: { id: string; title: string }[] }`

```ts
function createMilestoneInterview(
  input: { campaignRef: string; answers: InterviewAnswer[] }
): Promise<{ milestone: CampaignMilestone; seededBars: SeededBar[] }>
```

- **Server Action** (`'use server'`): form submission from wizard

### `retakeMilestoneInterview`

**Input**: `{ campaignRef: string; answers: InterviewAnswer[] }`
**Output**: `{ seededBars: SeededBar[] }` — stacks new BARs; does not alter prior `CampaignMilestone`

### `getMilestoneInterviewTemplates` (admin)

**Input**: none
**Output**: `MilestoneInterviewTemplate[]`

### `upsertMilestoneInterviewTemplate` (admin)

**Input**: `{ archetypeKey: string; questions: InterviewQuestion[]; status: 'draft' | 'active' }`
**Output**: `{ template: MilestoneInterviewTemplate }`

## User Stories

### P1: Creator completes interview and sees seeded BARs

**As a campaign creator**, I want to answer a short structured interview about my campaign goals, so my intentions become BARs that players can act on.

**Acceptance**: Wizard loads at `/campaign/[campaignRef]/interview` with correct archetype questions. On completion, ≥1 BAR is seeded. Completion screen shows seeded BARs + "Continue to campaign hub" CTA.

### P1: Creator can retake interview

**As a campaign creator**, I want to retake the interview without losing my prior seeded BARs, so I can add more as my campaign evolves.

**Acceptance**: Prior BARs persist. New BARs are added. `CampaignMilestone` record is updated with latest `completedAt`.

### P2: GM authors question templates

**As a GM**, I want to configure interview questions for each campaign archetype, so every campaign of that type gets a relevant, custom question set.

**Acceptance**: Admin UI at `/admin/interview-templates` allows creating/editing templates per `archetypeKey`. Questions support `text` and `select` types. Publishing a template makes it active.

## Functional Requirements

### Phase 1: Schema + Migration

- **FR1**: `MilestoneInterviewTemplate` Prisma model: `id`, `archetypeKey`, `questions` (JSON), `status` (`draft|active`), `createdAt`, `updatedAt`
- **FR2**: `CampaignMilestone` Prisma model: `id`, `campaignRef`, `creatorId`, `completedAt`, `barIds` (JSON array), `interviewAnswers` (JSON), `retakeCount` (Int default 0)

### Phase 2: Server Actions

- **FR3**: `getMilestoneInterviewTemplate(campaignArchetype)` returns active template or null
- **FR4**: `createMilestoneInterview` seeds BARs via existing `CustomBar` creation pattern, creates `CampaignMilestone`, returns seeded bar IDs
- **FR5**: BAR generator is rules-based: each answer maps to a deterministic BAR type + title template; archetype key modulates title flavor
- **FR6**: `retakeMilestoneInterview` creates new BARs, increments `retakeCount`, updates `completedAt`; never deletes existing BARs

### Phase 3: Interview Wizard UI

- **FR7**: Wizard route at `/campaign/[campaignRef]/interview`; server component fetches template and renders `InterviewWizard` client component
- **FR8**: One question per step with progress bar (`Step N of M`); supports back navigation
- **FR9**: Anonymous access via `shareToken` URL param; completion redirects to account creation if no session, preserving answers in session storage
- **FR10**: Completion screen shows: "Interview complete", list of seeded BARs with titles, "Continue to campaign hub →" CTA

### Phase 4: Admin Template Editor

- **FR11**: `/admin/interview-templates` lists all templates with archetype key + status
- **FR12**: `/admin/interview-templates/[archetypeKey]` edit view: add/remove/reorder questions; publish/unpublish toggle
- **FR13**: Select-type questions show an options editor (add/remove option strings)

## Non-Functional Requirements

- BAR generation is synchronous and deterministic (no AI calls in Phase 1)
- Wizard state preserved in React state; no intermediate DB writes until final submit
- `createMilestoneInterview` is idempotent: calling twice with same `campaignRef` for same creator adds to `CampaignMilestone.barIds` (upsert pattern)

## Persisted data & Prisma

| Check | Done |
|-------|------|
| `MilestoneInterviewTemplate` + `CampaignMilestone` in Design Decisions + API Contracts | |
| `tasks.md` includes `npx prisma migrate dev --name add_milestone_interview_schema` | |
| `npm run db:sync` after schema edit | |
| Human reviews migration SQL (additive) | |

**New models**:

```prisma
model MilestoneInterviewTemplate {
  id          String   @id @default(cuid())
  archetypeKey String  @unique
  questions   String   // JSON: InterviewQuestion[]
  status      String   @default("draft") // draft | active
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("milestone_interview_templates")
}

model CampaignMilestone {
  id              String   @id @default(cuid())
  campaignRef     String
  creatorId       String
  completedAt     DateTime @default(now())
  barIds          String   // JSON: string[]
  interviewAnswers String  // JSON: { questionId, answer }[]
  retakeCount     Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("campaign_milestones")
}
```

## Verification Quest

- **ID**: `cert-creator-milestone-interview-v1`
- **Steps**:
  1. Navigate to `/admin/interview-templates` — verify template list loads
  2. Create a template for `support_campaign` archetype with 3 questions
  3. Navigate to `/campaign/bruised-banana/interview` — verify wizard loads with correct questions
  4. Complete all steps — verify completion screen shows seeded BARs
  5. Navigate to campaign hub — verify seeded BARs appear
  6. Retake interview — verify new BARs added, existing BARs not removed
- **Narrative**: "Verify the milestone interview so campaign creators can seed meaningful work for Bruised Banana guests at the April residency."

## Dependencies

- **1.71 ECI** — [Emergent campaign from BAR interview](../emergent-campaign-bar-interview/spec.md): **interview-first** before a child `campaignRef` exists; admin **waters** → hub + spokes. **Phase 2** (supporter fork) and ECI should **converge** on shared template / wizard patterns where possible.
- `0.49.2 CHS` — campaign hub/spoke architecture (campaignRef pattern)
- `src/actions/campaign-bar.ts` — existing BAR creation patterns
- `src/lib/campaign-hub/types.ts` — `isCampaignHubStateV1` (campaign state)

## References

- Seed: [seed-creator-milestone-interview.yaml](../../../seed-creator-milestone-interview.yaml)
- CHS spec: [campaign-hub-spoke-landing-architecture/spec.md](../campaign-hub-spoke-landing-architecture/spec.md)
- 3-2-1 UX pattern: [321-shadow-process/spec.md](../321-shadow-process/spec.md)
- Prisma workflow: [prisma-migration-discipline skill](../../.agents/skills/prisma-migration-discipline/SKILL.md)
