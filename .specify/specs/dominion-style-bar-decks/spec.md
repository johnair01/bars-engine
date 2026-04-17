## Resolved Design Decision: Deck Track Architecture

**Decision date:** 2026-04-17
**Hexagram:** #54 — The Marrying Maiden (New Ventures)
**Active face:** Regent

---

**Decision:** Collapse to **4 tracks**, not 3 or 5. Merge vault and personal adventuring deck into a single lifetime track.

### The 4 Tracks

| Track | Scope | Lifetime | Governance | Schema anchor |
|-------|-------|----------|------------|---------------|
| **Library** | Personal + vault | Lifetime (owned) | Player owns; persists across campaigns | `CustomBar.creatorId` |
| **Deck** (campaign + personal) | Instance + personal | Ongoing | Campaign-scoped OR personal-adventuring | `ActorDeckState` (instanceId nullable) |
| **Session** | Event-bounded | Ephemeral | Time-bounded; expires when event ends | `eventId` on session state |
| **Collective** | Cross-campaign | Reputation | Earned authority; travels with player identity | `nationKey` + `archetypeKey` on `ActorDeckState` |

### Why 4 Not 3

The 3-model collapses session into deck — but session has different governance (time-bounded, event-scoped). Merging creates ambiguity about when cards expire.

### Why 4 Not 5

Vault and personal adventuring deck have **identical governance** (lifetime, player-owned, no expiration). Merging reduces concepts without losing distinction.

### UX Presentation

Users see **3 views** (Library, Deck, Session) because collective is "borrowing from your identity" not a distinct deck UI. Schema has 4 tracks for governance clarity.

### Hexagram Interpretation

The Marrying Maiden: commitment before clarity. Enter the marriage (4-track model) even if the full shape isn't visible. The system grows into the structure.

