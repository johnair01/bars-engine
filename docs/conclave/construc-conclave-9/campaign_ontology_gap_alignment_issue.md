# Re-center campaign ontology to align BARS Engine with organization → campaign → subcampaign vision

## Type

Architecture / ontology correction / data model evolution / progression alignment / stewardship design

## Summary

The current codebase contains most of the machinery needed for the intended product vision, but that machinery is distributed across overlapping conceptual layers:

- `Instance` currently acts as both top-level world container and campaign-runtime surface
- `Campaign` already exists as a first-class model, but is still flat
- many runtime systems still key off `campaignRef` strings rather than canonical campaign objects
- hub/spoke progression machinery exists, but its attachment point is still conceptually ambiguous
- `CampaignSlot` provides content hierarchy, but should not be conflated with initiative hierarchy

This issue proposes a repo-aligned re-centering of ontology so the system better matches the intended vision:

- **Instance** = durable world / organization / venue / social substrate
- **Campaign** = canonical initiative container
- **Subcampaign** = child campaign
- **CampaignSlot** = content/navigation hierarchy inside a campaign
- **Hub/Spoke/Node** = optional progression topology attached to campaigns
- **Narrative layer** = flavor / sovereignty / lore surface attached to campaigns, not a replacement for structure

This is not a greenfield redesign. It is a reconciliation pass to make the existing architecture cohere.

---

## Why this matters

The current repo already supports:

- instances
- campaigns
- invites
- themes
- narrative config
- campaign decks
- portals
- spoke sessions
- BAR provenance fragments
- campaign slots
- event campaigns
- campaign milestones

But it does not yet express a single authoritative answer to:

**What is a campaign?**

As a result, campaign meaning is currently spread across:

- `Instance`
- `Campaign`
- `campaignRef`
- `CampaignSlot`

This creates drag on throughput:
- specs require translation each time
- new features risk being wired into the wrong layer
- hierarchy is encoded inconsistently
- runtime systems and governance semantics drift apart

This issue aims to reduce that drag by making the intended structure explicit and implementable.

---

## Desired product ontology

### 1. Instance = world / organization / container

An `Instance` is the durable top-level container that holds:

- members
- shared resources
- shared maps / lobbies / venues
- shared governance context
- campaigns
- events and artifacts that belong to the world as a whole

Canonical example:
- **Bruised Banana Organization** = `Instance`

An instance may host many campaigns.

---

### 2. Campaign = initiative container

A `Campaign` is the canonical initiative unit inside an instance.

Examples inside Bruised Banana Organization:
- Bruised Banana Residency
- Mastering the Game of Allyship
- Gather Resources
- Raise Awareness
- Story Artifact Production
- Event production arcs

A campaign has:
- purpose
- copy
- steward(s)
- narrative settings
- invitations
- template config
- timeline
- progression topology (optional)
- artifacts, quests, BARs, and related outputs

---

### 3. Subcampaign = child campaign

A subcampaign is a campaign nested inside another campaign.

Examples:
- under Mastering the Game of Allyship:
  - Book
  - Card Game
  - Nonprofit
- under Bruised Banana Residency:
  - Resource Gathering
  - Residency Operations
  - Story Artifact Production

A child campaign may inherit defaults from its parent while overriding:
- stewardship
- copy
- narrative config
- progression topology
- eligibility
- artifacts and quest pools

---

### 4. CampaignSlot = navigation/content hierarchy

`CampaignSlot` should remain a content/navigation organizer, not the canonical initiative hierarchy.

Use CampaignSlot for:
- branches
- sub-branches
- adventure clusters
- content tree organization
- local navigation inside a campaign

Do not rely on CampaignSlot as the main representation of subcampaign governance or initiative ownership.

---

### 5. Hub/Spoke/Node = progression topology

Hub/spoke/node is not the same thing as campaign hierarchy.

It is a progression grammar that a campaign may use.

- Hub = shared orientation / portal surface / social return point
- Spoke = deeper guided arc
- Node = unlock point, seed point, subcampaign-generation threshold, or milestone surface

This topology should attach to campaigns, not define what a campaign is.

---

### 6. Narrative = overlay/configuration layer

Narrative identity should live in:
- `CampaignTheme`
- `storyBridgeCopy`
- `narrativeConfig`
- `narrativeSovereignty`
- future lore/story-arc tables

Narrative should enrich the initiative, not replace structural truth.

---

## Repo-grounded findings

### Already present
- First-class `Campaign` model exists
- `CampaignTheme` exists
- `Campaign` already has narrative config and sovereignty placeholders
- Hub/spoke runtime models already exist:
  - `CampaignDeckCard`
  - `CampaignPeriod`
  - `CampaignPortal`
  - `SpokeSession`
  - `SpokeMoveBed`
  - `SpokeMoveBedKernel`
- `CampaignSlot` exists as a hierarchical content organizer
- `Instance` already contains child campaigns via relation

### Current gaps
- `Campaign` is still flat (no parent campaign relation)
- `Instance` still carries too much campaign-runtime identity
- many runtime systems still use `campaignRef` as primary semantic anchor
- stewardship is not yet modeled clearly at nested campaign depth
- allyship domain risks being overused as a structural surrogate
- campaign-tree-aware provenance is still incomplete

---

## Gap analysis

### Gap A — canonical hierarchy
**Current:** `Campaign` exists but has no parent-child structure.  
**Needed:** parent-child hierarchy on Campaign.

### Gap B — instance overload
**Current:** `Instance` mixes organization/world semantics with campaign runtime semantics.  
**Needed:** re-center Instance as container; let Campaign own initiative logic.

### Gap C — campaign identity split
**Current:** campaign identity exists as object (`Campaign`) and string (`campaignRef`).  
**Needed:** make Campaign object canonical and progressively reduce reliance on string-only semantics.

### Gap D — progression attachment ambiguity
**Current:** hub/spoke runtime exists but is conceptually split across instance/campaignRef surfaces.  
**Needed:** define campaign as the primary owner of progression topology.

### Gap E — stewardship depth
**Current:** campaign creator/reviewer exist, but nested stewardship remains weak.  
**Needed:** explicit steward model or role attachment per campaign level.

### Gap F — provenance and lineage
**Current:** many provenance fragments exist.  
**Needed:** lineage should become campaign-tree-aware.

---

## Proposal

## Phase 1 — semantic clarification and design correction

### Goals
- define Campaign as canonical initiative container
- define Instance as canonical world/org container
- define CampaignSlot as navigation/content hierarchy
- define hub/spoke as campaign progression topology

### Tasks
- update docs and glossary to reflect the above
- add one canonical Bruised Banana example
- audit existing use of `campaignRef`
- document which systems are currently keyed by `campaignRef`, `instanceId`, and `campaignId`

### Deliverables
- architecture note
- updated ontology glossary
- migration map of existing campaign-related models

---

## Phase 2 — add campaign hierarchy

### Goals
Enable nested initiative structure directly in `Campaign`.

### Proposed schema changes
Add to `Campaign`:
- `parentCampaignId String?`
- self relation `parentCampaign`
- self relation `childCampaigns`

Optional:
- `campaignType String?`
- `stewardConfig Json?` if roles are not yet sufficient

### Acceptance criteria
- a campaign can have child campaigns
- sibling campaigns can coexist under an instance
- parent/child campaigns can be queried cleanly
- child campaigns can override copy/config from parent

---

## Phase 3 — clarify stewardship

### Goals
Support real nested ownership/stewardship.

### Options
- lightweight: add steward config JSON to Campaign
- stronger: introduce `CampaignMembership` / `CampaignRole` relation

### Must support
- owner
- co-owner
- steward
- reviewer / admin approval
- inheritance vs override at child level

### Acceptance criteria
- different campaigns and subcampaigns can have different stewards
- parent campaign stewardship does not silently overwrite child stewardship
- admin UI can display stewardship clearly

---

## Phase 4 — re-anchor progression topology to Campaign

### Goals
Attach hub/spoke progression more explicitly to campaigns.

### Audit required
Inspect whether the following should gain `campaignId` or be resolvable through it:
- `CampaignDeckCard`
- `CampaignPeriod`
- `CampaignPortal`
- `SpokeSession`
- `CampaignMilestone`
- `CampaignMilestoneMarker`
- `ContributionAnnotation`
- `ContributionRecord`

### Principle
`campaignRef` may remain as compatibility slug / routing aid, but campaign progression should point toward canonical campaign identity.

### Acceptance criteria
- a campaign can own its own hub/spoke runtime
- sibling campaigns can have different progression topologies
- child campaigns can inherit or override progression behavior

---

## Phase 5 — preserve CampaignSlot as content hierarchy

### Goals
Avoid conflating content tree with initiative tree.

### Tasks
- document CampaignSlot as internal navigation/content structure
- ensure it is not treated as a substitute for campaign hierarchy
- clarify relationship between Campaign → CampaignSlot → Adventure

### Acceptance criteria
- campaign governance hierarchy and campaign content hierarchy are separate and legible
- docs explicitly distinguish them

---

## Phase 6 — campaign-tree-aware provenance

### Goals
Make provenance reflect actual initiative lineage.

### Needed outputs
Ability to answer:
- which instance produced this artifact?
- which campaign produced it?
- was it inside a child campaign?
- which spoke session / BAR / quest lineage led to it?
- who stewarded the relevant campaign at the time?

### Acceptance criteria
- artifacts, BARs, quests, and story outputs can be traced back through campaign hierarchy
- this lineage is queryable and user-visible where useful

---

## Canonical Bruised Banana example

```text
Instance:
Bruised Banana Organization

Campaigns:
- Bruised Banana Residency
- Mastering the Game of Allyship
- Gather Resources
- Raise Awareness

Child campaigns under Mastering the Game of Allyship:
- Book
- Card Game
- Nonprofit

Child campaigns under Bruised Banana Residency:
- Resource Gathering
- Residency Operations
- Story Artifact Production

Optional progression topology:
- Bruised Banana Residency has a hub/spoke progression layer
- MTGOA may have its own hub/spoke layer or simpler structure

CampaignSlot:
- used inside each campaign to organize adventures/branches/content
```

---

## Design principles

1. **Campaign is the initiative.**
2. **Instance is the world/container.**
3. **CampaignSlot is content structure, not governance structure.**
4. **Hub/spoke is progression topology, not ontology.**
5. **Narrative enriches structure; it does not replace it.**
6. **Domains classify the work; they do not carry the whole hierarchy.**
7. **Provenance should reflect real initiative lineage.**

---

## Questions for implementation

1. Which runtime systems currently break if `campaignRef` is not the primary identity key?
2. Which places should gain `campaignId` first for maximum leverage?
3. Should campaign stewardship be modeled through existing roles, new relations, or config JSON?
4. Which `Instance` fields are genuinely instance-level, and which are transitional campaign-runtime fields?
5. Which hub/spoke fields belong on campaign-level configuration versus instance-level lobby structure?
6. How should child campaigns inherit parent config?
7. How much automatic migration is safe versus review-required?

---

## Definition of done

This effort is done when the repo can model, without hacks:

- an `Instance` called **Bruised Banana Organization**
- multiple campaigns within that instance
- nested child campaigns
- different stewards at different campaign levels
- optional hub/spoke progression per campaign
- campaign content trees via `CampaignSlot`
- campaign narrative flavor without structural confusion
- lineage of BARs/quests/artifacts back through instance → campaign → child campaign

And when a future feature author can answer “what is a campaign?” without summoning three contradictory docs and a support animal.

---

## Highest-leverage next action

Before implementation, run one focused code audit:
- enumerate every place `campaignRef` is read/written
- classify each usage as:
  - canonical identity
  - routing convenience
  - content grouping
  - progression grouping
  - legacy compatibility
- identify which of those should migrate first to `campaignId`

That audit will tell us exactly where the repo is paying tax for semantic drift.
