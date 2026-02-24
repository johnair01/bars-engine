# Spec: Admin Twine Adventure Builder

## Purpose
Provide a CMS interface within the Admin dashboard that empowers authorized staff to author, edit, and publish Twine-based choose-your-own-adventure narratives directly into the BARs Engine. These campaigns must dynamically interact with player state without requiring code deployments.

## Core Features
1. **Adventure Management**: CRUD operations for `Adventure` entities.
   - Title, Slug, Description.
   - Visibility controls (Draft, Public Onboarding, Private Quest).
2. **Passage Editor**: A visual or raw-text editor for `Passage` entities belonging to an Adventure.
   - Node ID, Text content, and Choices array.
   - Syntax support for embedding SugarCube-style macros (`<<set>>`, `<<if>>`).
3. **Macro Engine Integration**:
   - The engine must parse macro strings into JSON payloads/state updates securely on the server.
   - Support `<<set $variable = value>>`.
   - Support custom triggering macros like `<<complete_active_face>>` or `<<mint_vibeulons_campaign $amount>>`.
4. **Player Progress Tracking**:
   - `PlayerAdventureProgress` model to persist a given user's state within a campaign (useful for logging out/in or recovering state).

## Out of Scope (for v1)
- Complex graph visualization of Twine nodes (stick to list/form editing for v1, but allow importing JSON).
- Authoring custom macros dynamically (macros remain hardcoded functions in `CampaignReader`/server actions, but can be invoked via standard `<<macro>>` syntax from text).
