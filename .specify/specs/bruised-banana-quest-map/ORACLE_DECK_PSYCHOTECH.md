# Oracle Deck with Teeth — Psychotech & Page Design

**Core psychotech:** The app simulates creating an **oracle deck with teeth** — cards that have consequence, power, meaning. Not decorative; they bite.

**BARs are the cards.** Players draw and interface with BARs. The deck is the player's accumulated inspiration, refined through play.

---

## 1. The Oracle Deck with Teeth

**Teeth** = consequence. When you draw a card, something happens. It matters. The card connects to real world and story world.

- **Real world:** You draw inspiration → you act. The BAR becomes a prompt for action in your life.
- **Story world:** You draw inspiration → you create a quest, contribute lore, play into the campaign. The BAR enters the collective field.

The deck is not a randomizer. It's a **curated collection of charged kernels** — each BAR has accumulated vibes, vibeulons, emotional energy, attention. The more it's been held, the more it's blessed.

---

## 2. BAR Blessedness — Degree of Attention

**"Each BAR is a blessed object to the degree it's had vibes, vibeulons, emotional energy, and attention paid to it."**

| Signal | What it means |
|--------|---------------|
| **Vibes** | Emotional charge (EFA sessions, emotional first aid, vibe checks) |
| **Vibeulons** | Crystallized value — minted from completion, attached to BAR |
| **Emotional energy** | Player sessions, engagement, "this mattered to me" |
| **Attention** | Views, completions, shares, time held in hand |

**Blessedness** = derived metric. A BAR can be:
- **Raw** — Fresh draw. Little charge.
- **Held** — In hand, in play. Accumulating.
- **Blessed** — Has vibes + vibeulons + attention. Sacred. Portable.

**Schema:** Could derive from: VibulonEvent (quest completions), EFA sessions, BarShare, PlayerQuest, time-in-hand. Or a `blessedness` / `weight` field updated on engagement.

---

## 3. One Page: Hand, Library, Story

**Need:** A single page that represents:
- **Hand** — What you're holding. Active. Ready to play.
- **Library** — Your deck. Your collection. All BARs you steward or own.
- **Progress in the story** — Where you are. Campaign stage, journeys, completions.

**Concept:** Unified "Reliquary" or "Deck" page. Three sections (or tabs, or stacked cards):

| Section | What it shows | Feel |
|---------|---------------|------|
| **Hand** | Active quests, BARs in hand, ready to play | "What I'm holding now" |
| **Library** | Your deck (inspiration BARs, completed, blessed objects) | "What I've built" |
| **Story** | Campaign progress, journeys, talismans, maturity | "Where I am in the journey" |

**Mobile:** Single scroll or swipe between sections. Depth over overview. Each section goes deep when you enter it.

---

## 4. Level 1 Unlock — Deck of Many Things

**Gate:** After onboarding (Level 1), player can **draw from their own deck of many things** — inspiration.

**What it means:**
- **Draw** = I Ching cast, or pull from inspiration deck. Creates a BAR (type: inspiration).
- **Deck of many things** = Your accumulated inspiration. BARs you've created, earned, or drawn. The deck grows as you play.
- **Real world:** Draw a card → "What does this ask of me today?" → Act in your life. The BAR is a prompt.
- **Story world:** Draw a card → Forge into quest, contribute to lore, play into campaign. The BAR enters the game.

**Before Level 1:** Player can accept quests, complete, earn vibeulons. Cannot draw from the deck. Cannot create inspiration BARs from I Ching.

**After Level 1:** Player unlocks the draw. The deck becomes available. They can pull inspiration from the hexagram, from their own collection, and use it in both worlds.

---

## 5. Schema / State Mapping

**Existing:**
- `CustomBar` — BARs. type: 'vibe' | 'inspiration' | ...
- `PlayerQuest` — Assignments (quest in hand)
- `Vibulon` — Crystallized value
- `VibulonEvent` — Provenance
- Hand page — Private drafts, active assignments

**To add or clarify:**
- **Hand** = BARs claimed by player + active quests (PlayerQuest status: assigned)
- **Library** = All BARs player stewards + inspiration BARs created by player + completed quests (as records)
- **Blessedness** = Derived or stored. Engagement signals.
- **Level** = Unlock after onboarding. Could be `player.storyProgress.level` or `onboardingComplete` + ritual complete.

**Deck states (from game rules):** Library | Equipped (Hand) | In Play | Compost | Destroyed. Hand = Equipped. Library = your full collection.

---

## 6. Page Structure Proposal

**Route:** `/hand` or `/deck` or `/reliquary`

**Sections:**

### Hand
- Active quests (assigned to you)
- BARs in hand (claimed, ready to play)
- **Draw** button (Level 1+) — "Draw from the deck" → I Ching or inspiration flow
- One primary action per card: Play, Complete, Contribute to lore

### Library
- Your inspiration BARs (type: inspiration)
- BARs you steward
- Completed quests (as archive)
- Blessed objects (talismans, personal)
- Sort/filter: by blessedness, by type, by date

### Story
- Campaign progress (stage, %)
- Journeys (threads, packs)
- Talismans earned
- Maturity signal
- "Where you are" — narrative summary

---

## 7. Design Principles

- **Cards as cards** — BARs render as cards. Drawable. Holdable. Playable.
- **Teeth** — Every draw has consequence. Play into real world or story world.
- **Blessedness visible** — BARs show their charge. A blessed BAR has a different aura than a raw one.
- **Level 1 gate** — Onboarding completes the ritual. Level 1 unlocks the deck. The draw is earned.
- **One page** — Hand, Library, Story. Not three separate pages. One place. Depth when you tap in.

---

## 8. Summary

| Concept | Resolution |
|---------|------------|
| **Oracle deck with teeth** | BARs have consequence. Draw → act. Real world + story world. |
| **BARs as cards** | Players draw, hold, play BARs. The deck is the collection. |
| **One page** | Hand + Library + Story. Unified. Depth on tap. |
| **Level 1 unlock** | After onboarding, draw from deck of many things. Inspiration for both worlds. |
| **BAR blessedness** | Degree of vibes, vibeulons, emotional energy, attention. Derived or stored. |
