# Implementation Plan: Wake-Up Campaign Handoff

## Goal Description
The objective is to allow new users to play through the 5-Act CYOA Twine campaign before they have authenticated, and then seamlessly pass their narrative choices into the account creation process. This effectively makes the marketing funnel their true "first quest" in the game world.

## Required Features for Seamless Handoff

### 1. Unauthenticated Twine Player (`CampaignReader`)
Currently, `StoryReader` requires a `playerId` and calls server actions (`recordStoryChoice`) to save progress to the database. We need a new, client-side equivalent (e.g., `CampaignReader.tsx`) that:
- Reads the campaign Twine JSON.
- Tracks the player's current node and path history in React state or `localStorage`.
- Does not require a database connection or `playerId` to function, ensuring high availability for the landing page.

### 2. Campaign State Extraction
As the user progresses through the 5 Acts, the `CampaignReader` must aggregate key decisions. We need a clearly defined `CampaignState` object that stores:
- Chosen Hexagram flavors.
- Any decisions that dictate their starting Nation, Archetype, or Vibe.
- Earned artifacts (e.g., if they earned an optional Vibeulon mint).

### 3. Contextual Registration Node (The "Oath" & "Ask")
The final node of the campaign must render a custom signup interface. Instead of a generic text outcome, Act 5 will embed a specialized version of `GuidedAuthForm` (e.g., `CampaignAuthForm`).
- This form will capture Email/Password for signup.
- Crucially, it will inject the accumulated `CampaignState` as a hidden JSON payload into the form data.

### 4. Stateful Auth Action
We need an updated or new server action (e.g., `createCampaignPlayer`) that extends the standard account creation process:
- It creates the `Player` record.
- It intercepts the `CampaignState` payload.
- It seeds their account with the consequences of their campaign choices. Instead of bypassing onboarding, it *adds* to their starting state by granting them specific unlocked threads, bonus Vibeulons, or custom starting items that are waiting for them upon graduation from onboarding.

### 5. Seamless Redirection
Upon successful account creation, the user is authenticated and launched into the standard `/conclave/guided` onboarding flow. The handoff feels seamless because they transition from the public narrative directly into the private, personalized onboarding narrative, and when they finally reach the dashboard, they have more available threads/adventures than a standard player.

## Next Steps
If this architectural approach aligns with your vision for the handoff, we can move next to writing the V1 Twine draft or start building the `CampaignReader` component.
