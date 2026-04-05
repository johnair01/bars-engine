# System BAR Interaction Layer v0

## Overview

This subsystem defines how social interaction and lightweight collaboration are expressed through the existing **CustomBar** data model rather than through separate social object types. All interaction artifacts are represented as CustomBar records with structured `type` and `inputs` payloads.

**Core rule**: Do not introduce separate top-level models for quest invitations, help requests, or appreciation signals. Define these as CustomBar subtypes.

## Current Data Model (Bars-Engine)

The canonical artifact is **CustomBar** (from `prisma/schema.prisma`):

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| creatorId | String | Author (Player ID) |
| title | String | Required |
| description | String | Required |
| type | String | Default "vibe". See subtype taxonomy below. |
| visibility | String | "private" \| "public" |
| status | String | Default "active" |
| parentId | String? | Links to parent CustomBar (e.g. quest) |
| campaignRef | String? | Campaign slug (e.g. bruised-banana) |
| sourceBarId | String? | When quest generated from BAR |
| inputs | String | JSON string, default "[]" |
| storyContent | String? | Type-specific metadata |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Note**: There is no `campaign_id` or `actor_id`. Use `creatorId` and `campaignRef`. There is no `campaign_visible` enum; campaign visibility is achieved by `visibility: 'public'` + `campaignRef` set, with filtering applied at query time.

**Existing related models**:
- `BarShare` – barId, fromUserId, toUserId, note (for sharing between players)
- `GameboardAidOffer` – AID offers on gameboard slots (separate, quest-specific; not a CustomBar)
- `QuestProposal` – quest proposals linked to CustomBar via barId

---

## Part 1: BAR Type Expansion

### BAR Type Taxonomy

Extend `CustomBar.type` with these values (in addition to existing `bar`, `quest`, `vibe`, `insight`, `doc`, `inspiration`, `onboarding`):

| type | Purpose |
|------|---------|
| reflection | Personal reflection (private 3-2-1, shadow material) |
| impact | Impact signaling (BARs from quest completion) |
| quest_invitation | Invitation to join or support a quest |
| help_request | Structured request for support |
| appreciation | appreciation, witnessing, acknowledgment |
| coordination | Lightweight coordination signal |
| system_signal | System-generated signals |
| charge_capture | Felt charge → BAR (Charge Capture UX; private by default) |

### Base CustomBar Mapping

| Spec concept | Bars-engine field |
|--------------|-------------------|
| bar_id | `id` |
| bar_type | `type` |
| author_actor_id | `creatorId` |
| campaign_id | `campaignRef` |
| quest_id | `parentId` (when BAR is child of quest) |
| visibility | `visibility` |
| status | `status` |
| summary_text | `title` + `description` |
| payload | `inputs` (JSON) or `storyContent` |
| created_at | `createdAt` |
| updated_at | `updatedAt` |

**Universal fields**: id, creatorId, title, description, type, visibility, status, createdAt, updatedAt.

**Subtype-specific**: `inputs` (JSON payload), `storyContent` (metadata), `parentId`, `campaignRef` usage.

---

## Part 2: Interaction BAR Subtypes

### 1. Quest Invitation BAR

- **type**: `quest_invitation`
- **payload** (inputs JSON):
  ```json
  {
    "invitationRole": "collaborator | witness | accountability | cohost",
    "requestedSlots": 2,
    "responseOptions": ["join", "curious", "witness", "decline"]
  }
  ```
- **parentId**: Links to quest (CustomBar with type=quest)
- **visibility**: Default `public` when campaignRef set; `private` otherwise
- **status**: open → active → fulfilled | closed

### 2. Help Request BAR

- **type**: `help_request`
- **payload** (inputs JSON):
  ```json
  {
    "helpType": "strategy | accountability | logistics | witnessing | collaboration",
    "responseOptions": ["offer_help", "curious", "cant_help"]
  }
  ```
- **parentId**: Optional; may link to quest or another BAR
- **visibility**: Default `public` when campaignRef set
- **status**: open → active → fulfilled | closed

### 3. Appreciation BAR

- **type**: `appreciation`
- **payload** (inputs JSON):
  ```json
  {
    "appreciationType": "courage | care | clarity | support | creativity | completion",
    "targetType": "actor | quest | bar",
    "targetId": "string"
  }
  ```
- **parentId**: Optional; may link to target BAR
- **visibility**: `public` or `private` depending on target
- **status**: active (no workflow; one-shot)

### 4. Coordination BAR

- **type**: `coordination`
- **payload** (inputs JSON):
  ```json
  {
    "coordinationType": "micro_fundraiser | witness_call | shared_gathering | other",
    "deadline": "ISO8601"
  }
  ```
- **visibility**: Default `public` when campaignRef set
- **status**: open → active → fulfilled | closed

---

## Part 3: Visibility Rules

| Visibility | Meaning |
|------------|---------|
| private | Creator only |
| public | Visible to all authenticated players |

**Campaign visibility**: Filter by `visibility = 'public'` AND `campaignRef = campaignSlug`. No separate enum; implement as query filter.

**Defaults by subtype**:
- quest_invitation → public when campaignRef set
- help_request → public when campaignRef set
- appreciation → public when target is public
- coordination → public when campaignRef set

**Rules**:
- Private reflective BARs do not become interaction BARs unless explicitly shared.
- Derived or abstracted BARs may be shared after user intent or explicit workflow transition.
- System must not require raw reflective input to render public/campaign-visible social BARs.

---

## Part 4: Response Model

Responses to interaction BARs are modeled as **BarResponse** (new model) or **child CustomBars** of type `bar_response`.

**Recommended**: New `BarResponse` model for structured responses:

```prisma
model BarResponse {
  id         String   @id @default(cuid())
  barId      String
  responderId String
  responseType String  // join | curious | witness | offer_help | decline | cant_help | appreciate
  message    String?
  createdAt  DateTime @default(now())

  bar       CustomBar @relation(fields: [barId], references: [id], onDelete: Cascade)
  responder Player    @relation(fields: [responderId], references: [id], onDelete: Cascade)

  @@unique([barId, responderId])  // one response per player per BAR
  @@index([barId])
  @@index([responderId])
}
```

**Alternative**: Use child CustomBars with `parentId = barId`, `type = 'bar_response'`, `inputs` containing responseType and message. Keeps everything under CustomBar but adds query complexity.

---

## Part 5: BAR Workflow States

Extend `CustomBar.status` for interaction subtypes:

| Status | Meaning |
|--------|---------|
| open | Accepting responses |
| active | In progress (e.g. slots partially filled) |
| fulfilled | Slots filled or goal met |
| closed | Manually closed by author |
| archived | Old, no longer actionable |

**Existing**: `active`, `dormant` (used for quests) remain. Interaction BARs use `open` as initial state.

**Subtype-aware**: quest_invitation starts open; when one joins → active; when slots filled → fulfilled; author may close.

---

## Part 6: Privacy and Data Separation

| Category | Rules |
|----------|-------|
| Raw reflective/private | 3-2-1, shadow material remain private |
| Derived shareable | Abstracted or intentionally authored |
| Interaction BARs | Do not require exposure of private source material |

**Derived workflows**: Preserve privacy boundaries. Interaction BARs should be abstracted or intentionally authored, not auto-derived from raw private content.

---

## Part 7: Friendcraft Compatibility

Future Friendcraft mechanics should reuse this BAR infrastructure:

- Friend invitation quest → creates quest_invitation BAR
- Repair request → creates help_request BAR
- Gratitude quest → creates appreciation BAR
- Shared gathering plan → creates coordination BAR

---

## Implementation Paths

- **Server actions**: `src/actions/` (e.g. `create-bar.ts`, `bars.ts`)
- **API routes**: `src/app/api/` (existing patterns)
- **No `/src/features/`**: Use existing structure; services can live in `src/actions/` or `src/lib/`

---

## Constraints

- No separate invitation/help/appreciation top-level models
- No generic chat
- No open-ended social posting
- No broad social feed detached from quests and campaigns

**Favor**: One canonical artifact type (CustomBar), subtype schemas, explicit payloads, workflow states, API-first service boundaries.

---

## Testing Requirements

Tests should verify:

- BAR subtype creation works (quest_invitation, help_request, appreciation, coordination)
- Subtype payload validation works (inputs JSON schema per type)
- BAR visibility filtering works (private vs public, campaignRef filter)
- Structured responses work (BarResponse or equivalent)
- BAR state transitions work (open → active → fulfilled | closed)
- Dashboard feed queries return relevant interaction BARs
- Raw private reflective data is not required for interaction BAR rendering
