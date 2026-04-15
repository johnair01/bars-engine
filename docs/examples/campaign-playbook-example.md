# Campaign Playbook Example

## Example: Bruised Banana Residency Campaign

### Instance Context

- **Instance**: Bruised Banana Residency (slug: `bruised-banana`)
- **Kotter Stage**: 3 (Form Strategic Vision)
- **Domain**: GATHERING_RESOURCES (primary)

---

## Example Playbook Structure

```json
{
  "id": "playbook-bb-001",
  "instanceId": "inst-bruised-banana",
  "origin": "The Bruised Banana Residency emerged from early BARs about housing insecurity and creative community. Founding members identified the need for a physical space where artists could live and work.",
  "vision": "A sustainable residency that supports 4–6 artists per cycle, with fundraising and community events sustaining operations.",
  "people": "Wendell (direction), JJ (operations), Amanda (events), Carolyn & Jim (community oversight)",
  "invitations": "Onboarding message: 'Join the Bruised Banana Residency — a space for artists to create, connect, and contribute to the community.'",
  "timeline": "Q1: Fundraising launch. Q2: First cohort selection. Q3: Residency begins.",
  "kotterStages": {
    "1": "Early BARs surfaced urgency around housing and creative space.",
    "2": "Coalition formed: JJ, Amanda, Wendell.",
    "3": "Vision: sustainable residency with 4–6 artists per cycle.",
    "4": "Invitation waves in progress.",
    "5": "Active quests: fundraising, space prep.",
    "6": "First milestone: 25% of goal reached.",
    "7": "Scaling outreach.",
    "8": "TBD"
  },
  "domainStrategy": {
    "GATHERING_RESOURCES": "Fundraising via donations, pack sales, events. Active quests: Donation drive, Pack promotion.",
    "RAISE_AWARENESS": "Social media, storytelling, press outreach. Suggested: Invitation quest, Story BAR.",
    "DIRECT_ACTION": "Space prep, event hosting. Active: Workshop setup quest.",
    "SKILLFUL_ORGANIZING": "Systems for selection, scheduling. Suggested: Capacity quest."
  },
  "raciRoles": "Responsible: JJ (operations). Accountable: Wendell (direction). Consulted: Amanda (events). Informed: Carolyn, Jim.",
  "recentUpdates": "2024-03-01: Generated from 12 BARs, 5 quests, 2 events.",
  "generatedSummary": "Campaign at Stage 3. Strong coalition. Fundraising active. Next: invitation wave and event promotion."
}
```

---

## Example Export: Tweet Thread

**Input**: `exportPlaybookSnippet({ instanceId: 'inst-bb', type: 'tweet_thread' })`

**Output**:
```
1/ The Bruised Banana Residency is a space for artists to create, connect, and contribute. We're building something real. 🍌

2/ Our vision: 4–6 artists per cycle, sustained by community and fundraising. We're at 25% of our goal. Every contribution helps.

3/ Want to join? We're looking for collaborators, donors, and artists. Link in bio. #BruisedBanana #ArtistResidency
```

---

## Example Export: Campaign Deck

**Input**: `getCampaignDeck('inst-bruised-banana')`

**Output**:
```json
{
  "activeQuests": [
    { "id": "q1", "title": "Donation drive", "status": "assigned" },
    { "id": "q2", "title": "Workshop setup", "status": "in_progress" }
  ],
  "availableQuests": [
    { "id": "q3", "title": "Invitation quest" },
    { "id": "q4", "title": "Story BAR" }
  ],
  "events": [
    { "id": "e1", "title": "Open House", "status": "scheduled", "startTime": "2024-04-15T18:00:00Z" }
  ],
  "keyActors": [
    { "id": "p1", "name": "Wendell", "role": "Accountable" },
    { "id": "p2", "name": "JJ", "role": "Responsible" }
  ],
  "strategicGoals": [
    "Reach fundraising goal",
    "Complete first cohort selection",
    "Launch residency Q3"
  ]
}
```
