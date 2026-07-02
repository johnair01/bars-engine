# Spec: Campaign Lead Forge

**Slug**: `campaign-lead-forge`
**Status**: Ready for implementation (MVP)
**Owner surface**: campaign owner / steward
**First campaign under test**: The Crossing (`the-crossing`) + Mastering the Game of Allyship

---

## Purpose

Give a campaign owner an admin tool to bring **new players** ("leads") into an Allyship
Campaign two ways:

1. **Manual** — the owner hand-forges a lead: who they are, how to reach them, the allyship
   domain, the concrete **actions** they should take, and the **starter quests** to assign. The
   tool produces a shareable, pre-tailored invite link.
2. **Automated** — a public, vibey choose-your-own-adventure funnel walks a prospective player
   through the **Superpower** discovery, an **Allyship Myths** reframe, and a **desired domain**
   pick, then **offers tailored quests + moves** and turns the result into a **"created
   character"** (onboarding *as* character creation). Each completed run lands as a lead on the
   owner's board.

Both modes feed **one owner board** so the owner sees every prospective player — hand-forged or
self-created — in a single follow-up queue with a shared status machine.

**Problem**: Wendell is testing an MVP with an inner circle and Launch Party RSVPs, funneling
social posts to interactive surfaces. The Crossing already has a steward board and a lead status
machine, but there is no way to (a) hand-author a tailored lead + starter quests, or (b) run a
self-serve onboarding funnel that composes the existing Superpower quiz + a new Myths step +
domain into a created character. This spec adds both, generalized past The Crossing.

**Practice**: Deftness Development — spec kit first, API-first (lead contract + actions before UI),
deterministic over AI (Superpower + Myths + domain are pure/offline; no model calls required).

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Generalization** | Build a reusable **Campaign Leads** console keyed by `campaignRef`; wire + test against `the-crossing` first. Not hardcoded to The Crossing. |
| **Lead storage** | New unified `CampaignLead` model. Both manual and automated leads write here, so the owner board is a single query with one status machine. Optional FKs link to the existing `Invite` (manual) and `LatentAllyshipIntake` (automated) rather than duplicating their data. |
| **Status machine** | Mirror The Crossing's proven machine: `new → contacted → accepted → declined`, terminal `onboarded`. (Automated self-created leads start `new`; owner may fast-path.) |
| **Manual invite** | Reuse the existing `Invite` model (`preassignedRoleKey`, `starterQuestId`, `campaignId`, `invitationMessage`) + `randomBytes` token pattern from `campaign-crud.generateCampaignInviteLink`. The lead links to its `Invite`. |
| **Starter quests** | Reuse the `CustomBar type:'onboarding'/'quest'` pool + `PlayerQuest` assignment (as `starter-quests.ts` does). A lead carries an ordered list of assigned quest `CustomBar` ids; assignment to a real `Player` happens on accept/onboard. |
| **Automated persistence** | Reuse `LatentAllyshipIntake` for the CYOA path + superpower capture; the funnel additionally creates a `CampaignLead` row (source `automated`) so it appears on the board next to manual leads. |
| **Superpower step** | Reuse the mature `SuperpowerQuiz` / `resolveSuperpowerIntake` verbatim. Deterministic, no DB. |
| **Allyship Myths step** | **New, greenfield.** Deterministic content module (`src/lib/allyship-myths/`) — a small authored set of `{ id, myth, truth, reframe, domainHint? }`. Editable copy; no AI. |
| **Domain step** | Reuse `ALLYSHIP_DOMAINS` (the four allyship domains). |
| **Character creation** | The funnel's terminal step frames the captured result as a "created character" and hands off to the existing `/character/create` (or shows a claim CTA for anonymous runs). MVP: capture identity into the lead + `LatentAllyshipIntake`; deep-wire to `characterCreationPacket` is a follow-up. |
| **Auth** | Owner board + manual actions gated by a generalized `assertCampaignSteward(playerId, campaignRef)` (extracted from The Crossing's `assertSteward`). Automated funnel is public (no email gate), matching the Superpower quiz. |
| **Route shape** | Owner: `/campaign/[ref]/leads` (steward-gated; NOT `/admin/*`, which hard-gates global admins). Cold funnel: `/campaign/[ref]/begin`. Warm invite: `/invite/[token]/welcome`. `ref` = `campaignRef`. |
| **Two on-ramps** | **Cold** (`/begin`): a stranger from a social post discovers themselves → automated lead. **Warm** (`/invite/[token]/welcome`): the owner hand-picks a person and pre-loads their tasks; their link is a personalized orientation CYOA. Same destination — a created character with assigned starter quests. |
| **Assignment is real** | On accept, `createCharacter` calls `claimCampaignLeadForPlayer` → each matched starter quest becomes a `PlayerQuest`, and the lead is marked `onboarded`. (Previously `Invite.starterQuestId` was written but never read.) |

---

## Conceptual Model

**WHO**: Campaign Owner (Accountable), Lead (prospective player, may be anonymous).
**WHAT**: a Lead = a WHO + a WHERE (domain) + a set of aligned actions/starter quests + status.
**WHERE**: an Allyship Campaign (`campaignRef` → Instance/Campaign).
**Energy**: the automated funnel metabolizes a stranger's curiosity (social-post click) into a
created character with a next move — Wake Up → Show Up in one sitting.

```
                          ┌─────────────────────────────┐
 owner hand-forges  ─────▶│                             │──▶ Invite link (tailored)
   (manual)               │        CampaignLead         │
                          │  who · domain · actions ·   │
 stranger self-creates ──▶│  starter quests · status    │──▶ owner board / follow-up
   (automated funnel)     │                             │
                          └─────────────────────────────┘
   Superpower ─▶ Myths ─▶ Domain ─▶ Offered quests+moves ─▶ "Create character"
     (reuse)     (new)    (reuse)        (reuse pool)          (handoff)
```

---

## API Contracts (API-First)

All server actions (`'use server'`) return `{ ok: true, ... } | { ok: false, error }`.

### `createManualLead(input)` — owner authors a lead + tailored invite
```ts
interface CreateManualLeadInput {
  campaignRef: string
  name: string
  contact?: string          // phone / email / handle (freeform)
  channel?: string          // 'text' | 'email' | 'instagram' | 'signal' | ...
  domain?: AllyshipDomainKey
  notes?: string            // owner's private context
  actions?: string[]        // concrete moves the lead should take
  starterQuestIds?: string[]// CustomBar ids from the onboarding/quest pool
  roleKey?: string          // preassigned campaign role for the Invite
  message?: string          // personal invite message
}
function createManualLead(input): Promise<{ ok: true; leadId: string; inviteUrl: string } | { ok: false; error: string }>
```

### `submitAutomatedLead(input)` — funnel completion → lead
```ts
interface SubmitAutomatedLeadInput {
  campaignRef: string
  name?: string
  contact?: string
  superpower: Superpower
  superpowerOrientation: SuperpowerOrientation | null
  mythsSeen: string[]           // myth ids the player worked through
  domain: AllyshipDomainKey
  offeredQuestIds: string[]     // quests surfaced/accepted in the funnel
  clientSessionId?: string
  latentIntakeId?: string       // link to LatentAllyshipIntake if one was created
}
function submitAutomatedLead(input): Promise<{ ok: true; leadId: string } | { ok: false; error: string }>
```

### `listCampaignLeads(campaignRef)` — owner board
```ts
function listCampaignLeads(campaignRef): Promise<{ ok: true; leads: CampaignLeadRow[] } | { ok: false; error: string }>
```

### `transitionLead(leadId, toStatus)` — follow-up status change (steward-gated)
```ts
type LeadStatus = 'new' | 'contacted' | 'accepted' | 'declined' | 'onboarded'
function transitionLead(leadId, toStatus): Promise<{ ok: true } | { ok: false; error: string }>
```

- **Server Actions** for all of the above (form + `useTransition`).
- Auth: `createManualLead`, `listCampaignLeads`, `transitionLead` require
  `assertCampaignSteward`. `submitAutomatedLead` is public.

---

## User Stories

### P1: Manual lead + tailored starter quests (owner)
**As a** campaign owner, **I want** to fill out a lead's info, the actions they should take, and
the starter quests they get, **so that** I can hand-tailor an invitation for someone in my inner
circle and send them a link.
**Acceptance**: `/admin/campaigns/the-crossing/leads` has a "Forge a lead" form (name, contact,
domain, actions, starter-quest picker, message). Submitting creates a `CampaignLead` + an `Invite`
and returns a shareable link. The lead appears on the board as `new`.

### P2: Owner board / follow-up queue (owner)
**As a** campaign owner, **I want** one board listing every lead (manual + self-created) with
status, **so that** I can follow up without hunting.
**Acceptance**: board lists leads for the campaign, filterable by status; each row shows source,
domain, superpower (if any), and status controls (`new → contacted → accepted/declined →
onboarded`).

### P3: Automated onboarding funnel (prospective player)
**As a** person who clicked a social post, **I want** a vibey choose-your-own-adventure that shows
my superpower, reframes an allyship myth, lets me pick a domain, and offers me quests to take
action, **so that** I create a character and know my next move — no sign-up wall.
**Acceptance**: `/campaign/the-crossing/begin` runs intro → Superpower quiz → Myths → Domain →
offered quests/moves → "Create your character" handoff. Completion records a `CampaignLead`
(source `automated`) visible on the owner board.

### P4: Allyship Myths step (prospective player)
**As a** newcomer, **I want** a short myth-busting beat, **so that** I enter with a truer frame of
allyship before choosing my domain.
**Acceptance**: a deterministic set of ~5 myths (`myth → truth → reframe`) renders as CYOA cards;
the ids the player worked through are captured on the lead.

---

## Functional Requirements

### Phase 1 — Data + contracts
- **FR1**: Add `CampaignLead` model (see Persisted data) + migration.
- **FR2**: `src/lib/campaign-leads/` — types, status machine, `assertCampaignSteward(playerId, campaignRef)` generalized from The Crossing.
- **FR3**: `src/actions/campaign-leads.ts` — `createManualLead`, `submitAutomatedLead`, `listCampaignLeads`, `transitionLead`.

### Phase 2 — Owner console
- **FR4**: Route `/admin/campaigns/[ref]/leads` (steward-gated) — board + "Forge a lead" form.
- **FR5**: Starter-quest picker reads the onboarding/quest `CustomBar` pool (reuse `starter-quests` query shape).
- **FR6**: Manual submit creates `Invite` (token via `randomBytes`) + `CampaignLead`; returns link.
- **FR7**: Status transition controls (steward-gated) on each lead.

### Phase 3 — Automated funnel
- **FR8**: `src/lib/allyship-myths/` — deterministic myth content + selection helper.
- **FR9**: Route `/campaign/[ref]/begin` — client runner composing intro → `SuperpowerQuiz` (reuse) → Myths → Domain → offered quests → create-character handoff.
- **FR10**: On completion call `submitAutomatedLead`; optionally create `LatentAllyshipIntake` and link it.
- **FR11**: Offered quests derive from the chosen domain via the existing starter-quest pool.

### Phase 4 — Polish (backlog-eligible)
- **FR12**: Deep-wire create-character to `characterCreationPacket` / `/character/create` with prefilled superpower + domain.
- **FR13**: SMS/text delivery of the tailored invite (humane notifications) — backlog.
- **FR14**: Analytics: funnel step drop-off, source attribution from `?src=` social tags.

---

## Non-Functional Requirements

- **No email gate** on the automated funnel (parity with Superpower quiz); anonymous runs allowed via `clientSessionId`.
- **Deterministic**: Superpower, Myths, Domain, and quest offers require no AI and work offline.
- **Backward compatible**: The existing Crossing steward board keeps working; `CampaignLead` is additive.
- **UI_COVENANT**: use `cultivation-cards.css` + `card-tokens` for game aesthetic; Tailwind for layout only; element = color, no hardcoded hues.
- **Touch targets** ≥ 44px on funnel + board actions (mobile-first — social traffic is mobile).

---

## Persisted data & Prisma

| Check | Done |
|-------|------|
| Prisma model named in Design Decisions / Contracts (`CampaignLead`) | ✅ (below) |
| `tasks.md` includes migration (`npx prisma migrate dev --name add_campaign_lead`) + commit `prisma/migrations/…` with `schema.prisma` | ✅ |
| Verification: `npm run db:sync` after edit; `npm run check` | ✅ |
| Human glance at `migration.sql` (additive) | pending |

```prisma
model CampaignLead {
  id                 String   @id @default(cuid())
  campaignRef        String                                  // e.g. 'the-crossing'
  source             String   @default("manual")             // 'manual' | 'automated'
  status             String   @default("new")                // new|contacted|accepted|declined|onboarded
  name               String?
  contact            String?
  channel            String?
  domain             String?                                 // AllyshipDomainKey
  superpower         String?
  superpowerOrientation String?
  notes              String?                                 // owner-private
  actionsJson        String?                                 // JSON string[] of aligned actions
  starterQuestIdsJson String?                                // JSON string[] of CustomBar ids
  mythsSeenJson      String?                                 // JSON string[] of myth ids
  forgedByPlayerId   String?                                 // owner who created a manual lead
  claimedByPlayerId  String?                                 // player who claimed/became this lead
  inviteId           String?  @unique                        // manual → Invite
  latentIntakeId     String?  @unique                        // automated → LatentAllyshipIntake
  clientSessionId    String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  forgedBy   Player?               @relation("CampaignLeadForgedBy", fields: [forgedByPlayerId], references: [id])
  claimedBy  Player?               @relation("CampaignLeadClaimedBy", fields: [claimedByPlayerId], references: [id])
  invite     Invite?               @relation(fields: [inviteId], references: [id])
  latentIntake LatentAllyshipIntake? @relation(fields: [latentIntakeId], references: [id])

  @@index([campaignRef, status])
  @@index([campaignRef, createdAt])
  @@map("campaign_leads")
}
```
Back-relations added to `Player`, `Invite`, `LatentAllyshipIntake`.

---

## Verification Quest (UX)

- **ID**: `cert-campaign-lead-forge-v1`
- **Steps**:
  1. As owner, forge a manual lead for The Crossing with 2 actions + 1 starter quest → get a link.
  2. Confirm the lead shows on the board as `new`; move it `contacted`.
  3. In an incognito window, run `/campaign/the-crossing/begin` end to end.
  4. Confirm a new `automated` lead with the chosen superpower + domain appears on the board.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/)

---

## Dependencies

- The Crossing steward pattern — `src/actions/the-crossing-support.ts`, `src/lib/the-crossing-support-moves.ts`
- Superpower quiz — `src/components/superpowers/SuperpowerQuiz.tsx`, `src/lib/superpowers/`
- Allyship intake — `src/actions/allyship-intake.ts`, `LatentAllyshipIntake`
- Invites — `src/actions/campaign-crud.ts` (`generateCampaignInviteLink`), `Invite` model
- Starter quests — `src/lib/starter-quests.ts`
- Domains — `src/lib/allyship-domains.ts`
- Sibling: [allyship-campaign-admin](../allyship-campaign-admin/) (owner dashboard; complementary, not overlapping)

## References

- Prisma workflow: [prisma-migration-discipline skill](../../.agents/skills/prisma-migration-discipline/SKILL.md), [PRISMA_MIGRATE_STRATEGY.md](../../docs/PRISMA_MIGRATE_STRATEGY.md)
- UI: [UI_COVENANT.md](../../UI_COVENANT.md), `src/styles/cultivation-cards.css`, `src/lib/ui/card-tokens.ts`
