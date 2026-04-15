# Custom Portal Onboarding API — Service Contracts v0

## Overview

The Custom Portal Onboarding Flow extends the existing Bruised Banana onboarding with invite-token-based entry points. Each portal instance uses a unique invite token to tailor the onboarding path. The flow produces a `campaignState`-compatible payload that feeds into `createCampaignPlayer` and `assignOrientationThreads`.

**Integration**: Reuses existing actor creation, quest assignment, and dashboard initialization. No divergence from Bruised Banana flow—portal is an alternative entry that outputs compatible state.

---

## Service Boundaries

### 1. Validate Invite Token

**Contract**: `validateInviteToken(token: string) => Promise<{ valid: true; invite: InviteToken } | { valid: false; error: string }>`

**Behavior**:
- Returns invite metadata if token exists, not expired, and active
- Used before rendering portal UI

### 2. Begin Onboarding Session

**Contract**: `beginPortalOnboarding(token: string) => Promise<{ success: true; sessionId: string } | { error: string }>`

**Behavior**:
- Validates token
- Creates or returns existing session (stored in cookie or server session)
- Session holds: token, currentScene, responses so far

**Route**: `POST /api/portal/[token]/begin` or Server Action `beginPortalOnboarding(token)`

### 3. Submit Onboarding Responses

**Contract**: `submitPortalResponses(token: string, responses: PortalResponses) => Promise<{ success: true } | { error: string }>`

**Payload**:
```ts
interface PortalResponses {
  archetype_signal?: string    // Agency style answer
  interest_domains?: string[] // Multi-select
  preferred_move_state?: 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'
  impact_stage?: string       // Impact distance answer
}
```

**Behavior**:
- Validates token
- Stores responses in session
- Can be submitted incrementally (per scene) or as batch

**Route**: `POST /api/portal/[token]/responses` or Server Action

### 4. Create Actor from Portal

**Contract**: `createActorFromPortal(token: string, identity: { contact: string; password: string }) => Promise<{ success: true; playerId: string; redirectUrl: string } | { error: string }>`

**Behavior**:
- Validates token and session responses
- Maps portal responses to campaignState:
  - archetype_signal → playbookId (via archetype mapping)
  - interest_domains → campaignDomainPreference
  - preferred_move_state → storyProgress.state.preferredMove
  - impact_stage → storyProgress.state.impactStage
- Calls createCampaignPlayer with derived campaignState
- Assigns orientation threads (existing flow)
- Returns redirect to dashboard

**Route**: Server Action (reuses createCampaignPlayer logic)

### 5. Generate Onboarding Quest Path (Optional)

**Contract**: `generatePortalQuestPath(token: string, actorId?: string) => Promise<{ success: true; questIds: string[] } | { error: string }>`

**Behavior**:
- Uses preferred_move_state + archetype_signal + interest_domains
- Pulls from Quest Template Library or starter quests
- Returns 3–4 quest IDs for assignment
- When actorId provided, assigns to player

**Note**: May be folded into createActorFromPortal; assignOrientationThreads already assigns orientation. This extends with personalized starter quests when available.

### 6. Create Shadow Agent (Optional, Future)

**Contract**: `createShadowAgent(actorId: string, portalResponses: PortalResponses) => Promise<{ success: true; agentId: string } | { error: string }>`

**Behavior**:
- Creates ShadowAgent record linked to actor
- Agent surfaces suggestions; does not act autonomously
- Triggered by: quest inactivity, unanswered invitations, high charge without action

**Route**: `POST /api/actors/[id]/shadow-agent` or Server Action

---

## Data Models

### InviteToken (New)

```prisma
model PortalInvite {
  id            String    @id @default(cuid())
  token         String    @unique
  campaignRef   String?   // e.g. "bruised-banana"; maps to Instance.campaignRef
  instanceId    String?
  inviterId     String?
  portalVariant String?   // e.g. "bruised-banana-portal", "generic"
  defaultPath   String?   // JSON: preferred path config
  expiresAt     DateTime?
  createdAt     DateTime  @default(now())

  instance Instance? @relation(fields: [instanceId], references: [id])
  inviter  Player?   @relation(fields: [inviterId], references: [id])
}
```

### PortalResponses (Session)

```ts
interface PortalResponses {
  archetype_signal?: string
  interest_domains?: string[]
  preferred_move_state?: 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'
  impact_stage?: string
}
```

### campaignState Mapping

| Portal Field | campaignState / storyProgress |
|--------------|------------------------------|
| archetype_signal | playbook (name) or playbookId |
| interest_domains | campaignDomainPreference (JSON array of allyship domain keys) |
| preferred_move_state | state.preferredMove |
| impact_stage | state.impactStage |

---

## Archetype Signal Mapping

| Agency Style Option | Playbook Name (canonical) |
|--------------------|---------------------------|
| Bring people together | Joyful Connector |
| Investigate deeper truth | Truth Seer |
| Take decisive action | Decisive Storm |
| Hold steady when chaotic | Still Point |
| Support others doing work | Devoted Guardian |
| Subtly influence outcomes | Subtle Influence |
| Take courageous risks | Bold Heart |
| Move through uncertainty | Danger Walker |

---

## Interest Domain → Allyship Domain Mapping

| Portal Category | Allyship Domain |
|-----------------|-----------------|
| Community building | SKILLFUL_ORGANIZING |
| Housing / economic justice | GATHERING_RESOURCES |
| Environment | GATHERING_RESOURCES |
| Creative culture | GATHERING_RESOURCES |
| Mutual aid | GATHERING_RESOURCES |
| Education | RAISE_AWARENESS |
| Political change | DIRECT_ACTION |
| Personal transformation | RAISE_AWARENESS |
| Friendship and relationships | SKILLFUL_ORGANIZING |
| Other | (first selected or default) |

---

## Route vs Action

| Endpoint | Surface | Rationale |
|----------|---------|-----------|
| beginPortalOnboarding | Server Action | Form/React flow |
| submitPortalResponses | Server Action | Per-scene submit |
| createActorFromPortal | Server Action | Extends createCampaignPlayer |
| validateInviteToken | Server Action | Called from page load |

**HTTP routes** optional for external consumers (e.g. mobile apps); primary flow uses Server Actions.
