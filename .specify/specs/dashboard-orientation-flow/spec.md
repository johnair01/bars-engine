# Spec: Dashboard-First Orientation Flow (Configurable Redirect)

## Purpose

Enable post-signup routing to the dashboard instead of conclave, with configurable redirect so instances can choose conclave (legacy Party) or dashboard (campaign model). Orientation quests are required for all users in campaign who have not finished; completing onboarding signals "in campaign." All campaigns have an onboarding quest (generated or admin-created). Bruised Banana Residency is the MVP prototype.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Post-signup redirect | Configurable via AppConfig: `postSignupRedirect` = `'conclave'` \| `'dashboard'`. Default `'dashboard'` for new campaign model. |
| Conclave/onboarding | Deprecated for new campaigns. Was onboarding for "Party" (a specific campaign). Kept for backward compatibility when `postSignupRedirect === 'conclave'`. |
| Campaign model | Each campaign (Instance) has an onboarding quest. Completing it signals "in campaign." Orientation quests required until finished. |
| Orientation quests | Nation + archetype gated. Game Master face style for generated quests. Hypothesis: done well = highest vibeulon-generating step for human players. |
| Deftness | Completing quests (effectiveness) remains highest leverage for all players, including agents. |

## Conceptual Model (Game Language)

- **WHO**: Nation, Archetype (Playbook), Game Master face — selected during CYOA onboarding
- **WHAT**: Orientation quests (nation/archetype gated), generated or admin-created
- **WHERE**: Campaign (Instance) — Bruised Banana Residency = MVP; future parties generate their own onboarding
- **Energy**: Vibeulons flow when orientation done well; deftness (quest completion) = highest leverage
- **Personal throughput**: 4 moves; orientation = Wake Up (where you are, what you're doing)

## User Stories

### P1: Configurable post-signup redirect

**As an instance admin**, I want to configure whether new signups land on conclave or dashboard, so I can use the legacy Party flow or the new campaign model.

**Acceptance**: AppConfig (or Instance) has `postSignupRedirect`. When `'dashboard'`, campaign signup redirects to `/?focusQuest=...` or `/`. When `'conclave'`, current behavior (redirect to `/conclave/onboarding`).

### P2: Dashboard-first for campaign signups

**As a new player** signing up via the CYOA onboarding flow, I want to land on the dashboard with orientation quests for my nation and archetype, so I know where I am and what I'm doing.

**Acceptance**: After createCampaignPlayer + assignOrientationThreads, redirect to dashboard (when config says dashboard). Dashboard shows ritual banner, orientation threads, quests in Game Master face style.

### P3: Orientation required in campaign

**As the system**, when a player is in campaign but has not completed the orientation quest, I require them to complete it before full access, so "in campaign" is signaled by onboarding completion.

**Acceptance**: Players without completed orientation see prominent ritual/onboarding entry; completion marks them as "in campaign."

## API Contracts

### getPostSignupRedirect

**Input**: None (reads AppConfig)  
**Output**: `'conclave' | 'dashboard'`

```ts
function getPostSignupRedirect(): Promise<'conclave' | 'dashboard'>
```

- Reads `AppConfig.features.postSignupRedirect` or new `AppConfig.postSignupRedirect` field.
- Default: `'dashboard'` when unset.

### Redirect logic (existing surfaces)

- **createCampaignPlayer** (campaign.ts): After signup, call `getPostSignupRedirect()`. If `'dashboard'`, redirect to `/?focusQuest={currentQuestId}` or `/`. If `'conclave'`, redirect to `/conclave/onboarding`.
- **createGuidedPlayer** (conclave.ts): Same.
- **CampaignAuthForm**: Use redirect from action result.
- **Login**: When `returnTo` is dashboard, respect it.

## Functional Requirements

### Phase 1: Configurable redirect

- **FR1**: Add `postSignupRedirect` to AppConfig (or `features` JSON). Values: `'conclave' | 'dashboard'`. Default `'dashboard'`.
- **FR2**: Implement `getPostSignupRedirect()` server action or helper.
- **FR3**: createCampaignPlayer and createGuidedPlayer use `getPostSignupRedirect()` to decide redirect target.
- **FR4**: When `'dashboard'`: redirect to `/?focusQuest={questId}` when orientation has current quest without Twine/Adventure; otherwise redirect to `/`.
- **FR5**: When `'conclave'`: keep current behavior (redirect to `/conclave/onboarding`).

### Phase 2: Dashboard orientation UX (existing, validate)

- **FR6**: Dashboard ritual banner and "Continue Ritual" MUST work when player lands with `focusQuest`.
- **FR7**: Orientation threads MUST be nation/archetype gated; assignOrientationThreads uses personalization from campaignState.
- **FR8**: Generated quests MUST use Game Master face style (existing quest grammar, FACE_META).

### Phase 3: Deprecation path

- **FR9**: Document conclave/onboarding as deprecated for new campaigns. Conclave remains for `postSignupRedirect === 'conclave'`.
- **FR10**: New instances/campaigns default to `postSignupRedirect === 'dashboard'`.

## Non-Functional Requirements

- No breaking changes for existing instances using conclave.
- Bruised Banana MVP uses dashboard-first flow.
- Verification quest: Sign up via CYOA → land on dashboard → see orientation quests → complete flow.

## Verification Quest

- **ID**: `cert-dashboard-orientation-flow-v1`
- **Steps**: (1) Sign up via campaign CYOA (ref=bruised-banana). (2) Confirm redirect to dashboard (not conclave). (3) Confirm orientation quests visible. (4) Complete first orientation quest. (5) Confirm ritual completion state.
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [bruised-banana-onboarding-flow](.specify/specs/bruised-banana-onboarding-flow/spec.md)
- [cyoa-onboarding-reveal](.specify/specs/cyoa-onboarding-reveal/spec.md)
- [onboarding-cyoa-generator](.specify/specs/onboarding-cyoa-generator/spec.md) (generated quests)
- [game-master-face-sentences](.specify/specs/game-master-face-sentences/spec.md) (style)

## References

- [src/app/campaign/actions/campaign.ts](src/app/campaign/actions/campaign.ts) — createCampaignPlayer
- [src/actions/conclave.ts](src/actions/conclave.ts) — createGuidedPlayer
- [src/app/conclave/onboarding/page.tsx](src/app/conclave/onboarding/page.tsx) — conclave controller (deprecated for new campaigns)
- [src/app/page.tsx](src/app/page.tsx) — dashboard
- [src/actions/quest-thread.ts](src/actions/quest-thread.ts) — assignOrientationThreads
