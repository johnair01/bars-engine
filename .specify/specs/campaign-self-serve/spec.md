# Spec: Campaign Self-Serve (CSS)

**ID:** CSS
**Status:** Spec kit — ready for implementation
**Seed:** `seed_86e9dac694a2` (ambiguity 0.17)
**Relates to:** [campaign-artifact-throughput](../campaign-artifact-throughput/spec.md) (CAT), [bruised-banana-residency-ship](../bruised-banana-residency-ship/spec.md)

## Purpose

Enable non-dev Steward+ users to create, visually skin, and run campaigns within bars-engine without touching code or the database. Three levels — L1 (wizard), L2 (skinning), L3 (narrative sovereignty) — designed together, with L1+L2 shipping first and L3 schema-ready but deferred.

**Problem:** Campaign creation currently requires DB access or admin UI deep knowledge. The Bruised Banana was hand-built. New campaign owners can't self-serve. This blocks the platform from growing beyond a single operator.

**Practice:** Deftness — template+customize over blank-canvas authoring. Configuration tool, not an authoring tool. Coherence and usability as top priorities.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Who creates** | Steward+ (owner/steward/admin). Not any player. |
| **Approval flow** | Campaigns start in `draft`. Admin approves → `active`. |
| **Instance:Campaign** | 1:many. Instance is the world/venue. Campaigns live inside it. |
| **BB backfill** | Bruised Banana becomes the reference implementation — represented through the self-serve system. |
| **First quest** | Template + customize. Pick from pre-built types, tweak copy/settings. |
| **Skinning** | Extends `getCampaignSkin()` — DB-driven instead of code-defined. |
| **L3 readiness** | Schema includes reserved fields (`narrativeConfig` JSON). No L3 UI in this phase. |

## Conceptual Model

| WHO | WHAT | WHERE |
|-----|------|-------|
| Steward+ | Creates campaign via wizard | `/campaign/create` |
| Admin | Reviews and approves drafts | `/admin/campaigns` |
| Campaign owner | Configures skin + quest templates | `/campaign/[ref]/settings` |
| Player | Discovers, joins, plays | `/campaign/[ref]` → invite → quest |

## Data Model

### New: `CampaignConfig` (extends existing Instance + EventCampaign)

Rather than a new top-level model, campaign self-serve data lives as structured fields on the existing `Instance` and `EventCampaign` models, plus a new `CampaignTheme` model:

```prisma
model CampaignTheme {
  id              String   @id @default(cuid())
  instanceId      String
  instance        Instance @relation(fields: [instanceId], references: [id])
  // L2: Visual skin
  bgGradient      String?  // CSS gradient string
  titleColor      String?  // hex
  accentPrimary   String?  // hex
  accentSecondary String?  // hex
  accentTertiary  String?  // hex
  fontDisplayKey  String?  // e.g. "press-start-2p"
  posterImageUrl  String?  // uploaded campaign poster
  // L3: Reserved
  narrativeConfig Json?    // Future: CYOA, bingo, NPC config
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@map("campaign_themes")
}
```

### Extended fields on `Instance`:

```prisma
// Add to existing Instance model:
selfServeStatus   String?   // draft | pending_approval | active | archived
selfServeCreatedBy String?  // playerId of creator
selfServeApprovedBy String? // playerId of approver
questTemplateConfig Json?   // Array of { templateType, overrides }
inviteConfig       Json?    // { method, capacity, messaging }
```

### Quest template types (enum, not Prisma — used in wizard):

```ts
type QuestTemplateType =
  | 'orientation_cyoa'
  | 'invite_bingo'
  | 'check_in'
  | '321_shadow'
  | 'custom_bar_quest'
```

## API Contracts

### `createCampaignDraft`
**Input:** `{ instanceId, name, description, domain, wakeUpContent, showUpContent }`
**Output:** `{ campaignRef: string, status: 'draft' }` | `{ error: string }`
**Permission:** Steward+ on the instance

### `configureCampaignQuest`
**Input:** `{ instanceId, templateType, overrides: { title?, description?, squares? } }`
**Output:** `{ questId: string }` | `{ error: string }`

### `configureCampaignTheme`
**Input:** `{ instanceId, bgGradient?, titleColor?, accentPrimary?, posterImageUrl? }`
**Output:** `{ themeId: string }` | `{ error: string }`

### `submitCampaignForApproval`
**Input:** `{ instanceId }`
**Output:** `{ status: 'pending_approval' }` | `{ error: string }`

### `approveCampaign`
**Input:** `{ instanceId }`
**Output:** `{ status: 'active' }` | `{ error: string }`
**Permission:** Admin only

### `getCampaignSkinFromDb`
**Input:** `{ instanceId | campaignRef }`
**Output:** `CampaignSkin | null`
Extends existing `getCampaignSkin()` to check DB before falling back to code-defined skins.

## User Stories

### L1: Campaign Wizard
**As a** Steward, **I want** to create a campaign through a step wizard, **so that** I can run a campaign without developer help.

Wizard steps:
1. **Name & purpose** — campaign name, description, allyship domain
2. **Story** — Wake Up content, Show Up content
3. **First quest** — pick template, customize copy
4. **Invite setup** — invite method, capacity, welcome message
5. **Review & submit** — preview, submit for approval

### L2: Visual Skinning
**As a** campaign owner, **I want** to customize the visual appearance of my campaign page, **so that** it feels like my own.

Settings:
- Background color/gradient
- Accent colors (3 slots)
- Display font (from approved list)
- Poster/banner image upload
- Preview before saving

### L3: Narrative Sovereignty (deferred)
**As a** campaign owner, **I want** to author CYOA adventures, bingo grids, quest threads, and NPC encounters for my campaign, **so that** my campaign is a complete game-within-the-game.

Schema-ready but no UI in this phase.

## Verification Quest

- **ID:** `cert-campaign-self-serve-v1`
- **Steps:**
  1. Log in as Steward+
  2. Navigate to `/campaign/create`
  3. Complete wizard (name, story, quest template, invite)
  4. Submit for approval
  5. Log in as admin, approve
  6. Visit `/campaign/[ref]` — verify page renders with skin
  7. Share invite link
  8. New player follows invite → lands on campaign → sees first quest
  9. Verify BB is represented through the same system

## Dependencies

- Existing Instance + EventCampaign models
- `getCampaignSkin()` in `src/lib/ui/campaign-skin.ts`
- Quest template definitions (orientation, bingo, check-in, 321)
- Invite system (`src/actions/campaign-invitation.ts`)
- Admin role checks (`src/actions/admin.ts`)
