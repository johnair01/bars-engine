# Spec: Dashboard UI Vibe Cleanup

## Purpose

Simplify and clarify the dashboard and related UI for the current stage of app maturity. Remove unused or premature features, fix copy and flows, and streamline the player experience.

## User Stories

### Request from Library

- As a player, I want a quest that explains how to use Request from Library, so I understand librarians are interested in making info readily available.
- As a player, when I request something from the library and a DocQuest is spawned, I want it to auto-complete a wake up quest at stage 1 urgency for that DocQuest.

### Donation

- As a player, I want to see "Donate" (not "Sponsor") when contributing to the fundraiser.
- As an admin, I need to update Stripe, PayPal, Venmo, and Cash App links when players choose to donate.

### Dashboard Simplification

- As a player, I don't need to see recent vibeulon activity at this stage; that can be admin-only.
- As a player, I want active quests defaulting to closed; opening a quest gives me the ability to complete it.
- As a player, I don't need "your vision", approach, or kotter stage sections on active quests; I should still be able to delegate.
- As a player with more than 5 active quests, I want a link to a quest wallet with its own interface to organize them.
- As a player, I want one Create BAR button (the one with emoji), without "use a template" language.
- As a player, I don't need Special Moves or Elemental Moves on the dashboard (no features for them yet).
- As a player, I don't need Wake Up / Clean Up / Grow Up / Show Up buttons at the bottom—but I need orientation quests that explain these concepts and how they interface with quests.

### Content Removal / Hiding

- Deprecate the "Welcome to the Conclave" thread (campaign onboarding handles nation/archetype).
- Fix: Welcome to conclave page showing incorrectly for admin who already has nation and archetype.
- Hide "Build Your Character" ritual from players; keep admin tools.
- Remove "Rookie Essentials" (placeholder).
- Remove the Attunement button for Live Instance Bruised Banana Birthday (not used).
- Remove the BARs Wallet section from dashboard (empty); add a quest that guides people to the BARs wallet page instead.

### Emotional First Aid

- As a player, I want a quest thread that teaches how to use Emotional First Aid.
- As an admin, I need to be able to edit Emotional First Aid features.

## Functional Requirements

### FR1: Request from Library

- **FR1a**: Create or extend a quest that explains Request from Library; copy mentions librarians making info readily available.
- **FR1b**: When `submitLibraryRequest` returns `status: 'spawned'`, auto-complete a wake up quest at stage 1 urgency for the DocQuest (or equivalent completion effect).

### FR2: Recent Vibeulon Activity

- **FR2a**: Remove MovementFeed from player dashboard (page.tsx).
- **FR2b**: Keep MovementFeed in admin tools or wallet page (admin-only).

### FR3: Attunement Button

- **FR3a**: Remove AttuneButton from the Live Instance banner on dashboard.

### FR4: Donation

- **FR4a**: Change "Sponsor" button label to "Donate" (page.tsx, event page).
- **FR4b**: Admin can update stripeOneTimeUrl, venmoUrl, cashappUrl, paypalUrl via Admin Instances (already exists; user needs to populate).

### FR5: Welcome to Conclave

- **FR5a**: Deprecate/archive the "Welcome to the Conclave" orientation thread (or stop assigning it).
- **FR5b**: Fix conclave/onboarding page so admins with nation+archetype are not incorrectly shown onboarding.

### FR6: Build Your Character

- **FR6a**: Hide Build Your Character thread from player-facing Journeys; keep visible in admin onboarding tools.

### FR7: Rookie Essentials

- **FR7a**: Remove Rookie Essentials pack from seed/display.

### FR8: Active Quests

- **FR8a**: Default active quests to closed (collapsed) state.
- **FR8b**: Opening a quest reveals completion UI.
- **FR8c**: Remove "your vision", approach, kotter stage sections from active quest detail modal.
- **FR8d**: Keep delegate-to-player capability.
- **FR8e**: If player has >5 active quests, show link to quest wallet (dedicated page/interface).

### FR9: BARs Wallet Section

- **FR9a**: Remove BARs Wallet section from dashboard.
- **FR9b**: Add quest that guides players to the BARs wallet page (/bars or /wallet).

### FR10: Create BAR Buttons

- **FR10a**: Keep only the Create BAR button with emoji (📜); remove the other Create BAR / Create Quest / Quick Quest buttons or consolidate.
- **FR10b**: Remove "use a template" language from the kept button.

### FR11: Emotional First Aid

- **FR11a**: Create quest thread that teaches how to use Emotional First Aid.
- **FR11b**: Ensure Emotional First Aid features can be edited (admin).

### FR12: Move Buttons

- **FR12a**: Remove Wake Up, Clean Up, Grow Up, Show Up buttons from dashboard bottom (AlchemyCaster grid).
- **FR12b**: Create orientation quests that explain these concepts and how they interface with quests.

### FR13: Special / Elemental Moves

- **FR13a**: Remove Special Moves and Elemental Moves sections from dashboard entirely.

## Non-functional Requirements

- Changes are UI/UX only where possible; minimal schema changes.
- Admin tools preserved for Build Your Character, EFA editing.

## Out of Scope

- Full quest wallet interface design (link + placeholder acceptable for >5 quests).
- Stripe/PayPal/Venmo/CashApp link population (admin config; user does manually).

## Dependencies

- LibraryRequest, submitLibraryRequest, DocQuest (existing)
- Instance, donation URLs (existing)
- Orientation threads, assignOrientationThreads
- QuestDetailModal, StarterQuestBoard, page.tsx
