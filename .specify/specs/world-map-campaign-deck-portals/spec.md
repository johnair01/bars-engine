# Spec: World Map — Campaign Deck, Periods, Portals, Spoke Sessions, Milestones

**Spec ID:** WMC  
**Status:** active  
**Related:** CHS (campaign-hub-spoke-landing-architecture), campaign-domain-decks, gameboard-campaign-deck, STRAND_CONSULT_MAP_DECK_MOVES.md

---

## Problem

The campaign hub has spokes, but there is no first-class model for:
1. The **campaign deck** — cards created by the campaign author (one per hexagram slot)
2. **Periods** — which 8 cards are active in any given stretch of the campaign
3. **Portals** — physical hub-page entries that are hydrated by a period draw
4. **Spoke sessions** — a player's journey through one portal's CYOA adventure
5. **Milestones** — public campaign goals with admin approval and contribution tracking

The existing `GameboardSlot` covers some of the spoke session needs but is coupled to the old gameboard completion surface. This spec formalizes the full model.

---

## Architecture

```
Campaign (campaignRef)
  └── CampaignDeckCard (64 possible; creator-authored; one per hexagram)
        └── linked to a CYOA Adventure (cyoaAdventureId)
        └── linked to one "Raise the Urgency" quest (CustomBar)

  └── CampaignPeriod (manual advance; 8 cards drawn; no repeats across periods)
        └── CampaignPortal × 8 (slotIndex 0–7)
              └── SpokeSession × N (one per player visit)
                    └── emits 0–1 BAR seed (CustomBar status=seed)
                    └── emits 0–1 personal quest

  └── CampaignMilestone (public, player-proposed, admin-approved)
        └── MilestoneContribution × N (donations, pledges, actions)
```

### Cardinality rules

| Relationship | Cardinality |
|---|---|
| Campaign → CampaignDeckCard | 1 : up-to-64 |
| Campaign → CampaignPeriod | 1 : many (sequential, manual) |
| CampaignPeriod → CampaignPortal | 1 : 8 (slotIndex 0–7) |
| CampaignPortal → CampaignDeckCard | many : 1 (card fixed to hexagram) |
| CampaignPortal → SpokeSession | 1 : many |
| SpokeSession → BAR seed | 1 : 0..1 |
| Campaign → CampaignMilestone | 1 : many |
| CampaignMilestone → MilestoneContribution | 1 : many |

### Period draw rules

- Each period draws **8 cards** from the campaign deck.
- The **same card cannot recur** across periods. A card drawn in period 1 cannot appear in period 2.
- The initial period for a new campaign draws 8 hexagram-linked "Raise the Urgency" quests covering the campaign domain.
- Period transition is **manual** (admin or campaign owner triggers it).
- For "Gather Resources" campaigns (e.g. Bruised Banana), at least one portal per period must be the `direct_action` hexagram path, which leads to the donation CYOA.

---

## Models

### CampaignDeckCard

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| campaignRef | String | e.g. `bruised-banana` |
| hexagramId | Int | 1–64 |
| theme | String? | short label |
| domain | String? | GATHERING_RESOURCES etc. |
| cyoaAdventureId | String? | FK → Adventure |
| questId | String? | FK → CustomBar (the "Raise the Urgency" quest for this portal) |
| createdByPlayerId | String | campaign author |
| status | String | `draft` \| `active` |
| createdAt | DateTime | |

### CampaignPeriod

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| campaignRef | String | |
| instanceId | String? | FK → Instance |
| periodNumber | Int | sequential, starts at 1 |
| kotterStage | String? | e.g. `urgency` |
| status | String | `active` \| `closed` |
| drawnCardIds | String | JSON array of CampaignDeckCard ids (8 items) |
| startedAt | DateTime | |
| endedAt | DateTime? | null when active |
| createdAt | DateTime | |

### CampaignPortal

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| periodId | String | FK → CampaignPeriod |
| campaignRef | String | |
| slotIndex | Int | 0–7 |
| hexagramId | Int? | from deck card |
| deckCardId | String? | FK → CampaignDeckCard |
| cyoaAdventureId | String? | resolved from deck card |
| questId | String? | "Raise the Urgency" quest for this portal |
| completionCount | Int | default 0 |
| createdAt | DateTime | |

### SpokeSession (extends / repurposes GameboardSlot semantics)

A new model alongside `GameboardSlot`. The gameboard is retired as a UI surface but `GameboardSlot` records remain. New spoke sessions use this model.

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| portalId | String | FK → CampaignPortal |
| playerId | String | FK → Player |
| campaignRef | String | |
| moveType | String? | `wakeUp` \| `cleanUp` \| `growUp` \| `showUp` |
| gmFace | String? | `shaman` \| `regent` \| `challenger` \| `architect` \| `diplomat` \| `sage` |
| status | String | `in_progress` \| `completed` \| `abandoned` |
| barSeedIds | String | JSON array of CustomBar ids emitted |
| generatedQuestId | String? | FK → PlayerQuest |
| moveChosenAt | DateTime? | |
| faceChosenAt | DateTime? | |
| completedAt | DateTime? | |
| createdAt | DateTime | |

### BAR Seeds

Not a new model. `CustomBar` gains `status = 'seed'` for incomplete BARs produced inside a CYOA spoke. A seed:
- Has `status = 'seed'` (new value alongside existing statuses)
- Has `createdByPlayerId` and optional `spokeSessionId` provenance
- Can be "tended" in the vault later (player uploads proof → status changes to `active`)

### CampaignMilestone

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| campaignRef | String | |
| title | String | |
| description | String? | |
| targetValue | Float? | e.g. donation amount |
| currentValue | Float | default 0 |
| status | String | `proposed` \| `active` \| `complete` |
| proposedByPlayerId | String | FK → Player |
| approvedByPlayerId | String? | FK → Player (admin) |
| approvedAt | DateTime? | |
| createdAt | DateTime | |

### MilestoneContribution

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| milestoneId | String | FK → CampaignMilestone |
| playerId | String | FK → Player |
| barId | String? | FK → CustomBar (the tended BAR seed) |
| donationRef | String? | external ref |
| value | Float | contribution amount / weight |
| note | String? | |
| contributedAt | DateTime | |

---

## Admin Deck CYOA wizard

Primary authoring path for the **starter deck** (hexagrams 1–8) matches the app’s CYOA rhythm: passage text + discrete choices, no raw form dump.

- **Route:** `/admin/campaign/[ref]/deck` (admin-only).
- **Intake:** `DeckIntakeV1` JSON (`v`, `campaignIntent`, `urgencyTone`, `includeDonationSpoke`, optional `ownerGoalLine` ≤ 280 chars). Same intake always **materializes** the same eight card rows and the same eight **Raise the urgency** quest bodies (deterministic templates in [`src/lib/campaign-deck-quests.ts`](../../../src/lib/campaign-deck-quests.ts)).
- **Persistence:** `Instance.deckAuthoringIntake` stores the last applied intake for replay/export.
- **Flow:** welcome → intent → tone → donation spoke → **owner goal** (optional line or skip) → review → apply → done (activate + period draw + copy JSON).
- **Linking:** On apply, each card gets `cyoaAdventureId` from `Instance.portalAdventureId` when set (run `seed:portal-adventure` first).
- **Quests on apply:** For each hexagram 1–8, `applyDeckIntakeV1` creates or updates a `CustomBar` (`type: quest`, `visibility: public`, `isSystem: true`, `campaignRef`, `allyshipDomain`, `hexagramId`, `kotterStage: 1`) and sets `CampaignDeckCard.questId`. If the card already references a quest that still exists, that row is **updated** (no duplicate quests on re-run). Copy is composed by the **Kotter quest seed grammar** ([`kotter-quest-seed-grammar`](../kotter-quest-seed-grammar/spec.md) / [`composeKotterQuestSeedBar`](../../../src/lib/kotter-quest-seed-grammar.ts)) — deterministic Kotter × domain × hexagram slots; optional alchemy/face when provided later from CYOA. **GM face × stage moves** (six moves per Kotter stage) and **milestone gating** for which moves are available are specified in KQSG addenda §C–D.

Deck mutations (`createDeckCard`, `activateDeckCard`, `drawPeriod`) require **admin** role.

---

## Acceptance criteria

1. A campaign author can create CampaignDeckCards (one per hexagram they want to use).
2. An admin can trigger `drawPeriod(campaignRef)` to create a new `CampaignPeriod` + 8 `CampaignPortal` records.
3. No deck card appears in two periods for the same campaign.
4. A player who completes a spoke session gets a BAR seed in their vault and optionally a personal quest.
5. A `CampaignMilestone` can be proposed by any player and approved by an admin; contributions are recorded.
6. `npm run check` passes.
7. Applying the deck wizard creates eight campaign-linked urgency quests and sets `questId` on each starter card; re-applying updates quest copy without creating new quest rows.
