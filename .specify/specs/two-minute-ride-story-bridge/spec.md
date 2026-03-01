# Spec: 2-Minute Ride — Story Bridge + UX Expansion

## Purpose

Bridge the game world (Heist, Conclave, vibeulons) to the real world (Bruised Banana Residency, fundraiser, party) so the 2-minute ride from invite to engaged player feels coherent. Expand CYOA UX to reduce abandonment and surface the vibeulon payoff.

**Extends**: [Lore Index + Event-Driven CYOA Onboarding](../lore-cyoa-onboarding/spec.md) (AG)

**Merges**: Campaign BB flow fix (Instance.campaignRef + default ref when missing)

## Conceptual Model (Game Language)

From [story_context.md](../../docs/handbook/world/story_context.md):

- **The Conclave IS the birthday party** — fictional layer maps to real party
- **Energy** = vibeulons = emotional energy that moves through the space
- **2-minute ride** = invite → event → CYOA → sign-up → dashboard (target: ~2 min to first quest)

## User Stories

### P1: Story bridge copy

**As a campaign organizer**, I want admin-editable copy that explicitly connects the game world to the real world, so users understand that the residency is their Conclave, the fundraiser is the heist, and their contribution powers the construct.

**Acceptance**: EventCampaignEditor can edit story bridge copy. BB_Intro or BB_ShowUp renders it. Default copy: "This residency is your Conclave; the fundraiser is the heist; your contribution powers the construct; vibeulons are the emotional energy that moves through this space."

### P2: Campaign ref default

**As a user**, I want the Dashboard "Begin the Journey" link to always show the Bruised Banana flow, so I don't land on the old Center_Witness flow when clicking from the app.

**Acceptance**: When user lands on `/campaign` without `ref`, use `instance.campaignRef` (default `bruised-banana` when null). Schema: `Instance.campaignRef` optional; campaign page reads ref from instance when searchParams.ref is absent.

### P3: 2-minute ride progress

**As a user**, I want to see how far I am in the CYOA flow, so I know how much is left and don't abandon.

**Acceptance**: CYOA shows progress indicator (e.g. "Step 3 of 8"). CampaignReader or node API returns step index; UI displays.

### P4: Vibeulon payoff preview

**As a user**, I want to see what I'll earn before signing up, so I'm motivated to complete the flow.

**Acceptance**: Before sign-up, BB_Moves_ShowUp or signup node includes copy such as "Complete this flow to earn 3 starter vibeulons."

### P5: Donation soft-link

**As a user**, I want the option to contribute money before playing, so I can support the campaign in the way that fits me.

**Acceptance**: BB_ShowUp node includes optional link to `/event/donate` when instance has donate URL configured.

### P6: Error recovery

**As a user**, I want to retry or continue later when the CYOA fetch fails, so I don't lose my progress.

**Acceptance**: CampaignReader handles error state with retry + "Continue later" (optional: save progress to localStorage).

## Functional Requirements

- **FR1**: Instance MAY have `campaignRef` (optional string; default `bruised-banana` when null).
- **FR2**: Campaign page MUST use `instance.campaignRef` when `searchParams.ref` is absent.
- **FR3**: Story bridge copy MUST be editable via EventCampaignEditor (use `wakeUpContent`, `showUpContent`, or new optional `storyBridgeCopy` field).
- **FR4**: Verification quest MUST be seeded for full 2-minute ride flow (`cert-two-minute-ride-v1`).

## Non-functional Requirements

- No breaking changes to existing campaign flow when `ref` is present in URL.
- Story bridge copy is optional; if empty, fall back to existing content.

## Verification Quest

- **ID**: `cert-two-minute-ride-v1`
- **Steps**: Verify story bridge copy visible; verify Dashboard → BB flow; verify progress indicator; verify vibeulon preview; verify donation link when configured; verify error recovery.

## Dependencies

- AG (Lore CYOA Onboarding) — done
- AA (Event Page Campaign Editor) — done
- bruised-banana-onboarding-flow Phase 2 — done

## Out of Scope (v1)

- localStorage resume for "Continue later" (defer if complex)
- Full localization of story bridge copy

## Reference

- Campaign page: [src/app/campaign/page.tsx](../../src/app/campaign/page.tsx)
- Adventures API: [src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)
- Instance model: [prisma/schema.prisma](../../prisma/schema.prisma)
- Bruised Banana onboarding: [bruised-banana-onboarding-flow](../bruised-banana-onboarding-flow/spec.md)
- Story context: [docs/handbook/world/story_context.md](../../docs/handbook/world/story_context.md)
