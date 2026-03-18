# BAR → Campaign: Watering a Seed into a Whole Campaign

**Purpose**: If a BAR is a seed, what is the process of it being watered into becoming a whole campaign? Implementation plan to strengthen the main game loop by making campaign creation a quest-driven, face-keyed flow.

---

## The Metaphor

- **Seed** = BAR (kernel with story, constitution, intention)
- **Water** = structure + social adoption (SpecPhase + KotterStage; six faces)
- **Bloom** = Instance (playable campaign)

**Watering** = the process of adding structure and adoption to the BAR until it can become an Instance.

---

## Current State

| Step | Current | Gap |
|------|---------|-----|
| Campaign kernel | `Instance.narrativeKernel` (text) | Kernel is on Instance; no BAR-first flow |
| Campaign creation | Admin creates Instance via form | No quest-driven creation |
| Structure | Instance has targetDescription, wakeUpContent, etc. | No SpecPhase/structural maturity |
| Adoption | Instance has kotterStage | Admin-set; no quest-driven advancement |

**The kernel exists on the Instance.** There is no "BAR first, then Instance" flow. Campaign authoring assumes Instance exists; you edit kernel on it.

---

## Target: BAR-First Campaign Creation

### Flow

1. **Create campaign seed BAR** — Player or admin creates a CustomBar with `type: 'campaign_kernel'`. Contains: title, description (narrative kernel), targetDescription, allyshipDomain.
2. **Water the BAR** — Complete 6 "watering" quests (one per face). Each quest adds structure or adoption to the BAR.
3. **Promote to campaign** — When watering complete, BAR blooms into Instance. Instance is created; `kernelBarId` points to the BAR.

### How This Strengthens the Main Game Loop

- **Main loop**: Land → Quest → Complete → Impact → Next
- **Campaign creation as quests**: "Water this campaign" = 6 quests. Each completion = impact (BAR gets structure). Next = next face quest.
- **Player agency**: Players can create campaign seeds and water them. Not just admin.
- **Six faces as structure**: Shaman = threshold/story. Regent = structure/rules. Challenger = first action. Architect = blueprint. Diplomat = who's in. Sage = integration. Each face = one watering quest.

---

## Watering Quests (Six Faces)

| Face | Watering quest | What it adds to the BAR |
|------|----------------|-------------------------|
| **Shaman** | "Name the threshold" | Story, mythic entry, why this campaign exists |
| **Regent** | "Set the structure" | Rules, roles, kotterStage, domain |
| **Challenger** | "Define the first action" | First quest, proving ground, what players do first |
| **Architect** | "Map the blueprint" | Subcampaigns, adventures, quest map |
| **Diplomat** | "Invite the coalition" | Who's in, inviter, community scope |
| **Sage** | "Integrate and launch" | Final coherence, launch readiness |

Each quest completion:
- Updates the campaign BAR (or a linked metadata JSON)
- Advances "watering progress" (e.g. `campaignBar.wateringProgress: { shaman: true, regent: true, ... }`)
- When all 6 complete → promotion available

---

## Schema Changes

### Option A: Campaign BAR as CustomBar

- **CustomBar** with `type: 'campaign_kernel'`
- New fields: `wateringProgress` (JSON: `{ shaman: bool, regent: bool, ... }`), `promotedInstanceId` (set when promoted)
- When promoted: create Instance, set `Instance.kernelBarId = bar.id`, set `bar.promotedInstanceId = instance.id`

### Option B: Instance First, Link to BAR

- **Instance** gets `kernelBarId` (optional FK to CustomBar)
- When creating from BAR: create Instance, copy BAR fields to Instance, set kernelBarId
- BAR can exist before Instance; promotion creates Instance from BAR

### Recommended: Option A + Instance.kernelBarId

- Campaign seed = CustomBar type `campaign_kernel`
- `wateringProgress` JSON on CustomBar
- Promotion creates Instance, sets `Instance.kernelBarId = bar.id`
- Instance.narrativeKernel can be synced from BAR.description at promotion

---

## Implementation Phases

### Phase 1: Schema + Promotion (Admin-Only)

1. Add `type: 'campaign_kernel'` to CustomBar (or new `campaign_kernel` type value)
2. Add `wateringProgress String?` (JSON) and `promotedInstanceId String?` to CustomBar
3. Add `kernelBarId String?` to Instance (FK to CustomBar)
4. **Promote** server action: given a campaign_kernel BAR with all 6 faces complete, create Instance from it, link both ways
5. Admin UI: "Create campaign from BAR" or "Create campaign seed" → creates BAR, then watering quests

### Phase 2: Watering Quests

1. Create 6 system quests (or quest template): one per face
2. Each quest has completion effect: `advanceCampaignWatering` with `face: 'shaman'` etc.
3. Completion effect updates `campaignBar.wateringProgress`
4. Quest thread: "Water your campaign" with 6 quests in order
5. Assign thread when player has a campaign_kernel BAR with no promotedInstanceId

### Phase 3: Create Campaign Seed (Player-Facing)

1. "Create campaign seed" flow: form or quest that creates a CustomBar with type `campaign_kernel`
2. Player fills: title, description (kernel), targetDescription, allyshipDomain
3. BAR created; "Water your campaign" thread assigned
4. Player completes 6 watering quests; each advances the BAR
5. When complete, player (or admin) promotes to Instance

### Phase 4: Integration with Main Loop

1. Dashboard: if player has campaign_kernel BAR in progress, show "Water your campaign" as primary CTA
2. Completion of each watering quest = impact moment ("Your campaign now has structure")
3. Promotion = big impact ("Your campaign is live")
4. New campaign appears in campaign list; player can invite others

---

## Promotion Logic (Pseudocode)

```ts
async function promoteCampaignBarToInstance(barId: string) {
  const bar = await db.customBar.findUnique({
    where: { id: barId, type: 'campaign_kernel' }
  })
  if (!bar || bar.promotedInstanceId) return { error: 'Already promoted or invalid' }

  const progress = JSON.parse(bar.wateringProgress || '{}')
  const faces = ['shaman', 'regent', 'challenger', 'architect', 'diplomat', 'sage']
  if (!faces.every(f => progress[f])) return { error: 'Watering incomplete' }

  const slug = bar.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const instance = await db.instance.create({
    data: {
      slug: slug + '-' + barId.slice(0, 6),
      name: bar.title,
      domainType: 'campaign',
      targetDescription: bar.description, // or from watering metadata
      narrativeKernel: bar.description,
      allyshipDomain: bar.allyshipDomain,
      kotterStage: 1,
    }
  })

  await db.customBar.update({
    where: { id: barId },
    data: { promotedInstanceId: instance.id }
  })
  await db.instance.update({
    where: { id: instance.id },
    data: { kernelBarId: barId }
  })

  return { instanceId: instance.id }
}
```

---

## File Impacts

| File | Change |
|------|--------|
| `prisma/schema.prisma` | CustomBar: wateringProgress, promotedInstanceId; Instance: kernelBarId |
| `src/actions/campaign-bar.ts` (new) | createCampaignSeed, promoteCampaignBarToInstance, advanceCampaignWatering |
| `src/actions/quest-engine.ts` | Add `advanceCampaignWatering` completion effect |
| `scripts/seed-watering-quests.ts` | 6 watering quests + thread |
| `src/app/campaign/seed/page.tsx` (new) | Create campaign seed form |
| `src/app/campaign/water/page.tsx` (new) | Watering progress + current quest |

---

## Connection to Main Loop

**Before**: Main loop = accept quest → complete → vibeulons → next quest. Campaign creation = admin form.

**After**: Main loop includes "create and water a campaign" as a quest path. Completing watering quests = same loop (complete → impact → next). Promotion = level-up moment.

**Strengthening**: Players who want to run a campaign can do it through the same loop they use for everything else. The campaign is not a separate admin action; it's a bloom from a BAR they watered.
