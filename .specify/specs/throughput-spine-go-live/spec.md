# Spec: Throughput Spine — Go-Live

## Purpose

Make the **personal throughput system walkable end-to-end and visibly connected to the collective
one**, so a person can travel a single coherent journey:

> **Capture a charge → seed it (quest / daemon / artifact) → tend it in the Vault → attach it to a
> campaign → see it advance a well-crafted milestone.**

Today almost every *part* of this spine exists, but it is **not walkable as one journey**: two
connective links are missing (an **explicit personal→collective attach** and **milestone
authoring**), the **seed** step is incoherent (artifact types incomplete, no customization), and the
two **frames** the journey lives in — the **Now** page and the **Vault** — are flagged for redesign.

**This spec's job is to *sequence and connect*, not re-spec the redesigns.** It is a consolidating
epic: it defines the **journey contract**, closes the connective gaps, and **delegates** the heavy
surface redesigns to their existing locked specs (see § Reconciled specs).

**Practice:** Deftness Development — spec kit first, API-first (contract before UI), deterministic
over AI. Most of this is **connective UX over existing models** — schema changes are minimal.

## Conceptual Model (game language)

The spine is the **BARs Engine move loop** made into a product journey:

| Move | Stage in the spine | Output BAR | Surface |
|------|--------------------|-----------|---------|
| **Wake Up** | Capture a charge | Awareness | `/` (Now) → `/capture` |
| **Open / Clean** | Receive + metabolize (321) | Experience / Insight | charge → 321 → BAR |
| **Grow Up** | Tend / develop the seed | Wisdom / Capacity | Vault (`/hand`) stewardship |
| **Show Up** | **Seed** an artifact (quest / daemon / artifact) | Artifact | `GrowFromBar` |
| **(collective)** | **Attach** to a campaign + advance a **milestone** | contribution | Campaign hub |

- **WHO** = Player (Nation × Archetype). **WHAT** = the BAR and what it becomes. **WHERE** = the
  allyship domain + the **campaign** it serves. **Energy** = the emotional charge that fuels it.
- **Personal → collective bridge** = the explicit act of declaring *"this work is for that campaign,"*
  which today happens only implicitly through the game loop.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Shape | A **consolidating epic** with a **journey contract** + 5 phases. Reconciles existing specs; does not duplicate them. |
| Connective-over-new | Build on existing models — `CustomBar` (`campaignRef`, `sourceBarId`, `seedMetabolization`), `CampaignMilestone` (`status`, `proposedByPlayerId`, approval fields), `ContributionAnnotation`/`ContributionRecord`, `Daemon`, `GrowthSceneArtifact`. **Minimal new schema.** |
| Two missing links | (1) **Attach-to-campaign** affordance (declare intent); (2) **Milestone authoring** (propose → craft → celebrate). These are the true go-live blockers. |
| Two frames | **Now rewrite** and **Vault redesign** are first-class but **delegated** to `home-vault-ia-redesign` + `now-event-vault-throughput-qol` + `vault-page-experience` (+ BRS); this spec sequences and acceptance-tests them as spine stages. |
| Seed MVP | Decide the MVP artifact set for **Show Up**: **Quest ✅, Daemon ✅** ship as-is; **Artifact** = the generic GrowthScene for v1; defer Story/Ritual/Plan/Gift/Deck Card/Contact to a roadmap (don't block go-live on them). |
| Walkability test | Success = a **single Verification Quest** can be completed that traverses the whole spine. |

## Reconciled specs (this epic sequences these; it does not re-spec them)

| Existing spec | Role in the spine | Status to drive |
|---------------|-------------------|-----------------|
| `now-event-vault-throughput-qol` | Now-page QoL (compass contrast, charge→quest archive, vault CTA) | finish/verify |
| `home-vault-ia-redesign` | The Vault/Hand IA overhaul (bounded Hand, capture-first home) | implement (locked, unbuilt) |
| `vault-page-experience` (+ `VAULT_ANALYSIS`, `VAULT_NESTED_ROOMS`) | Vault caps, compost, rooms | finish Phase B/C |
| `personal-ops-funnel` / BRS (BAR Stewardship Flow) | The "tend" + route-to-guide actions | build (missing) |
| `campaign-authoring-flow` (CAF) | Steward campaign authoring depth | defer (post-go-live) |
| `bruised-banana-milestone-throughput` (BBMT) | Milestone guidance (shipped) + authoring (missing) | extend with authoring |
| `spoke-move-seed-beds` (SMB) / `campaign-hub-spoke` (CHS) | The implicit bridge (spokes, contributions) | keep; make explicit |

## API Contracts (API-First) — the two missing links

### 1. Attach a BAR / quest to a campaign (the explicit bridge)

A Server Action that lets a player **declare** their work serves a campaign — writing the existing
`campaignRef` + a `ContributionAnnotation`/intent, so it shows up on the campaign hub.

```ts
// 'use server'
async function attachBarToCampaign(input: {
  barId: string
  campaignRef: string
  intentNote?: string        // "I'm offering this as collective wisdom for X"
}): Promise<{ success: true } | { error: string } | { needsLogin: true }>
// Sets CustomBar.campaignRef; records a contribution intent so the hub surfaces it.
// Idempotent; a player can re-target or detach.
async function detachBarFromCampaign(input: { barId: string }): Promise<...>
async function listAttachableCampaigns(): Promise<{ ref: string; name: string }[]>
```

### 2. Milestone authoring (craft + celebrate)

Server Actions over the existing `CampaignMilestone` model — propose, edit narrative, approve,
and define the celebration.

```ts
async function proposeMilestone(input: {
  campaignRef: string
  title: string
  description: string         // the "why this matters" narrative
  targetValue: number
  celebration?: string        // copy/ritual shown on reach
}): Promise<{ milestoneId: string } | { error: string }>
async function updateMilestoneCraft(input: { milestoneId: string; ...editableFields }): Promise<...>
async function approveMilestone(input: { milestoneId: string }): Promise<...>  // steward+
// Reaching a milestone (currentValue >= targetValue) emits a celebration event (narrative + reward).
```

> Route vs Action: both are **Server Actions** (forms + `useTransition`). No external/route surface.
> See deftness-development Route-vs-Action tree.

## User Stories

### P1: The walkable spine (the headline)
**As a player**, I can start from a charge and travel — capture → seed → tend → attach to a campaign
→ watch a milestone move — **without dead ends or guessing.**
**Acceptance:** the Verification Quest (§ below) can be completed start to finish.

### P2: Declare my work for a campaign
**As a player with a BAR or quest**, I can say *"this is for [campaign]"* and see it appear as a
contribution on that campaign's hub. **Acceptance:** `attachBarToCampaign` + a visible affordance on
the BAR/quest detail and in the Vault; the hub shows my contribution.

### P3: Craft a well-made milestone
**As a steward (or proposing player)**, I can author a milestone with a real *why-it-matters*
narrative and a celebration, not just a number. **Acceptance:** propose → craft → approve; reaching
it shows the celebration.

### P4: A legible Now page
**As a player landing on `/`**, I see **one clear next move** (the four-move compass, high-contrast)
and understand how my charge became a quest. **Acceptance:** per `now-event-vault-throughput-qol`
acceptance + a single primary CTA; charge→quest provenance is visible.

### P5: An ergonomic Vault
**As a player in the Vault**, I can sense what's alive, **tend** a seed (not just bulk-compost),
and the Hand/Vault model is visible. **Acceptance:** per `home-vault-ia-redesign` + BRS "tend" action.

### P6: A coherent seed step
**As a player on a BAR**, the **Show Up / seed** affordance clearly offers Quest / Daemon / Artifact
and lands me in the right place. **Acceptance:** `GrowFromBar` MVP set (quest, daemon, generic
artifact) with clear copy + post-seed routing.

## Functional Requirements

### Phase 0 — The journey contract (do first)
- **FR0**: Write the end-to-end **journey map** (states + transitions + surfaces) as the acceptance
  frame, and a **gap ledger** mapping each transition to its owning spec + status. (This makes the
  spine testable and the sequencing explicit.)

### Phase 1 — Seed coherence (`GrowFromBar`)
- **FR1**: Lock the MVP artifact set (Quest, Daemon, generic Artifact); make the affordance read as
  one "Show Up / seed this" move with clear copy + correct post-seed routing; defer extra artifact
  types to a roadmap note.

### Phase 2 — The explicit personal→collective bridge ← *highest-value missing link*
- **FR2**: `attachBarToCampaign` / `detachBarFromCampaign` / `listAttachableCampaigns` actions.
- **FR3**: Affordance on BAR + quest detail and in the Vault ("Offer to a campaign"); the campaign
  hub surfaces the contribution (reuse `ContributionAnnotation`/`ContributionRecord`).

### Phase 3 — Milestone authoring
- **FR4**: `proposeMilestone` / `updateMilestoneCraft` / `approveMilestone` over `CampaignMilestone`.
- **FR5**: Milestone craft UI (narrative + target + celebration); a **celebration** on reach
  (narrative beat + reward), extending BBMT.

### Phase 4 — Now page rewrite (delegate to existing specs)
- **FR6**: Land `now-event-vault-throughput-qol` to acceptance: high-contrast compass, **one** primary
  next-move CTA, visible charge→quest provenance, residency/events discoverability.

### Phase 5 — Vault redesign (delegate to existing specs)
- **FR7**: Implement `home-vault-ia-redesign` core (Hand/Vault legibility, naming) + BRS **tend**
  action + finish `vault-page-experience` caps/compost. Hard-compost modal for CYOA optional/v2.

## Non-Functional Requirements
- **Minimal schema churn** — prefer existing fields (`campaignRef`, `seedMetabolization`,
  `CampaignMilestone.*`). Any new field gets a committed migration (§ Persisted data).
- Deterministic on the spine path (no AI required to walk it).
- Mobile-first; honor `UI_COVENANT.md` (contrast, progressive disclosure).
- Backward compatible: existing capture/seed/hub flows keep working.

## Persisted data & Prisma (likely light — confirm during Phase 0)
Most actions write **existing** fields. Candidate **new** additions (only if needed):
- A `contributionIntent` flag/record if `ContributionAnnotation` can't express player-declared intent.
- `CampaignMilestone.celebration` (String?) + maybe `narrative` if `description` is insufficient.

| Check | Done |
|-------|------|
| Confirm in Phase 0 whether any new field is required (vs reuse) | |
| If new fields: `prisma migrate dev` + commit `prisma/migrations/…` with `schema.prisma` | |
| `npm run db:sync` + `npm run check` | |

## Scaling Checklist
| Touchpoint | Mitigation |
|------------|------------|
| Campaign hub contribution rollups | reuse existing `getMyContributions` aggregation; paginate |
| Milestone celebration events | deterministic; no AI; idempotent on reach |

## Verification Quest (required — the walkability test)
- **ID** `cert-throughput-spine-v1` — frame: Bruised Banana Fundraiser ("verify a person can carry a
  charge all the way to advancing the residency milestone").
- **Steps:** (1) capture a charge on `/`; (2) metabolize it (321) into a BAR; (3) **seed** it as a
  quest from `GrowFromBar`; (4) **attach** the quest to a campaign ("Offer to a campaign"); (5) open
  the campaign hub and confirm the contribution appears; (6) confirm a **milestone** reflects/advances;
  (7) (steward) confirm a milestone can be **authored** with narrative + celebration.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/).

## Dependencies / Reconciled specs
See § Reconciled specs. Built on: `CustomBar`, `CampaignMilestone`, `ContributionAnnotation`/
`ContributionRecord`, `Daemon`, `GrowthSceneArtifact`, `SpokeSession`/SMB, `GrowFromBar`,
`campaign-milestone-guidance`, `vault-*`.

## References
- Audit (this session): Now/capture, Vault/lifecycle, BAR→{quest,daemon,artifact}, campaign/milestone/bridge.
- Code: `src/actions/bars.ts` (`growQuestFromBar`/`growDaemonFromBar`/`growArtifactFromBar`),
  `src/components/bars/GrowFromBar.tsx`, `src/actions/campaign-contributions.ts`,
  `src/actions/campaign-milestone-guidance.ts`, `src/lib/spoke-move-beds.ts`, `src/app/hand/*`, `src/app/page.tsx`.
- Prisma workflow: [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md).
