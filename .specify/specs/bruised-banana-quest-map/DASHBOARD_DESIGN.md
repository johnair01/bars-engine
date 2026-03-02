# Dashboard Design: Argyran Bold Heart Teal Lens

**Persona:** Argyran Bold Heart Teal Level player, Bruised Banana Campaign  
**Design philosophy:** Everything is a card. Mobile first. Depth over overview. Scarce, potent, immersive. BARs as talismans. Ubuntu, Apple, LCARS, Star Wars. Light skeuomorphism toward sacred objects.

**Problem:** Dashboard clutter. Too many sections, labels, links. Overwhelms on mobile. Overview kills immersion.

**Goal:** Increase deftness for players, agents, and game master. Courage and curiosity.

---

## Current Clutter (Audit)

| Section | Purpose | Clutter factor |
|--------|---------|----------------|
| Header (avatar, name, contact) | Identity | Medium — could compress |
| Act clock + Kotter gauge + Vibeulons | State | High — three widgets, lots of labels |
| Nation, Archetype, Roles, Story, Library | Identity + nav | High — five pills |
| IntentionDisplay | Context | Low |
| MovementFeed | Social proof | Medium — scrollable |
| Ritual / Orientation / Event / Welcome / Setup banners | Conditional | High — many banners, each with copy |
| Journeys (Threads + Packs) | Active paths | Medium |
| Active Quests | Current work | Core |
| Bars Wallet (Inspiration) | Secondary | Medium |
| Available Quests (My BARs, Market) | Nav | Medium — two cards + four create actions |
| I Ching Caster | Tool | Medium |
| Character Moves (4 basic + special + elemental) | Reference | High — many cards |
| Graveyard | Archive | Medium — low priority, dimmed |

**Total:** ~15+ distinct sections. On mobile, 3–4 screens of scroll before you see your active quest.

---

## Design Principles (from philosophy)

1. **One thing at a time** — Depth. The screen answers one question: "What now?"
2. **Cards as talismans** — Each card is potent. Tap to go deep. No filler.
3. **Full bleed on mobile** — Use the edges. No wasted chrome.
4. **Symbols over text** — LCARS/Star Wars: data-dense, label-sparse. ♦ for vibeulons. ⚡ for urgency.
5. **Progressive disclosure** — Default: the essential. Swipe or tap to reveal more.
6. **Admin = bird's eye** — Player dashboard is NOT admin. Players get immersion; admins get overview elsewhere.

---

## Proposed: Focus Stack

**Concept:** The dashboard is a **stack of cards**. One card is primary (full attention). Others are **peek** — a sliver or icon. Swipe or tap to bring a card forward.

### Primary card (default): THE TALISMAN

**What it is:** Your current quest or campaign focus. For Bruised Banana: "Rally the Urgency" — the stage, the quest, the one thing that matters now.

- **Mobile:** Full screen. Quest title. One line of context. One primary action (Open / Complete / Add subquest).
- **Desktop:** Centered card, generous whitespace. Same hierarchy.
- **Feels like:** A talisman. Sacred. "This is what I'm holding."

### Peek cards (stacked behind or beside)

| Card | Peek (minimal) | Full (on tap) |
|------|----------------|---------------|
| **Campaign** | Progress bar (%), stage name | Event page, goal, lore |
| **Hand** | Vibeulon count ♦, quest count | Wallet, BARs, hand |
| **Moves** | One icon (current move) | 4 moves, special, elemental |
| **Story** | "Begin" or current thread | Journeys, orientation |
| **Archive** | — | Graveyard, completed |

**Rule:** No more than 4–5 peek cards visible. Each peek = one tap to go deep.

---

## Mobile-First Layout

```
┌─────────────────────────────┐
│ [≡]  BARS ENGINE      [♦ 12]│  ← Nav: minimal. Vibeulons as symbol.
├─────────────────────────────┤
│                             │
│   ┌─────────────────────┐   │
│   │  RALLY THE URGENCY   │   │  ← THE TALISMAN (primary card)
│   │  Stage 1 · 23%       │   │     Campaign stage + %
│   │                     │   │
│   │  Name what's at      │   │     One quest or focus
│   │  stake. One thing.   │   │
│   │                     │   │
│   │  [ Open Quest → ]    │   │     One action
│   └─────────────────────┘   │
│                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  Peek: [👁][🧹][🌱][🎯]     │  ← Moves as icons. Tap = expand.
│  Peek: [Story] [Market]     │     Story, Market = one tap each.
│                             │
└─────────────────────────────┘
```

**Scroll:** Only if needed. Primary card fits above fold. Peeks are a single row.

---

## Deftness: What Each Actor Needs

| Actor | Deftness need | How dashboard serves it |
|-------|---------------|-------------------------|
| **Player** | "What do I do next?" | One talisman. One action. No cognitive load. |
| **Agent** | Structured state | Primary card = clear focus. Campaign stage, quest ID, instance. |
| **Game Master** | Bird's eye | Admin dashboard. Not the player home. Separate /admin. |

**Player courage/curiosity:** The talisman invites. "This is yours. What will you do?" Not "Here are 12 sections."

---

## Concrete Changes (from current → proposed)

### Remove or collapse

- **Act clock + Kotter gauge:** Merge into campaign card. "Stage 1" is enough. % is enough. Link to story-clock for depth.
- **Nation, Archetype, Roles pills:** Collapse into avatar tap. Identity on demand.
- **MovementFeed:** Move to Wallet or Event. Not home.
- **Multiple banners:** One banner slot. Highest priority wins (Ritual > Orientation > Event > Setup).
- **Create actions (4):** One "Create" card. Tap → modal or sheet with options.
- **Character Moves grid:** Peek = 4 icons. Tap = full moves sheet.
- **Graveyard:** Hidden by default. "Archive" in nav or footer.

### Add or emphasize

- **Campaign talisman:** When instance active, the primary card IS the campaign focus (stage + quest). Not buried below 8 sections.
- **One primary action:** Per card. "Open." "Complete." "Add subquest." No dropdown of six things.
- **Symbol system:** ♦ vibeulons. ⚡ urgency. 🤝 coalition. Consistent across app.

### Card anatomy (LCARS / Star Wars inspired)

- **Border:** Thin. Angular corners (slight). Color = state (teal = active, amber = attention).
- **Content:** Title. One line. One action. No paragraphs.
- **Tap target:** Minimum 44px. Full card tappable.

---

## Spec Implications

- New dashboard layout component: `FocusStack` or `TalismanDashboard`
- Primary card: `CampaignTalisman` (when instance) or `QuestTalisman` (active quest)
- Peek row: `PeekStrip` — icons + labels, horizontal scroll on mobile
- Banners: Single `BannerSlot` — renders highest-priority banner
- Create: Single `CreateCard` — tap opens action sheet (Create BAR, Create Quest, Quick Quest)

---

## Out of Scope (this doc)

- Full implementation plan
- Admin dashboard (separate)
- Visual design (colors, fonts) — use existing system, apply principles
