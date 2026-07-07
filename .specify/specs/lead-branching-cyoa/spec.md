# Spec + Feasibility: Lead Branching CYOA

**Slug**: `lead-branching-cyoa`
**Status**: Feasibility complete → **Recommended: build (low risk)**
**Parent**: [campaign-lead-forge](../campaign-lead-forge/) (extends the warm invite path)
**Decision owner**: Wendell

---

## Purpose

Turn the warm invitee's onboarding from a fixed linear sequence into a **true branching
choose-your-own-adventure** — choices change the path — that still runs **before the invitee has an
account** (anonymous), orients them to the system, shows the tasks the owner matched to them, and
ends in account creation with those quests assigned.

**Problem**: The v1 warm invite (`/invite/[token]/welcome`) is a 4-step machine
(`welcome → orient → help → claim`). It's warm and personalized but not interactive — the invitee
can't make choices that shape their orientation. Wendell asked whether real branching is worth it
for the launch test, and for a spec + feasibility before committing.

**Practice**: Deftness Development — feasibility before build; reuse the engine that already solves
the hard constraint (anonymous play) rather than retrofitting the one that doesn't.

---

## Feasibility (the reason this spec exists)

### The trap: the `Adventure`/`Passage` engine cannot serve anonymous invitees

The obvious candidate — the graph-based `Adventure`/`Passage` engine (`/adventure/[id]/play`) — is
the **wrong** engine here. Two confirmed, structural blockers:

1. **Hard auth gate.** `src/app/adventure/[id]/play/page.tsx` redirects to `/login` when
   `getCurrentPlayer()` is null — the adventure never loads for an anonymous user.
2. **Player-FK progress, no anonymous store.** `PlayerAdventureProgress` has a required `playerId`
   FK (`onDelete: Cascade`); `saveAdventureProgress`/`getAdventureProgress`
   (`src/actions/adventure-progress.ts`) both bail when there's no player. There is **no**
   `clientSessionId`/cookie/anonymous progress path anywhere in that engine.
3. **No per-person scoping.** `Adventure` has `status`/`visibility`/`campaignRef` but **no
   `createdById`, no `instanceId` FK, no target-person field** — it's a global, slug-addressed
   object. It can't be scoped to one invitee.

Forcing this engine to serve anonymous, per-person play ≈ **1.5–3 weeks, high risk**: relax the play
page, add a `clientSessionId`-keyed anonymous progress table + rewrite the progress actions, *and*
add per-lead scoping the model lacks — all on shared onboarding surfaces. **Rejected.**

### The fit: the repo already ships an anonymous branching engine

`EventInviteStory` + `EventInviteStoryReader` is the exact shape we need, already anonymous:

- **Renderer** `src/components/event-invite/EventInviteStoryReader.tsx` — client-side branching
  (choice → `goToPassage`, `goBack`, history). **No auth, no player FK.**
- **Format** `EventInviteStory = { start, passages: [{ id, text, choices: [{label, next}], ending? }] }`
  — validated by `parseEventInviteStory` (`src/lib/event-invite-story/schema.ts`): unique ids, every
  `choice.next` resolves, start exists, `ending` XOR `choices` (no dead ends).
- **Anonymous persistence** already exists — `submitAllyshipIntake`
  (`src/actions/allyship-intake.ts`) accepts a `clientSessionId` and a null player; the path is kept
  in `localStorage`. **No schema change needed** for mid-story or end-of-story persistence.
- **Content is deterministic** — stories come from JSON templates
  (`src/lib/event-invite-story/templates/*`, e.g. `guest-journey.ts`). No AI on the invitee path.

### What we already built that carries over unchanged

From `campaign-lead-forge`: the anonymous per-lead route `/invite/[token]/welcome`, the `CampaignLead`
model (goals/actions/quests/domain/superpower), prefill, the signup form, and
`claimCampaignLeadForPlayer` (assigns matched quests on account creation). The *ending* of the
branching story is already solved.

### Reusable validators
`parseEventInviteStory` (reachability + dangling + ending-XOR-choices) and
`validateQuestGraph` (`src/lib/modular-cyoa-graph/` — enforces ≥2-arm branches, unreachable-end).
**Gap:** neither detects cycles; add bounded cycle-detection (small) if we allow back-references.

### Verdict

> **Build it — by extending `campaign-lead-forge` + `EventInviteStory`, not by touching the
> `Adventure` engine. ~1 week, low risk.** The `Adventure` engine's only real advantages
> (DB-persisted graphs, quest-completion passages, admin authoring) aren't needed for a pre-account
> orientation and come bundled with the auth blocker.

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Engine** | Reuse `EventInviteStoryReader` + `EventInviteStory` JSON. Do **not** use `Adventure`/`Passage`. |
| **Story source** | A pure, deterministic builder `leadToBranchingStory(lead)` → `EventInviteStory`, validated by `parseEventInviteStory`. Optional per-domain / per-face templates. No AI on the invitee path. |
| **Branch axes** | Branch on what we already know or can ask cheaply: the invitee's felt **domain** pull, a **myth** they pick to wrestle with, and a "how do you like to help" beat that maps to the lead's **superpower** framing. Each arm converges on the same "here's your matched tasks → claim" ending. |
| **Ending** | Reuse the existing claim: the ending passage renders `signupSlot` (`InviteSignupForm`) → `createCharacter` → `claimCampaignLeadForPlayer`. Unchanged. |
| **Persistence** | Anonymous `clientSessionId` (localStorage) path capture, reusing the `submitAllyshipIntake` pattern; store the chosen path on the lead (or a linked `LatentAllyshipIntake`) so the owner sees how they moved through it. |
| **Six-face alignment** | The "how you help" branches surface quests authored in the Quest Studio (Phase 7 of the parent spec) — face opening move + superpower prompt. This is where deep alignment shows up to the invitee. |
| **Fallback** | If a lead has no linked story/goals, fall back to the v1 linear `LeadWelcomeCYOA`. Zero regression. |

---

## Conceptual Model

```
CampaignLead (goals · domain · superpower · matched quests · message)
        │  leadToBranchingStory(lead)  [pure, deterministic]
        ▼
EventInviteStory JSON  ──parseEventInviteStory──▶ validated graph
        │
        ▼
EventInviteStoryReader (anonymous, client-side branching)
   welcome ─▶ (branch: which pull?) ─▶ orient ─▶ (branch: which myth?) ─▶
   how-you-help (matched quests, superpower/face framed) ─▶ ENDING
        │
        ▼
signupSlot → createCharacter → claimCampaignLeadForPlayer (quests assigned)
```

---

## API Contracts

### `leadToBranchingStory(lead)` — pure builder
```ts
interface LeadStoryInput {
  campaignName: string
  inviteeName: string | null
  message: string | null
  domain: AllyshipDomainKey | null
  superpower: string | null
  actions: string[]
  questTitles: string[]
}
// Deterministic. Output validated by parseEventInviteStory before render.
function leadToBranchingStory(input: LeadStoryInput): EventInviteStory
```

- **Pure function**, no I/O — unit-testable, offline. Lives in
  `src/lib/campaign-leads/branching-story.ts`.

---

## User Stories

### P1: Branching orientation (invitee)
**As an** invited person, **I want** my orientation to respond to my choices, **so that** it feels
like an adventure made for me, not a slideshow.
**Acceptance**: at ≥2 points the invitee picks a path; different picks show different passages; all
paths reach the "matched tasks → claim" ending; works with no account.

### P2: Owner sees the path (owner)
**As a** campaign owner, **I want** to see which branches my invitee took, **so that** I learn what
resonates and can tune future invites.
**Acceptance**: the chosen path is captured anonymously and shown on the lead's detail page.

### P3: No regression
**As a** campaign owner, **I want** leads without a story to still work, **so that** nothing breaks.
**Acceptance**: a lead with no goals/story renders the v1 linear welcome.

---

## Functional Requirements

- **FR1**: `src/lib/campaign-leads/branching-story.ts` — `leadToBranchingStory` (pure) + per-domain/face templates; validated by `parseEventInviteStory`.
- **FR2**: Extend `EventInviteStoryReader` (or a thin wrapper) so a passage flagged as the claim/ending renders an injected `signupSlot` instead of the default ending CTA.
- **FR3**: `/invite/[token]/welcome` renders the branching story when the lead has goals/quests; else falls back to v1 `LeadWelcomeCYOA`.
- **FR4**: Anonymous path capture via `clientSessionId` (reuse `submitAllyshipIntake` pattern); persist onto the lead / linked intake.
- **FR5**: Surface the captured path on `/campaign/[ref]/leads/[leadId]` (parent Phase 6).
- **FR6** (optional): bounded cycle-detection added to graph validation if back-references are allowed.

## Non-Functional Requirements

- **Anonymous**: entire branching experience runs pre-account (parity with the cold funnel + EventInviteStory).
- **Deterministic**: no AI on the invitee path; story is a pure function of the lead.
- **No new required schema**: reuse `clientSessionId` localStorage; any persistence is additive/optional.
- **Zero regression**: linear fallback for story-less leads.
- **Mobile-first**, UI_COVENANT tokens (matches the existing welcome surface).

## Persisted data

No new **required** tables. Optional: store the chosen path on `CampaignLead` (e.g. reuse
`mythsSeenJson` + a new `pathJson`) or on a linked `LatentAllyshipIntake` (which already has
`pathJson`). Decide during build; both are additive.

---

## Rough plan & cost (recommended path)

| Step | Work | Cost |
|------|------|------|
| 1 | `leadToBranchingStory(lead)` pure builder + templates + tests | ~2–3 days |
| 2 | Reader renders `signupSlot` at the claim/ending node | ~1 day |
| 3 | Wire `/invite/[token]/welcome` to branch (with linear fallback) | ~1 day |
| 4 | Anonymous path capture + show on lead detail | ~0.5 day |
| 5 | Validation (reuse; add cycle check if needed) + verify claim assigns quests | ~0.5 day |
| | **Total** | **~1 week, low risk** |

Compare: retrofitting the `Adventure` engine for anonymous per-person play ≈ **1.5–3 weeks, high
risk**. Not recommended.

---

## Verification Quest

- **ID**: `cert-lead-branching-cyoa-v1`
- **Steps**: (1) forge a lead with goals + 2 quests; (2) open the welcome link incognito; (3) take
  path A, confirm distinct passages; (4) restart, take path B, confirm a different route to the same
  claim ending; (5) claim → confirm the 2 quests assigned as `PlayerQuest`; (6) owner sees the path
  on the lead detail page.

## Dependencies

- [campaign-lead-forge](../campaign-lead-forge/) — lead model, welcome route, claim, Quest Studio (Phase 7).
- `EventInviteStory` engine: `src/components/event-invite/EventInviteStoryReader.tsx`,
  `src/lib/event-invite-story/` (schema, templates), `src/actions/allyship-intake.ts` (anonymous persistence).
- Validators: `src/lib/event-invite-story/schema.ts`, `src/lib/modular-cyoa-graph/validateQuestGraph.ts`.

## References

- Rejected engine: `src/app/adventure/[id]/play/`, `src/actions/adventure-progress.ts`, `PlayerAdventureProgress` (auth-gated, player-FK, no per-person scope).
- Six-face + superpower alignment building blocks: `src/lib/gm-face-stage-moves.ts`, `src/lib/superpowers/matrix.ts`, `src/lib/allyship-myths/myths.ts`.
