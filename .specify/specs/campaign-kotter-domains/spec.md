# Spec: Campaign Kotter Structure + Domain × Kotter Matrix

## Purpose

Implement structural story steps for campaigns: every campaign progresses through all 8 Kotter stages. Instances can have multiple campaigns; each campaign has a type (allyship domain). Kotter stages manifest differently per domain. New players encounter campaigns and domains through Market and Event. Admin advances campaign stage based on donation + features-shipped thresholds.

## Conceptual Model (Game Language)

| Dimension | Meaning | Schema |
|-----------|---------|--------|
| **WHO** | Identity | Nation, Archetype |
| **WHAT** | The work | Quests (CustomBar) |
| **WHERE** | Context of work | Allyship domains; Campaign type |
| **Energy** | What makes things happen | Vibeulons |
| **Personal throughput** | How players get things done | 4 moves (Wake Up, Clean Up, Grow Up, Show Up) |

**Campaign** = a change initiative within an Instance. Has type (allyship domain) and Kotter stage (1–8). Examples: Bruised Banana Fundraiser (GATHERING_RESOURCES), Bars Engine Development (SKILLFUL_ORGANIZING).

**Domain × Kotter** = the same 8 Kotter stages manifest differently per domain. Urgency in Gathering Resources = "We need resources"; Urgency in Skillful Organizing = "We need capacity."

## User Stories

### P1: Instance has Kotter stage (Phase 1)
**As an admin**, I want to set and advance the Kotter stage for the active instance (e.g. Bruised Banana Fundraiser), so the campaign progresses through structural story steps and quests serve the current stage.

**Acceptance**: Instance has `kotterStage` (1–8). Admin can set/advance it in Admin → Instances. Default 1.

### P2: Market filters by instance stage
**As a player**, I want the Market to show only quests matching the active instance's Kotter stage, so I see work that serves the current campaign phase.

**Acceptance**: When an active instance exists, Market filters quests to `q.kotterStage === instance.kotterStage`. Existing filters (campaignDomainPreference, nation, playbook) apply in addition.

### P3: Event page shows campaign stage
**As a player**, I want to see the current Kotter stage on the Event page (e.g. "Stage 2: Coalition"), so I understand where the fundraiser is.

**Acceptance**: Event page displays instance stage name (e.g. "Stage 2: Coalition — Who will contribute?").

### P4: Domain × Kotter matrix in lore
**As a developer or content creator**, I want documentation of how each Kotter stage manifests per allyship domain, so I can write quests and narratives that align.

**Acceptance**: Lore doc (e.g. `.agent/context/kotter-by-domain.md` or FOUNDATIONS.md section) contains the Domain × Kotter matrix.

### P5: New player encounter (Phase 2)
**As a new player**, I want to see campaign context (what campaigns exist, their stage and domain) when I visit Market or Event, so I understand how I can contribute.

**Acceptance**: Market or Event shows a brief "Campaign context" block: e.g. "Bruised Banana Fundraiser (Gathering Resources) — Stage 2: Coalition."

### P6: Campaign model — multiple campaigns per instance (Phase 2)
**As an admin**, I want to create multiple campaigns per instance (e.g. Fundraiser + App Dev), each with its own domain type and Kotter stage, so I can track progress across different domains.

**Acceptance**: Campaign model exists with `instanceId`, `allyshipDomain`, `kotterStage`, `name`, `slug`. Instance has many Campaigns. Admin can CRUD campaigns. Market filters by active campaign(s).

## Functional Requirements

### Phase 1 (Instance-level Kotter)
- **FR1**: Instance MUST have `kotterStage` (Int, 1–8, default 1).
- **FR2**: Admin Instances page MUST allow setting/advancing `kotterStage` (dropdown or selector).
- **FR3**: `upsertInstance` MUST accept and persist `kotterStage`.
- **FR4**: Market MUST filter quests by `instance.kotterStage` when active instance exists. Combine with existing filters (campaignDomainPreference, nation, playbook, globalState.isPaused).
- **FR5**: Event page MUST display current Kotter stage (name + optional domain-specific prompt).
- **FR6**: Lore MUST include Domain × Kotter matrix (how each stage manifests per domain).

### Phase 2 (Campaign model, new player encounter)
- **FR7**: Campaign model MUST have `instanceId`, `allyshipDomain`, `kotterStage`, `name`, `slug`.
- **FR8**: Admin MUST be able to create, edit, and list campaigns for an instance.
- **FR9**: Market MUST support filtering by campaign (when Campaign model exists). Fallback: instance-level stage when no campaigns.
- **FR10**: New player encounter: Market or Event MUST show campaign context (campaign name, domain, stage).

## Domain × Kotter Matrix (Lore)

| Stage | GATHERING_RESOURCES | SKILLFUL_ORGANIZING | RAISE_AWARENESS | DIRECT_ACTION |
|-------|---------------------|---------------------|-----------------|---------------|
| 1. Urgency | "We need resources" | "We need capacity" | "People need to know" | "What needs doing now?" |
| 2. Coalition | Who will contribute? | Who are the builders? | Who will spread the message? | Who is with you? |
| 3. Vision | Fully resourced looks like… | System complete looks like… | Awareness looks like… | Completion looks like… |
| 4. Communicate | Share the need | Share the roadmap | Tell the story | Coordinate action |
| 5. Obstacles | What blocks donations? | What blocks implementation? | What blocks the message? | What blocks you? |
| 6. Wins | First milestone reached | First feature shipped | First cohort reached | Quest completed |
| 7. Build On | Scale giving | Iterate and scale | Amplify | Take on more |
| 8. Anchor | Sustainable funding | Sustainable practices | Embedded in culture | You're a player |

**Relationships**: RAISE_AWARENESS is often woven into other campaigns. DIRECT_ACTION is the core loop (playing quests). GATHERING_RESOURCES and SKILLFUL_ORGANIZING are primary campaign types.

## Schema Changes

### Phase 1
```prisma
model Instance {
  ...
  kotterStage  Int  @default(1)  // 1–8; admin advances
  ...
}
```

### Phase 2
```prisma
model Campaign {
  id             String   @id @default(cuid())
  instanceId     String
  slug           String   // e.g. "bruised-banana-fundraiser"
  name           String   // e.g. "Bruised Banana Fundraiser"
  allyshipDomain String   // GATHERING_RESOURCES | DIRECT_ACTION | RAISE_AWARENESS | SKILLFUL_ORGANIZING
  kotterStage    Int      @default(1)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  instance Instance @relation(fields: [instanceId], references: [id], onDelete: Cascade)

  @@unique([instanceId, slug])
  @@map("campaigns")
}

model Instance {
  ...
  campaigns Campaign[]
}
```

## Admin Thresholds (Guidance)

Document recommended thresholds for advancing stage (donation % + backlog items done). Admin uses as guidance; advancement remains manual. See plan for THRESHOLDS.md location.

## Out of Scope (This Spec)

- Automatic stage advancement (formula-driven).
- Epiphany–Kotter mapping in schema (narrative only).
- Verification quest for this spec (optional; can add later).

## Reference

- Cursor plan: [campaign_kotter_structure_96615870.plan.md](.cursor/plans/campaign_kotter_structure_96615870.plan.md)
- Spec Kit Translator: [.agents/skills/spec-kit-translator/SKILL.md](../../.agents/skills/spec-kit-translator/SKILL.md)
- Allyship domains spec: [bruised-banana-allyship-domains/spec.md](../bruised-banana-allyship-domains/spec.md)
- Kotter lib: [src/lib/kotter.ts](../../src/lib/kotter.ts)
