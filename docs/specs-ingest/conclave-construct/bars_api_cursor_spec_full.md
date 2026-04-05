# BARS Engine API Upgrade Spec (Cursor) --- FULL VERSION

## Goal

Update the BARS Engine API to support GPT-driven campaign and quest
drafting.

This enables the GPT to function as a **design console** that: - Ingests
BARs - Analyzes them - Matches them to quests - Clusters them into
arcs - Generates campaigns - Persists those drafts - Supports human
review and refinement

------------------------------------------------------------------------

## Product Intent

The GPT should be able to:

1.  Ingest BARs from uploads or manual input\
2.  Analyze BARs into:
    -   type
    -   polarity
    -   WAVE phase\
3.  Match BARs to quests from the library\
4.  Explain why a quest fits\
5.  Cluster BARs into meaningful arcs\
6.  Draft campaigns from those arcs\
7.  Persist drafts into the system\
8.  Allow human review + override

------------------------------------------------------------------------

## Current State

Available: - BAR registry create/list/get\
- BAR → quest matcher\
- GM move generation\
- quest resolution

Missing: - First-class BAR ↔ quest link model\
- Bulk operations\
- Queryable quest library\
- Campaign draft persistence\
- Clustering

------------------------------------------------------------------------

## Architecture Model

### Layer 1: Registry

-   BARs
-   analysis
-   provenance

### Layer 2: Routing

-   BAR ↔ quest links
-   confidence + reasoning
-   review state

### Layer 3: Composition

-   clusters
-   arcs
-   campaign drafts

### Layer 4: Runtime

-   GM moves
-   quest resolution

------------------------------------------------------------------------

## Data Models

### BarRegistryRecord

-   id
-   bar
-   analysis:
    -   type
    -   wavePhase
    -   polarity
    -   confidence
    -   notes
-   source
-   sourceType
-   createdBy
-   metadata
-   createdAt
-   updatedAt

------------------------------------------------------------------------

### BarQuestLink

-   id
-   barId
-   questId
-   matchType
-   confidence
-   reason
-   supportedBy:
    -   type
    -   wavePhase
    -   polarity
    -   tags
-   createdBy
-   status
-   metadata
-   createdAt
-   updatedAt

------------------------------------------------------------------------

### CampaignDraft

-   id
-   title
-   description
-   sourceBarIds
-   questIds
-   theme
-   dominantWave
-   structure:
    -   arcs:
        -   id
        -   title
        -   barIds
        -   questIds
        -   waveFocus
        -   order
-   gmFaces
-   status
-   createdBy
-   metadata
-   createdAt
-   updatedAt

------------------------------------------------------------------------

### Quest

-   id
-   title
-   chapter
-   wavePhase
-   supportedBarTypes
-   supportedPolarities
-   tags
-   difficulty
-   partySize
-   prerequisites
-   artifactType
-   completionPrize
-   summary
-   instructions

------------------------------------------------------------------------

## API Endpoints

### Bulk BAR Create

POST /api/bar-registry/bulk

### Bulk BAR → Quest Matching

POST /api/bar-registry/match-bulk

### Quest Query

GET /api/quests\
GET /api/quests/:id

### Bar-Quest Links

POST /api/bar-quest-links\
PATCH /api/bar-quest-links/:id\
GET /api/bar-quest-links

### Clustering

POST /api/bar-registry/cluster

### Campaign Drafts

POST /api/campaign-drafts\
PATCH /api/campaign-drafts/:id\
GET /api/campaign-drafts\
GET /api/campaign-drafts/:id

### Approval Actions

POST /api/bar-quest-links/:id/accept\
POST /api/bar-quest-links/:id/reject\
POST /api/campaign-drafts/:id/approve

------------------------------------------------------------------------

## Matching Contract

Each match must return: - questId - matchType - confidence - reason -
supportedBy

------------------------------------------------------------------------

## UX Flows

### Flow 1: Upload + Match

1.  Upload BARs\
2.  Analyze\
3.  Store\
4.  Match\
5.  Review

### Flow 2: Campaign Drafting

1.  Select BARs\
2.  Cluster\
3.  Generate draft\
4.  Save + edit\
5.  Approve

------------------------------------------------------------------------

## Implementation Priority

### Phase 1

-   Bulk BAR create\
-   Quest query endpoints\
-   Matching\
-   Link model

### Phase 2

-   Clustering\
-   Campaign drafts\
-   Approval flows

### Phase 3

-   Analytics\
-   Versioning\
-   Templates

------------------------------------------------------------------------

## Tool Surface (GPT)

Required: - createBarRegistryRecords\
- matchBarsToQuests\
- listQuests\
- createBarQuestLink\
- clusterBarsIntoArcs\
- createCampaignDraft

------------------------------------------------------------------------

## Key Principle

Do NOT store quest matches only on BAR records.\
Use a separate BarQuestLink model.

------------------------------------------------------------------------

## Cursor Task Prompt

Update the backend to:

-   Add bulk BAR ingestion\
-   Add BAR ↔ quest link model\
-   Add quest query endpoints\
-   Add clustering\
-   Add campaign drafts

Ensure: - backward compatibility\
- structured match outputs\
- provenance tracking
