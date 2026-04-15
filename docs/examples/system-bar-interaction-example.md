# System BAR Interaction — Examples

## Example 1: Quest Invitation BAR

**Scenario**: Player posts a fundraiser quest and invites 2 collaborators.

**Create BAR**:
```ts
await createInteractionBar({
  barType: 'quest_invitation',
  title: 'Bruised Banana Fundraiser — Need 2 Collaborators',
  description: 'Help run the Friday micro-fundraiser. Setup and breakdown.',
  visibility: 'public',
  payload: {
    invitationRole: 'collaborator',
    requestedSlots: 2,
    responseOptions: ['join', 'curious', 'witness', 'decline']
  },
  parentId: questId,  // CustomBar id of the fundraiser quest
  campaignRef: 'bruised-banana'
})
```

**CustomBar record**:
- type: `quest_invitation`
- parentId: quest id
- campaignRef: `bruised-banana`
- inputs: JSON string of payload
- status: `open`

**Response flow**: Player B calls `respondToBar(barId, { responseType: 'join' })`. When 2 joins received, status → `fulfilled`.

---

## Example 2: Help Request BAR

**Scenario**: Player requests accountability for a courage experiment.

**Create BAR**:
```ts
await createInteractionBar({
  barType: 'help_request',
  title: 'Accountability for Courage Experiment',
  description: 'Doing a 3-day courage experiment. Need someone to check in daily.',
  visibility: 'public',
  payload: {
    helpType: 'accountability',
    responseOptions: ['offer_help', 'curious', 'cant_help']
  },
  campaignRef: 'bruised-banana'
})
```

**Response flow**: Player C calls `respondToBar(barId, { responseType: 'offer_help', message: 'I can check in at 8pm each day.' })`.

---

## Example 3: Appreciation BAR

**Scenario**: Player witnesses another player's public BAR and sends appreciation.

**Create BAR**:
```ts
await createInteractionBar({
  barType: 'appreciation',
  title: 'Witnessed your courage',
  description: 'Saw your completion of the courage experiment. Well done.',
  visibility: 'public',
  payload: {
    appreciationType: 'courage',
    targetType: 'actor',
    targetId: targetPlayerId
  }
})
```

**Note**: Could also use `BarShare` for simple appreciation (barId = target BAR, note = appreciation text). Appreciation BAR adds structure (appreciationType, targetType).

---

## Example 4: Coordination BAR

**Scenario**: "Micro fundraiser happening Friday — looking for 3 witnesses."

**Create BAR**:
```ts
await createInteractionBar({
  barType: 'coordination',
  title: 'Friday Micro Fundraiser — 3 Witnesses Needed',
  description: 'Launch experiment at 6pm. Need 3 witnesses for the ritual.',
  visibility: 'public',
  payload: {
    coordinationType: 'witness_call',
    deadline: '2025-03-07T18:00:00Z'
  },
  campaignRef: 'bruised-banana'
})
```

---

## Example 5: Mobile Social Loop

**Flow**: Player opens app → sees 2 open invitation BARs, 1 help request → taps one → responds with "join" → closes app.

**Queries**:
1. `getBarFeed({ campaignRef: 'bruised-banana', barTypes: ['quest_invitation', 'help_request'], statuses: ['open'] })`
2. `respondToBar(barId, { responseType: 'join' })`

**UI**: Action-oriented cards (Accept / Decline / Curious). No long-form input required.
