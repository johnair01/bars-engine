# Event Campaign API — Service Contracts v1

## Overview

The Event Campaign Engine defines how campaigns (production organisms) produce events (artifacts). Campaigns use production grammars (Kotter or Epiphany Bridge) and event production quest threads. Events inherit domain and topic from campaigns; each event may specify a secondary domain for its operational function.

**Ontology**: Campaign = production organism. Event = produced artifact. Domain = canonical activity axis (fixed). Topic = subject matter (flexible).

---

## Canonical Domains

| Key | Label |
|-----|-------|
| `GATHERING_RESOURCES` | Gather Resources |
| `SKILLFUL_ORGANIZING` | Skillful Organizing |
| `RAISE_AWARENESS` | Raise Awareness |
| `DIRECT_ACTION` | Direct Action |

---

## Campaign Service Contracts

### 1. Create Campaign

**Contract**: `createCampaign(data: CreateCampaignInput) => Promise<{ success: true; campaignId: string } | { error: string }>`

**Input**:
```ts
interface CreateCampaignInput {
  campaignContext: string      // e.g. Bruised Banana Residency
  topic: string               // e.g. Emotional First Aid
  primaryDomain: string       // GATHERING_RESOURCES | SKILLFUL_ORGANIZING | RAISE_AWARENESS | DIRECT_ACTION
  productionGrammar: 'kotter' | 'epiphany_bridge'
  campaignType?: string       // default: event_production
  hostActorIds?: string[]     // Player ids
  targetArchetypes?: string[]
  targetMoves?: string[]      // wakeUp | cleanUp | growUp | showUp
  developmentalLens?: string
  instanceId?: string
}
```

**Behavior**:
- Validates `primaryDomain` against canonical four
- Validates `productionGrammar`
- Creates EventCampaign record
- Returns campaignId

**Route**: Server Action `createCampaign`

---

### 2. Get Campaign

**Contract**: `getCampaign(id: string) => Promise<{ success: true; campaign: EventCampaign } | { error: string }>`

**Behavior**:
- Fetches campaign with relations (events, productionThread)
- Returns 404 if not found

**Route**: Server Action `getCampaign`

---

### 3. Instantiate Event Production Quest Thread

**Contract**: `instantiateEventProductionThread(campaignId: string) => Promise<{ success: true; threadId: string } | { error: string }>`

**Behavior**:
- Creates QuestThread from event production template
- Links thread to campaign
- Template stages: Clarify purpose, Choose format, Choose date/time, Choose location, Invite collaborators, Publish BARs, Handle logistics, Confirm attendance, Host event, Capture outcomes, Archive
- Returns threadId

**Route**: Server Action `instantiateEventProductionThread`

---

### 4. Advance Campaign Milestone

**Contract**: `advanceCampaignMilestone(campaignId: string, stage: string) => Promise<{ success: true } | { error: string }>`

**Behavior**:
- Updates campaign status or grammar stage
- Validates stage against production grammar (Kotter or Epiphany Bridge)
- May trigger readiness check

**Route**: Server Action `advanceCampaignMilestone`

---

### 5. List Campaign Events

**Contract**: `listCampaignEvents(campaignId: string) => Promise<{ success: true; events: EventArtifact[] } | { error: string }>`

**Behavior**:
- Returns EventArtifact records where linkedCampaignId = campaignId

**Route**: Server Action `listCampaignEvents`

---

## Event Service Contracts

### 6. Create Event

**Contract**: `createEvent(data: CreateEventInput) => Promise<{ success: true; eventId: string } | { error: string }>`

**Input**:
```ts
interface CreateEventInput {
  linkedCampaignId: string
  title: string
  description: string
  eventType: string  // workshop | meeting | fundraiser | dance | onboarding_session | discussion | training | ceremony | quest_action | gathering
  secondaryDomain?: string   // optional; inherits primary from campaign
  targetArchetypes?: string[]
  targetMoves?: string[]
  developmentalLens?: string
  locationType: string       // in_person | virtual | hybrid | asynchronous_recording
  locationDetails?: string
  startTime?: Date
  endTime?: Date
  timezone?: string
  visibility?: string        // private | campaign_visible | public
  createdByActorId: string
}
```

**Behavior**:
- Fetches campaign; inherits topic, campaignContext, primaryDomain
- Validates secondaryDomain if provided
- Creates EventArtifact
- Updates campaign linkedEventIds

**Route**: Server Action `createEvent`

---

### 7. Get Event

**Contract**: `getEvent(id: string) => Promise<{ success: true; event: EventArtifact } | { error: string }>`

**Behavior**:
- Fetches event with relations (participants, invites, campaign)

**Route**: Server Action `getEvent`

---

### 8. List Events

**Contract**: `listEvents(filters?: ListEventsFilters) => Promise<{ success: true; events: EventArtifact[] } | { error: string }>`

**Input**:
```ts
interface ListEventsFilters {
  campaignId?: string
  status?: string
  startAfter?: Date
  endBefore?: Date
  primaryDomain?: string
}
```

**Route**: Server Action `listEvents`

---

### 9. Invite to Event

**Contract**: `inviteToEvent(eventId: string, actorIds: string[], invitedByActorId: string, source?: string) => Promise<{ success: true } | { error: string }>`

**Behavior**:
- Creates EventInvite for each actorId
- inviteStatus: pending
- inviteSource: campaign_broadcast | direct_actor | quest_bar | public_discovery | organizer_admin

**Route**: Server Action `inviteToEvent`

---

### 10. Join Event (RSVP)

**Contract**: `joinEvent(eventId: string, actorId: string, state: 'RSVP_yes' | 'declined') => Promise<{ success: true } | { error: string }>`

**Behavior**:
- Creates or updates EventParticipant
- participantState: RSVP_yes or declined
- If invite exists, updates inviteStatus

**Route**: Server Action `joinEvent`

---

### 11. Calendar Export

**Contract**: `getEventCalendarExport(eventId: string) => Promise<{ success: true; ics: string } | { error: string }>`

**Behavior**:
- Generates .ics content for event
- Includes: title, description, start, end, location, timezone

**Route**: `GET /api/events/[id]/calendar` — returns .ics file (Content-Type: text/calendar)

---

### 12. Attach Recording

**Contract**: `attachRecording(eventId: string, url: string) => Promise<{ success: true } | { error: string }>`

**Behavior**:
- Sets EventArtifact.recordingUrl
- May update status to recorded

**Route**: Server Action `attachRecording`

---

### 13. Complete Event

**Contract**: `completeEvent(eventId: string) => Promise<{ success: true } | { error: string }>`

**Behavior**:
- Sets EventArtifact.status to completed
- May spawn post-event BARs or quests (future)

**Route**: Server Action `completeEvent`

---

## Readiness and Emission

### 14. Check Campaign Readiness

**Contract**: `checkCampaignReadiness(campaignId: string) => Promise<{ ready: boolean; conditions: ReadinessConditions }>`

**ReadinessConditions** (examples):
- dateTimeChosen: boolean
- locationChosen: boolean
- hostAssigned: boolean
- minMilestonesCompleted: boolean

**Route**: Server Action (internal or called before emit)

---

### 15. Emit Event from Campaign

**Contract**: `emitEventFromCampaign(campaignId: string, eventData: Partial<CreateEventInput>) => Promise<{ success: true; eventId: string } | { error: string }>`

**Behavior**:
- Calls checkCampaignReadiness
- If not ready, returns error
- Creates EventArtifact with inherited fields + eventData
- Updates campaign linkedEventIds

**Route**: Server Action `emitEventFromCampaign`

---

## Data Types

### EventCampaign

```ts
interface EventCampaign {
  id: string
  campaignContext: string
  topic: string
  primaryDomain: string
  productionGrammar: string
  campaignType: string
  hostActorIds: string[]
  targetArchetypes: string[]
  targetMoves: string[]
  developmentalLens?: string
  status: string
  linkedEventIds: string[]
  instanceId?: string
  createdAt: Date
  updatedAt: Date
}
```

### EventArtifact

```ts
interface EventArtifact {
  id: string
  linkedCampaignId: string
  title: string
  description: string
  eventType: string
  topic: string
  campaignContext: string
  primaryDomain: string
  secondaryDomain?: string
  targetArchetypes: string[]
  targetMoves: string[]
  developmentalLens?: string
  locationType: string
  locationDetails?: string
  startTime?: Date
  endTime?: Date
  timezone?: string
  visibility: string
  status: string
  recordingUrl?: string
  createdByActorId: string
  createdAt: Date
  updatedAt: Date
}
```

---

## Integration Points

- **QuestThread**: Event production thread is a QuestThread; links to EventCampaign
- **CustomBar**: Awareness BARs, invitation BARs, post-event BARs reference campaign/event
- **Instance**: EventCampaign may link to Instance for fundraiser/event context
- **Player**: EventParticipant, EventInvite reference Player
