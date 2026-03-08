# Spec: Campaign Entry UI

**Source**: Optional item from [onboarding-flow-completion](.specify/specs/onboarding-flow-completion/spec.md) AC #3.

## Purpose

Surface Nation, Archetype, and Intended Impact when a Bruised Banana player first lands on the dashboard after signup. Provide a "You've entered the Bruised Banana Campaign" moment with identity summary and starter quests before they dive into the flow.

**Problem**: After Bruised Banana signup, players land on the dashboard but may not see their identity (Nation, Archetype, lens/domain) or starter quests in a cohesive entry moment.

**Practice**: Deftness Development — extend existing models, no new tables beyond one boolean flag.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Format | Prominent dismissible banner (like RITUAL SUCCESS BANNER), not full-screen modal |
| Trigger | Player has bruised-banana-orientation-thread AND !hasSeenCampaignEntry |
| Dismissal | `hasSeenCampaignEntry` on Player; one-time show per player |
| Intended Impact | Lens (allyship/creative/strategic/community) or campaignDomainPreference → friendly labels via ALLYSHIP_DOMAINS |

## Conceptual Model

| WHO | WHAT | WHERE |
|-----|------|-------|
| Bruised Banana player | Sees Campaign Entry banner | Dashboard (`/`) |
| Player | Dismisses banner | Sets hasSeenCampaignEntry |
| System | Shows Nation, Archetype, Intended Impact, starter quests | Banner content |

## API Contracts

### dismissCampaignEntry (Server Action)

**Input**: `playerId?: string` (optional; defaults to current player)  
**Output**: `Promise<{ success: true } | { error: string }>`

- Updates `Player.hasSeenCampaignEntry = true`
- Calls `revalidatePath('/')`
- Used by CampaignEntryBanner on "Enter the Flow" click

## User Stories

### P1: Campaign Entry Moment

**As a** Bruised Banana player who just signed up, **I want** to see a clear "You've entered the Bruised Banana Campaign" screen with my Nation, Archetype, Intended Impact, and starter quests, **so** I understand my identity and next steps before diving in.

**Acceptance**: Banner appears on first dashboard visit when player has bruised-banana-orientation-thread; shows Nation, Archetype, Intended Impact (lens or domain labels), and starter quest titles; "Enter the Flow" dismisses and never shows again.

### P2: Dismiss and Continue

**As a** player who has seen the Campaign Entry, **I want** to dismiss it and continue to the dashboard, **so** I can start my first quest without being blocked.

**Acceptance**: Clicking "Enter the Flow" sets hasSeenCampaignEntry; banner does not reappear on subsequent visits.

## Functional Requirements

### FR1: Schema

- Add `hasSeenCampaignEntry Boolean @default(false)` to Player model.

### FR2: dismissCampaignEntry Server Action

- Accepts optional `playerId`; uses `getCurrentPlayer()` when omitted.
- Sets `Player.hasSeenCampaignEntry = true`.
- Returns `{ success: true }` or `{ error: string }`.
- Calls `revalidatePath('/')` on success.

### FR3: CampaignEntryBanner Component

- Client component with props: `{ nation, playbook, intendedImpact, starterQuests }`.
- Renders: headline "You've entered the Bruised Banana Campaign"; Nation and Archetype (with links); Intended Impact (friendly labels); starter quest list; "Enter the Flow" button.
- On "Enter the Flow": calls `dismissCampaignEntry`, then hides banner (or relies on revalidate).

### FR4: Home Page Integration

- Fetch: `hasSeenCampaignEntry`, ThreadProgress for `bruised-banana-orientation-thread` (include thread.quests.quest).
- Condition: `showCampaignEntry = hasBbThread && !hasSeenCampaignEntry`.
- When true: render CampaignEntryBanner above or near RITUAL SUCCESS BANNER.

### FR5: Intended Impact Labels

- Lens: `allyship` → "Allyship", `creative` → "Creative", `strategic` → "Strategic", `community` → "Community".
- Domain: Use `parseCampaignDomainPreference` + `ALLYSHIP_DOMAINS` for friendly labels (e.g. GATHERING_RESOURCES → "Gathering Resources").

## Non-Goals

- Campaign Entry for non–Bruised Banana flows
- Editable Campaign Entry content (static copy)
- Certification quest (optional future)

## Verification Quest (optional)

- **ID**: `cert-campaign-entry-ui-v1` (deferred)
- **Steps**: Sign up via Bruised Banana with lens → land on dashboard → see Campaign Entry → dismiss → verify no reappear.

## Dependencies

- [onboarding-flow-completion](.specify/specs/onboarding-flow-completion/spec.md) — bruised-banana-orientation-thread, starter quests
- [starter-quest-generator](.specify/specs/starter-quest-generator/spec.md) — Help the Bruised Banana thread

## References

- [src/app/page.tsx](../../src/app/page.tsx) — home/dashboard
- [src/lib/allyship-domains.ts](../../src/lib/allyship-domains.ts) — ALLYSHIP_DOMAINS, parseCampaignDomainPreference
- [src/components/onboarding/WelcomeScreen.tsx](../../src/components/onboarding/WelcomeScreen.tsx) — similar dismissible pattern
