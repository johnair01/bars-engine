# BARS Engine API --- Campaign Drafts Full Spec (v2)

## Core Principle

A campaign draft is a **braided design object** combining: 1) Player
narrative arc (inner development) 2) Campaign objective (outer
organizing need)

------------------------------------------------------------------------

## Goals

Enable GPT + App to: - Ingest BARs - Analyze (type, polarity, WAVE) -
Match to quests - Cluster into arcs - Generate campaign drafts -
Persist + edit drafts - Support human review

------------------------------------------------------------------------

## Architecture Layers

1.  Registry --- BARs + analysis
2.  Routing --- BAR ↔ Quest links
3.  Composition --- Campaign drafts, arcs
4.  Runtime --- GM moves, execution

------------------------------------------------------------------------

## Data Models

### BarRegistryRecord

-   id
-   bar
-   analysis { type, wavePhase, polarity, confidence, notes }
-   source, sourceType
-   createdBy, createdByRef
-   analysisVersion, matcherVersion
-   metadata
-   createdAt, updatedAt

------------------------------------------------------------------------

### BarQuestLink

-   id
-   barId
-   questId
-   matchType (primary\|secondary\|suggested\|confirmed\|rejected)
-   confidence
-   reason
-   supportedBy { type, wavePhase, polarity, tags }
-   createdBy
-   status (proposed\|accepted\|rejected\|archived)
-   metadata
-   createdAt, updatedAt

------------------------------------------------------------------------

### CampaignDraft

-   id

-   title

-   description

-   summary

-   status (draft\|review\|approved\|archived)

-   createdBy, createdByRef

-   sourceBarIds

-   sourceLinkIds

-   questIds

-   playerArc { theme dominantWave targetShifts\[\] tensions\[\] }

-   campaignContext { objectiveType
    (gathering_resources\|direct_action\|raise_awareness\|skillful_organizing\|mixed)
    objectiveSummary urgency campaignNeeds\[\] successSignals\[\] }

-   structure { arcs\[\] recommendedOrder\[\] }

-   gmFaces\[\]

-   metadata

-   createdAt, updatedAt

------------------------------------------------------------------------

### CampaignArc

-   id

-   title

-   description

-   order

-   waveFocus

-   barIds\[\]

-   questIds\[\]

-   playerObjective

-   campaignObjective

-   organizingMode

-   entryCondition

-   completionSignal

-   deliverables\[\]

-   risks\[\]

------------------------------------------------------------------------

### CampaignQuestLink

-   id
-   campaignDraftId
-   questId
-   arcId
-   role (core\|supporting\|optional)
-   reason
-   supportsPlayerArc
-   supportsCampaignNeed
-   createdBy
-   status
-   createdAt, updatedAt

------------------------------------------------------------------------

### Quest

-   id
-   title
-   chapter
-   wavePhase
-   supportedBarTypes\[\]
-   supportedPolarities\[\]
-   tags\[\]
-   difficulty
-   partySize
-   prerequisites\[\]
-   artifactType
-   completionPrize
-   summary
-   instructions

------------------------------------------------------------------------

## API Endpoints

### BAR

POST /api/bar-registry/bulk POST /api/bar-registry/match-bulk

------------------------------------------------------------------------

### Quest

GET /api/quests GET /api/quests/:id

------------------------------------------------------------------------

### Links

POST /api/bar-quest-links PATCH /api/bar-quest-links/:id GET
/api/bar-quest-links

POST /api/campaign-quest-links PATCH /api/campaign-quest-links/:id GET
/api/campaign-quest-links

------------------------------------------------------------------------

### Clustering

POST /api/bar-registry/cluster

------------------------------------------------------------------------

### Campaign Drafts

POST /api/campaign-drafts PATCH /api/campaign-drafts/:id GET
/api/campaign-drafts GET /api/campaign-drafts/:id

POST /api/campaign-drafts/generate

------------------------------------------------------------------------

### Approval

POST /api/bar-quest-links/:id/accept POST
/api/bar-quest-links/:id/reject POST /api/campaign-drafts/:id/approve

------------------------------------------------------------------------

## Generate Campaign Draft

### Request

{ "barIds": \[\], "campaignContext": { "objectiveType":
"raise_awareness", "objectiveSummary": "","urgency": "medium",
"campaignNeeds": \[\] }, "options": { "maxArcs": 4 } }

### Response

-   title
-   playerArc
-   campaignContext
-   arcs
-   quest suggestions

------------------------------------------------------------------------

## UX Flows

### Upload + Match

Upload → Analyze → Store → Match → Review

### Campaign Drafting

Select BARs → Add context → Generate → Edit → Approve

------------------------------------------------------------------------

## Matching Logic

Evaluate: - BAR fit (type, polarity, wave) - Campaign fit (objective,
mode)

Return: - questId - confidence - reason - supportedBy

------------------------------------------------------------------------

## Key Rules

1.  Do NOT store quest matches only on BARs\
2.  Always separate:
    -   BAR
    -   Quest
    -   Link
    -   CampaignDraft\
3.  Campaign drafts must include BOTH:
    -   playerArc
    -   campaignContext

------------------------------------------------------------------------

## Cursor Task Prompt

Update backend to: - Add bulk BAR ingestion - Add BAR ↔ quest link
model - Add campaign drafts with arc structure - Add campaignContext +
playerArc - Add generation endpoint - Add clustering - Add approval
flows

Ensure: - backward compatibility - explanation fields - human + GPT
provenance
