# Spec: Event Page Campaign Editor

## Purpose

Enable admins to quickly update campaign copy on the Bruised Banana Residency event page (Wake Up, Show Up, theme, target description) so they can paste content from ChatGPT directly into the app before sending invitations. This unblocks the invitation-to-donate flow.

**Broader vision** (later phases): Instance/campaign owners edit their campaign; players edit own BARs before sending; after BARs are sent, recipients can add data (original kept) or pay vibeulon + move to change a BAR.

## Conceptual Model (Game Language)

- **WHERE**: The fundraiser instance (Bruised Banana) is the campaign context.
- **Wake Up**: "Learn the story" — editable narrative for awareness.
- **Show Up**: "Contribute to the campaign" — editable narrative for action.
- **Personal throughput**: Admin editing = preparing the collective for the 4 moves.

## User Stories

### P1: Edit campaign copy from the event page (high priority)
**As an admin**, I want an Edit button on the event page that opens a form/modal to update Wake Up, Show Up, theme, and target description, so I can paste from ChatGPT directly without leaving the page.

**Acceptance**: On `/event`, admins see an "Edit campaign" button. Clicking it opens a modal (or inline form) with:
- Wake Up content (main paragraph)
- Show Up content (main paragraph)
- Theme
- Target description

Save updates the active Instance. Changes appear immediately on refresh.

### P2: Edit campaign copy from Admin Instances
**As an admin**, I want the same fields editable in Admin → Instances, so I can edit from either place.

**Acceptance**: Admin Instances create/update form includes Wake Up and Show Up sections. Existing theme and target description remain. When editing an instance, all narrative fields are shown.

### P3: Edit button links to Admin as alternative
**As an admin**, I want the Edit button to optionally link to Admin Instances if I prefer the full form there.

**Acceptance**: Edit button or modal includes a "Edit in Admin" link to `/admin/instances` (or instance-specific edit).

## Functional Requirements

- **FR1**: Instance model MUST have `wakeUpContent` (String?) and `showUpContent` (String?) for the campaign narrative sections.
- **FR2**: Event page MUST render `instance.wakeUpContent` (fallback to current hardcoded text when null) and `instance.showUpContent` (fallback when null).
- **FR3**: Admin-only Edit button MUST appear on `/event` when the current player has admin role. Click opens modal with form for wakeUpContent, showUpContent, theme, targetDescription.
- **FR4**: Server action `updateInstanceCampaignCopy` MUST update Instance with the four fields. Admin check required.
- **FR5**: Admin Instances form MUST include wakeUpContent and showUpContent fields. upsertInstance MUST persist them.
- **FR6**: A verification quest `cert-event-campaign-editor-v1` MUST be seeded by `npm run seed:cert:cyoa`. It walks through editing campaign copy and confirming it on /event. Required for UI features per Spec Kit skill.

## Non-functional Requirements

- Access control: Global admin only (no instance ownership in v1).
- Default content: When wakeUpContent/showUpContent are null, use current hardcoded strings as fallback.
- No schema change: Add two optional string fields to Instance.

## Out of Scope (v1)

- Instance ownership (InstanceMembership.roleKey = 'owner').
- BAR editing (before/after sent; pay vibeulon + move to change). See backlog for future spec.
- Rich text / markdown; plain text for v1.

## Reference

- Event page: [src/app/event/page.tsx](../../src/app/event/page.tsx)
- Instance model: [prisma/schema.prisma](../../prisma/schema.prisma)
- Admin Instances: [src/app/admin/instances/page.tsx](../../src/app/admin/instances/page.tsx)
- Instance actions: [src/actions/instance.ts](../../src/actions/instance.ts)
