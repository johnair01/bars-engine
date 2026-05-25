---
type: spec
spec_kit_id: oracle-deck-reader
title: "Oracle Deck Reader — bars-engine"
created: 2026-05-25
status: draft
tags:
  - oracle
  - casey-birthday-deck
  - reader
  - bars-engine
related:
  - src/app/oracle/page.tsx
  - public/oracle/deck.json
  - public/oracle/images/
---

# Spec: Oracle Deck Reader

## Purpose

A reader-mode page at `/oracle` for Casey's Oracle at the Edge of the Known World — a 52-card, 4-suit deck with NPC flavor text and 3 difficulty modes. Serves the published deck snapshot only (no editing, no publishing). Read-only companion to the allyship-deck.

**Problem**: Casey's deck was built in Cursor with a local editor pipeline. Zo.spaces cannot host the multi-component editor app reliably. bars-engine becomes the permanent home for the reader experience.

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| Data source | `public/oracle/deck.json` (static, committed) |
| Images | Served from `public/oracle/images/` (52 PNGs, 2.5x3.5 in, crop-framed) |
| Mode | Reader-only. No editor, no publish flow. |
| Difficulty | Easy / Medium / Hard per card. Easy shows prompt + quote; Hard adds NPC name + title. |
| Suit navigation | Tab bar: Wake Up → Clean Up → Grow Up → Show Up |
| Card view | Grid of 13 cards per suit; click flips card face-down to reveal NPC quote + prompt |
| Shuffle | Single-card draw from full 52 with shuffle reset |
| Image strategy | `NEXT_PUBLIC_IMAGE_DOMAINS` allows `assets.zo.computer` CDN for images |

---

## Conceptual Model

**WHO**: Casey (the recipient) + anyone with the link  
**WHAT**: A card oracle — draw or browse, then read the prompt at chosen depth  
**WHERE**: Single page at `/oracle`  
**Energy**: None (stateless reader)  
**Personal throughput**: Card-based reflection — Wake Up = attention, Clean Up = clarity, Grow Up = skill, Show Up = presence  

---

## User Stories

### P1: Browse by suit

**As a reader**, I want to see all cards in a given suit so I can explore what resonates.

**Acceptance**: Clicking a suit tab shows 13 cards (A, 2–10, J, Q, K) in a grid.

### P2: Flip a card

**As a reader**, I want to flip a card and read the NPC flavor text and prompt so I can engage with the deck's guidance.

**Acceptance**: Clicking a card face shows the card back + depth selector; depth selection reveals the appropriate prompt + NPC attribution.

### P3: Shuffle and draw

**As a reader**, I want to draw a single random card from the full deck so I can get an unfiltered prompt.

**Acceptance**: Shuffle button draws from all 52; drawn card shows with full NPC + prompt at hard depth.

---

## Data Shape

```ts
type FlavorBlock = {
  line: string   // the quote
  npc: string    // character name
  title: string  // character title
}

type Card = {
  id: string          // e.g. "WU-A"
  suit: {
    name: string      // "Wake Up"
    color: string     // hex
    icon: string      // svg path or inline
  }
  rank: string        // A, 2-10, J, Q, K
  image: string       // path to PNG in public/oracle/images/
  flavor: {
    easy: FlavorBlock
    medium: FlavorBlock
    hard: FlavorBlock
  }
  prompts: {
    easy: string
    medium: string
    hard: string
  }
}
```

---

## Functional Requirements

### Phase 1: Core reader

- **FR1**: Suit tab bar (4 tabs) with suit colors and icon SVGs
- **FR2**: Card grid — 13 cards per suit, showing card face image
- **FR3**: Card flip — clicking a card shows back with depth selector (Easy / Medium / Hard)
- **FR4**: Prompt reveal — selecting depth shows NPC quote + prompt text
- **FR5**: Shuffle mode — "Draw a card" button draws random from full 52, shows at hard depth
- **FR6**: Return to grid from flip — close/back button returns to suit grid
- **FR7**: "Made for Casey" attribution in footer
- **FR8**: Card back image used in shuffle/flip view

---

## Non-Functional Requirements

- **Perf**: Deck JSON is 164KB. Load once on mount; keep in React state. No refetch.
- **Images**: All 52 card images are pre-uploaded to `public/oracle/images/`. Each ~300KB max.
- **No auth**: `/oracle` is publicly accessible (no login gate).
- **No SSR data**: Deck loads client-side via `fetch('/oracle/deck.json')`.

---

## Persisted Data

None. This is a read-only static experience. No Prisma changes required.

---

## Dependencies

- `public/oracle/deck.json` — committed copy of published deck
- `public/oracle/images/` — 52 card PNGs
- No backend changes

---

## Asset Checklist

- [ ] `public/oracle/deck.json` — copied from `The Library/04 Quests/Casey's Birthday Deck/published/deck.json`
- [ ] `public/oracle/images/` — 52 PNGs copied
- [ ] `public/oracle/card-back.png` — card back image
- [ ] `src/app/oracle/page.tsx` — the route (this spec)