# Vault as a Place — Nested Rooms & the Four Moves

**Status:** Design note (extends [spec.md](./spec.md)).  
**Canon:** The **4 Moves (Personal Throughput)** are defined in [`src/app/hand/moves/page.tsx`](../../../src/app/hand/moves/page.tsx): **Wake Up**, **Clean Up**, **Grow Up**, **Show Up**. Distinct from allyship domains and from the long list of **face-move** mint actions in `FaceMovesSection`.

---

## 1. Problem with “one long page”

The Vault at `/hand` is a **surface**: counts, collapsibles, and load-more help scanability, but they do not give **depth**. A vault should feel like **a place you enter**, not a single scroll. Players need to:

- **Peek** — see what’s here without committing.
- **Step into a room** — a dedicated context for one kind of engagement.
- **Do the move** — leaving the room should mean they took **game-useful** action, not just read a list.

---

## 2. Design intent: rooms by engagement

Organize the Vault into **rooms** (nested routes under `/hand`). Each room answers: *“What kind of work am I doing right now?”*

| Room (concept) | Primary engagement | Typical content |
|------------------|-------------------|-----------------|
| **Lobby** | Orientation | `/hand` — at-a-glance, shallow, links inward |
| **Charges** | Felt signal → BAR/quest | Charge captures |
| **Quests** | Placement & throughput | Unplaced personal quests |
| **Drafts** | Shaping & publishing | Private BAR drafts |
| **Invites** | Relational delivery | Forged invitation BARs |
| **Compost** (future) | Release & salvage | Vault compost loop |

Ordering principle (**“most useful things to the back”**): the **Lobby** stays **calm and shallow** (orientation, counts, next step). **Deeper rooms** hold the **dense** lists and the **strongest** actions — you **earn** depth by choosing a room; the back of the house is where the real work happens. (Alternative read: *least* urgent / *richest* work lives deeper — same IA.)

---

## 3. The Four Moves on every room page

**Requirement:** Each room page is not only a list — it is a **move surface**. Every room implements the **same four moves**, but with **room-specific verbs** so the player continues to make **useful moves in the game**.

| Move | What it means (throughput) | On a room page, players should be able to… |
|------|----------------------------|---------------------------------------------|
| **Wake Up** | See what’s available | See room inventory + status; filters; “what’s stale / new” |
| **Clean Up** | Unblock energy; clear noise | Compost/archive/remove; EFA link where stuck; tidy |
| **Grow Up** | Increase capacity | Edit, merge, level, attach, improve BAR/quest quality |
| **Show Up** | Complete / ship | Place quest, publish BAR, send invite, complete capture → quest |

**UI pattern (target):** A persistent **Four Moves** strip or panel on each room (not only a wiki link): four affordances, each routing to **one primary action** on that page or an adjacent flow.

**Example — Drafts room:**

- Wake Up: “Survey drafts” (expand filters, sort by age)
- Clean Up: “Compost stale drafts” (when Phase C exists)
- Grow Up: “Open editor / attach media”
- Show Up: “Pick up / publish to salad bowl”

**Example — Quests room:**

- Wake Up: “See unplaced quests”
- Clean Up: Archive or merge duplicates
- Grow Up: Edit title / done-means
- Show Up: Place in thread / gameboard

This ties **navigation** to **meaning**: *going to a page* = *entering a room where these four kinds of action are always true*.

---

## 4. Routing sketch (implementation later)

| Route | Room |
|-------|------|
| `/hand` | Lobby (summary, links, no long lists or truncated lists only) |
| `/hand/charges` | Charge captures |
| `/hand/quests` | Unplaced personal quests |
| `/hand/drafts` | Private drafts |
| `/hand/invitations` | Forged invitations |
| `/hand/compost` | Compost (spec Phase C) |

Optional: `/hand/moves` remains the **library**; each room may deep-link to anchors `#wake-up` etc.

---

## 5. Relationship to collapsible sections

Collapsibles on the Lobby are **fine for shallow peeking**. Nested pages are **required** for depth: players who want to **work** open a room; players who want **overview** stay in the Lobby. Do not replace rooms with only accordions.

---

## 6. Open questions

- Exact **copy** for each room’s four verbs (product + Voice Style Guide).
- Whether **Lobby** lists are **teasers only** (3 items + “Open room →”) vs current hybrid.
- How **FaceMovesSection** (challenge, connection, event, …) relates: optional **second row** (“social moves”) vs wiki-only for v1.

---

## Changelog

| Date | |
|------|--|
| 2026-03-21 | Initial design note: nested rooms + four moves per room. |
