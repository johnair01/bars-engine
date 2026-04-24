# Phase 3 — Stewardship Model: Spec Addendum

**Source:** 6-Face GM analysis + permissions decision session, 2026-04-22
**Status:** APPROVED — all open questions resolved
**Model Selected:** Model B-2 (CampaignMembership with scoped stewardship)

---

## 1. Persistence Model

### Model B-2: CampaignMembership with Scoped Steward

Campaign creator does NOT automatically become a steward. Stewardship is an **explicit opt-in role** with a required in-app teaching moment at campaign creation completion.

```prisma
model CampaignMembership {
  id            String         @id @default(cuid())
  campaignId    String
  userId        String
  role          MembershipRole // MEMBER | STEWARD | OWNER
  stewardScope  StewardScope?  // null unless role = STEWARD
  createdAt     DateTime       @default(now())

  @@unique([campaignId, userId])
}

enum MembershipRole {
  MEMBER   // can view + participate in stewarded content
  STEWARD  // can create/edit within stewardship scope
  OWNER    // campaign creator; can promote/demote, set discoverability
}

enum StewardScope {
  FULL     // general steward — can touch everything in campaign
  DECK     // owns/can edit campaign deck structure
  SPOKE_1  // owns a specific spoke domain (suit, hexagram, domain category)
  SPOKE_2
  SPOKE_3
  SPOKE_4
  // ... up to N spokes, derived from campaign deck type
}
```

**Decision rationale:**
- Scoped stewards map naturally to the campaign deck's spoke architecture
- A 52-card deck (4 suits) or 64-card deck (I Ching hexagrams) can assign co-stewards per spoke
- `stewardScope` is nullable — `FULL` covers single-steward campaigns without requiring scope enumeration
- `SPOKE_N` values are derived dynamically from the campaign deck type at campaign initialization

---

## 2. Campaign Deck

### What It Is

The campaign deck **is the campaign's defining architectural document.** It is not a resource players bring to a campaign — it is the structure that determines the campaign itself.

- **Deck type** is derived from the allyship domain the campaign focuses on
- The deck's **spokes** define the campaign's major axis lines (e.g., 4 suits = 4 spokes for a 52-card deck; 8 trigrams/spokes for I Ching)
- **Branches** are draws from the deck — each draw generates a task, quest, or milestone
- The deck determines what the hub-and-spoke graph actually contains

### Deck Structure

| Element | Definition |
|---------|------------|
| Deck type | Derived from allyship domain (allyship domain → deck template) |
| Spoke | Major domain axis; co-stewards can be assigned per spoke |
| Branch | A draw from the deck; becomes a quest or task node in the graph |
| Draw | The act of pulling a branch from the deck; available to stewards and members |

### Permissions

| Action | Steward | Member | Public |
|--------|---------|--------|--------|
| Create/edit campaign deck structure | ✓ (deck owner or spoke steward) | ✗ | ✗ |
| Draw from campaign deck (generate branch) | ✓ | ✓ | ✗ |
| View campaign deck contents | ✓ | ✓ (if steward made available) | ✗ |
| Restructure spokes (change deck architecture) | Deck owner only | ✗ | ✗ |

> ⚠️ **Open question flagged for PM review:** What happens to in-flight draws and quest branches when a steward restructures the deck (changes spoke architecture mid-campaign)? This is a high-risk mutation. Recommended: disallow spoke restructuring after first draw, or require orphan branch cleanup confirmation before save.

---

## 3. Permissions Matrix

| Action | Steward | Member | Public |
|--------|---------|--------|--------|
| View game world, quests, unlocked campaigns | ✓ | ✓ | ✓ |
| View stewarded content (visibility set by steward) | ✓ | Configurable per item | Configurable per item |
| Create/edit within own stewardship scope | ✓ | ✗ | ✗ |
| Edit another steward's content | ✓ (same scope only) | ✗ | ✗ |
| Create/edit campaign deck structure | ✓ (deck steward or spoke steward) | ✗ | ✗ |
| Draw from campaign deck | ✓ | ✓ | ✗ |
| Invite members | ✓ | ✗ | ✗ |
| Set campaign discoverability | ✓ (owner only) | ✗ | ✗ |
| See stewardship opportunity in instance | ✓ (orientation required) | ✓ (trigger only) | ✓ (trigger only) |
| Take stewardship orientation | Open (any player in instance) | Open | Open |
| Add co-steward | ✓ | ✗ | ✗ |
| Demote self | ✓ (triggers decomposition check) | ✗ | ✗ |
| Export own BARs on decomposition | ✓ | ✓ | ✗ |
| Quests travel with player on decomposition | ✓ | ✓ | ✗ |
| View campaign detail page | ✓ | ✓ | ✓ (if public/discoverable) |

---

## 4. Stewardship Orientation

### Trigger

Any player within the game instance can trigger the stewardship orientation. The orientation is **visible to all players in the instance as a signal** that stewardship is available — it acts as a recruiting mechanism.

### Flow

1. Player sees "Become a Steward" prompt in instance UI (available to all players)
2. Player completes stewardship orientation (in-app teaching moment)
3. On completion, player becomes eligible to be added as a steward to any campaign in that instance
4. Campaigns can invite刚刚完成 orientation 的玩家直接作为 steward

### Implementation Notes

- Orientation completion is tracked as a boolean flag on `PlayerProfile` or equivalent
- Completion does not auto-assign steward role — invitation + acceptance is still required
- Orientation content is instance-specific (derived from the allyship domain of campaigns in that instance)

---

## 5. Abandonment & Decomposition Lifecycle

### Trigger Conditions

A campaign enters abandonment state when:
- The last steward demotes themselves, OR
- All stewards leave the campaign

### Lifecycle

```
[ABANDONMENT TRIGGERED]
        │
        ▼
campaign.status = ABANDONED
        │
        ▼
Quest broadcasts to all players in instance:
  "Campaign [name] needs a steward. Accept stewardship?"
        │
        ▼
[30-day decomposition_timeout begins]
        │
        ├─► New steward accepts → abandonment flag clears, timer resets
        │
        └─► Timer expires:
                │
                ├─ BARs: exportable by all members (personal inventory)
                ├─ Quests: transfer to individual player inventories
                ├─ Campaign deck (structure): ARCHIVED — not deleted
                │   - Spokes/branches frozen in time
                │   - Record preserved for historical reference
                ├─ Campaign hidden from public/discoverable lists
                └─ Campaign record soft-deleted from active views
```

### Decomposition Outputs

| Asset | Outcome |
|-------|---------|
| BARs | Each member exports their own; steward exports theirs |
| Quests | Each member's quests transfer to personal quest inventory |
| Campaign deck (structure) | Archived, not deleted; visible to former participants |
| Member roster | Preserved for export notification |

---

## 6. Campaign Creator Path

1. Player creates campaign record
2. Player completes campaign setup (name, domain, deck type selection)
3. **At campaign completion:** Player is prompted — "Will you steward this campaign?"
   - **Yes:** Opt-in to stewardship. Teaching moment plays. Player becomes first steward (scope = FULL). Campaign is live.
   - **No:** Campaign cannot go live. Player is prompted to invite a steward before publishing, OR to abandon campaign creation.
4. Campaign **requires at least one steward** before becoming discoverable or accepting members.

---

## 7. File & Flow Touch Points (from CAMPAIGNREF_INVENTORY)

The following files/locations in the inventory require modifications to support the stewardship model:

| Flow | Files | Required Change |
|------|-------|-----------------|
| Deck draw | `campaign-deck.ts` | Add draw permission check (steward or member), scope gating for deck writes |
| Campaign detail | `campaign-detail.ts` | Show steward list + scope, abandonment status banner |
| Campaign deck (admin) | `admin-campaign-deck.ts` | Steward-only write gate, spoke assignment UI |
| Campaign portals | `campaign-portals.ts` | Steward-scope gating on portal create/edit |
| Campaign invitation | `campaign-invitation.ts` | Steward-only invite; add steward scope selector at invite time |
| Allyship intake | `allyship-intake.ts` | Visibility gated by steward scope |
| Quest placement | `quest-placement.ts` | Draw-from-deck permission for members |
| Instance view | `instance.ts` | Show stewardship opportunity trigger to all players |
| Membership management | `campaign-membership.ts` | Core CRUD for CampaignMembership; scope assignment at promotion |

---

## 8. Open Questions

| # | Question | Owner | Priority |
|---|----------|-------|----------|
| ~~O-1~~ | ~~Deck restructure mutation~~ | RESOLVED | — |
| ~~O-2~~ | ~~Minimum spoke count per allyship domain~~ | 52-card = 4 spokes; 64-card = 8 spokes | RESOLVED |
| ~~O-3~~ | ~~Promote without orientation?~~ | No — orientation required before promotion | RESOLVED |
| ~~O-4~~ | ~~Decomposition timeout~~ | 30 days | RESOLVED |

**All questions resolved. Phase 3 fully scoped.**

---

## 9. Metadata

Owner: [unassigned]
Est. design decisions: **locked** (this addendum)
Est. implementation: ~6.5 days across 4 sprints
Blocks: Phase 4 (#43), Phase 5, Phase 6 (#44)
Status: APPROVED — 2026-04-22
