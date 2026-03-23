# Strand Consult: Campaign Map — Deck Model, Entry, Vault Context, Quest Resolution, Four Moves

**Date:** 2026-03-22  
**Strand type:** research  
**Question author:** Wendell  
**Subject:** Five design gaps blocking CHS (Campaign Hub Spoke Landing Architecture)

---

## Six-Face Readings

### Shaman — What the player carries into the hub

> *"Players enter the campaign map carrying an invisible burden — quests, unfilled longings, echoes of past challenges, and shadows seeking the light of understanding. The system must read this emotional sediment before routing them into a spoke."*

The Shaman's signal: **the vault is the player's psyche at the door.** Before any deck draw or map entry, the system needs to perform a "vault reading" — not as a gate but as a diagnostic. What charges are unprocessed? What moves have been completed and which are stuck? The emotional alchemy of their recent charge (last 24–48h) is the most relevant signal. The CYOA spoke should open with a passage that *reflects the player's current emotional state back to them* before asking them to choose a move.

**Implication:** The first passage of every spoke CYOA is not "choose a move" — it is "this is what you're carrying." Choose a move responds to that.

---

### Regent — Campaign structural state (Hexagram 27: Nourishment)

The Regent identified Kotter Stage 1 (Urgency) as the current campaign state — foundational infrastructure before higher-stage operations. The hexagram alignment: **27 (Nourishment)** — attend to essential needs before acting.

The Regent's read: the campaign map cannot run without a **CampaignDeck DB model**. The gameboard already has `GameboardSlot`, but the deck itself — the pool of cards that gets dealt — is an informal collection of quests in a thread, not a first-class model. This needs to become a real model before hub/spoke/landing can reliably draw from it.

**Implication:** `CampaignDeck` needs to be a DB model. Period draw is a system operation, not a player action.

---

### Challenger — What is the hardest question here?

The Challenger's question (filled from domain knowledge): **"If you give players four move branches on every spoke, what prevents them from always picking Show Up (the most powerful move) and bypassing the earlier work?"**

This is the critical design constraint. The answer must be: **vault state gates branch access**, not arbitrary restrictions. A player can only take a Show Up branch if they have at least one completed Grow Up quest in their vault. Clean Up requires at least one active charge. Wake Up is always available. This creates a natural progressive unlock that respects real inner-work pacing without being punitive.

The second Challenger question: **"Why does the campaign need its own deck when the gameboard already exists?"** Answer: the gameboard is a *completion surface* (8 slots, replace on complete). The campaign deck is the *draw pool* — the full library of quests associated with a campaign domain. The gameboard draws from the deck. The hub/spoke system gives access to the deck via CYOA. These are different layers of the same system.

---

### Architect — Structural design (growUp quest, Kotter Stage 1)

The Architect framed this as a **Grow Up capacity-building quest** — the right category. The structural design:

**CampaignDeck model:**
```
CampaignDeck {
  id
  instanceId / campaignRef       ← scope
  domain                         ← GATHERING_RESOURCES | SKILLFUL_ORGANIZING | etc.
  topology                       ← '52' | '64'
  status                         ← 'active' | 'archived'
  createdAt / updatedAt
}
```
Cards are `CustomBar` records with `allyshipDomain` + `campaignRef` — not a separate model. The deck is the *filtered view* of those quests. A `DeckPeriodDraw` table records which cards were dealt for a period:
```
DeckPeriodDraw {
  id
  deckId
  periodRef     ← e.g. 'kotter-1' or ISO week
  questId       ← the CustomBar id dealt
  slotIndex     ← 0–7
  dealtAt
  completedAt?
}
```
When a slot completes, a new draw fires to fill it from remaining un-dealt cards.

**Move-typed passages on spoke CYOA:**
Each spoke adventure has 4 root-level passages tagged `moveType`. The CYOA engine reads `VaultContext.currentMoveType` to *highlight* the matching branch (not hard-block others, except as noted in Challenger reading). Move-typed passages use the existing `Passage.moveType` field.

---

### Diplomat — Entry flow as community onboarding

The Diplomat's read: **the hub entry should feel like arriving at a gathering, not passing a security checkpoint.** The charge capture at entry is the "I've arrived and I'm bringing something" gesture, not a toll. The ritual should be:

1. Arrive at `/campaign/hub`
2. If no recent charge (>48h): gentle prompt — "What are you bringing today?" (captures a micro-charge)
3. Commit move: "I'm here to Wake Up / Clean Up / Grow Up / Show Up" (pre-filled from `playerMoveContext`, editable)
4. Enter spoke CYOA seeded with that move + today's charge context

The Diplomat also notes: **showing other players at a landing** (the "presence" feature in CHS spec) is the social glue that makes the campaign map feel alive. Even a simple "3 players have reached this landing this period" counter transforms the experience from solo to collective.

---

### Sage — Integration synthesis

The Sage named two **generative dependencies** — items that, once resolved, eliminate the need for several downstream specs:

1. **CampaignDeck DB model** (GJ-adjacent) — once this exists, DSBD, CSG, and PDH all have a foundation to draw from
2. **Quest resolution at landing** — once `takeQuest + getQuestRoleResolution + landing` is wired, the gameboard's "complete" flow and the hub/spoke system share the same resolution contract

The Sage's hexagram alignment (27 — Nourishment) is precise: **build the feed before the feast.** The five questions share one root: there is no stable *draw surface* yet. Everything else follows once the deck is a real model and the hub knows how to draw from it.

---

## Concrete Design Decisions

### 1. Campaign Deck Model

**Decision:** `CampaignDeck` is a scoped view of `CustomBar` records filtered by `campaignRef + allyshipDomain`. The deck itself requires only a lightweight header model; cards are the existing quest rows.

**Schema additions needed:**
- `CampaignDeck` table (minimal: id, instanceId, campaignRef, domain, topology, status)
- `DeckPeriodDraw` table (id, deckId, periodRef, questId, slotIndex, dealtAt, completedAt?)

**Draw mechanic:** "Deal 8" = `db.customBar.findMany({ allyshipDomain, campaignRef, NOT already dealt in current period }, take: 8, orderBy: random)`. Returns a `DeckPeriodDraw[]`. On completion, `completedAt` is set and a new draw fires to fill that slot.

**Not Dominion-style (private hand).** The campaign deck is a *shared deal* — all players see the same 8 gameboard slots for a period. Individual hands (PDH) are a separate layer for the Scene Atlas / archetype-nation decks.

---

### 2. Entry into the Campaign Map

**Decision:** Charge → Move Declaration → Spoke CYOA entry.

**Flow:**
1. `/campaign/hub` loads and calls `getPlayerMoveContext(playerId)` + `getVaultContext(playerId)`
2. `hasRecentCharge` (last 48h) → if false, show micro-charge capture inline (single emotion chip + summary field)
3. Move picker (pre-filled from `playerMoveContext.recommendedMoveType`, editable) — persisted to `CampaignHubEntry` record
4. Player selects a spoke → adventure loads with `{ chargeContext, moveType, vaultContext }` passed as `SessionContext` to the CYOA

**`CampaignHubEntry` record** (in-session): `{ playerId, campaignRef, moveType, chargeBarId, enteredAt }` — no schema change needed if stored in `Instance` JSON field or a new lightweight table.

---

### 3. Vault Context in the Map

**`VaultContext` shape** (loaded at hub entry, passed through to CYOA passages):

```typescript
interface VaultContext {
  activeQuestCount: number
  completedQuestMoveTypes: string[]   // ['wakeUp', 'cleanUp', ...]
  staleBarsCount: number
  recentChargeEmotion: string | null  // 'anger' | 'sadness' | etc.
  currentMoveType: string | null      // recommended from playerMoveContext
  vaultCapacityUsed: number           // current items vs cap
  vaultCapacityMax: number
  canEmitMore: boolean                // false = hard gate
}
```

**How it's used in CYOA:**
- `canEmitMore: false` → hard-block vault-overflow passages (existing spec decision)
- `currentMoveType` → highlight matching branch + seed passage copy ("You're in Clean Up mode")
- `completedQuestMoveTypes` → gate Show Up branch (needs Grow Up completed), gate Grow Up (needs Clean Up)
- `recentChargeEmotion` → NPC tone + alchemy routing

**Loading:** `getVaultContext(playerId)` is a lightweight server function (no new schema) combining: `PlayerQuest` counts, `CustomBar` stale query, `VaultLimit` caps, and `derivePlayerMoveContext()`.

---

### 4. Quest Generation and Resolution at Landings

**Landing orchestration (3-step UX):**

```
[Landing Page] ─ loads ─> top 3 recommended quests (GC)
                          + "Generate from Hexagram N" button (GH/generate-quest)
                          + active quests in this domain (take action)
```

**Take quest:** calls `takeQuest(questId)` (GB) → `PlayerQuest.status = 'assigned'`

**Quest card on landing shows:**
- Quest title + moveType badge
- `getQuestRoleResolution(questId)` → steward name, RACI roles, `QuestLifecycleState`
- Complete button → `markPlayerQuestComplete(questId)` → issues vibulon + updates `DeckPeriodDraw.completedAt` → triggers new draw

**Generate from hexagram:** calls existing `generateQuestFromReading(hexagramId, null, { campaignRef })` — the spoke's hexagram ID is passed from the landing context. Returns a quest pre-linked to the campaign.

**Compost:** if quest is stale or wrong fit, `VaultCompost` modal (VCM) is triggered in-landing. Player composts and landing re-queries.

---

### 5. Four Moves on the Map

**Decision:** Every spoke adventure has a **move selector node as its first passage**. Four branches (Wake Up / Clean Up / Grow Up / Show Up) fan out from it. Each branch has 3 nodes: *recognition* → *action step* → *landing*.

**Passage tagging:**
- `Passage.moveType` = 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp' (already in schema)
- Branch root passages each carry `moveType` + a `prerequisite` JSON field (read by the CYOA engine to decide highlight vs. gate vs. open)

**Prerequisite logic (in CYOA session context, not DB):**
```
wakeUp:   always available
cleanUp:  requires recentCharge (emotion present)
growUp:   requires ≥1 completedQuestMoveTypes.includes('cleanUp')
showUp:   requires ≥1 completedQuestMoveTypes.includes('growUp')
```

**UX:** The non-available branches are shown with a soft lock icon and a one-line explanation ("Complete a Clean Up quest first"). Not hidden — visible as aspirational paths. This is the Challenger's constraint satisfied.

**On completion of a move-typed branch:** the `moveType` is recorded on the `DeckPeriodDraw` slot that gets dealt next — so the next quest drawn for that player skews toward the same move type, creating momentum.

---

## Resulting Spec Work

Three things need to exist before CHS becomes `[ ] Ready` (currently `[ ] Future`):

| Spec | What it unlocks |
|------|----------------|
| **campaign-domain-decks** (already has spec, needs impl) | `CampaignDeck` model + `drawFromDeck()` action — the feed |
| **campaign-kotter-domains** (already has spec, needs impl) | Period/stage filtering for deck draws |
| **CHS Phase 0** (new tasks) | `VaultContext` loader, `CampaignHubEntry` record, spoke CYOA move selector passage template |

The GAI chain (GA→GB→GC→GH→GI) is now done. The next layer is the **deck + map layer**: `campaign-domain-decks` → `campaign-kotter-domains` → CHS Phase 0.

**DSBD, CSG, PDH** (personal deck/hand system) remain separate from the campaign deck — they feed the Scene Atlas, not the hub/spoke system. Don't merge them.

---

## Recommended Implementation Order

1. **campaign-domain-decks** — implement `CampaignDeck` + `DeckPeriodDraw` schema + `drawFromCampaignDeck()` action
2. **campaign-kotter-domains** — implement period/stage filtering + Kotter × Domain quest prompts
3. **CHS Phase 0** — `getVaultContext()`, `CampaignHubEntry`, spoke CYOA move-selector template node
4. **CHS Phase 1** — landing page: GC quest recommendations + GB `takeQuest` + quest resolution
5. **VCM** (Vault Compost Mini-game) — in-landing modal compost (needed for vault gate to work on spokes)

---

*Strand generated: 2026-03-22. Agents consulted: Shaman (full), Architect (partial/deterministic), Diplomat (full), Regent (partial), Sage (partial/rate-limited). Challenger and missing Regent signals filled from BARS domain knowledge.*
