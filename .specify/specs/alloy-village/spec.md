# Alloy Village — DAOE Bridge
## Spec Kit

**Spec Kit ID:** `alloy-village`
**Version:** 0.2.0
**Date:** 2026-04-27
**Status:** Draft — for approval
**Owner:** Council of Game Faces
**Parent:** `docs/plans/PALLET_TOWN_GAP_ANALYSIS.md`
**Previous name:** Pallet Town (placeholder — renamed to Alloy Village per Sage/Regent brainstorm + user vote)

---

## Purpose

Alloy Village is a pixel-art RPG running in a browser tab on your personal Zo Space. It is the visual demo for bars-engine's DAOE architecture — immediately playable, memorable, Harvest Moon-cozy. When a player forges a BAR inside the game, it fires against the real bars-engine API, returns a genuine I Ching hexagram, and stores the result. The pixel art is the demo. The DAOE is the proof.

**Problem:** The "Forge BAR" button was decoupled from bars-engine — it saved text to localStorage and rendered a barcode. Executives played a toy. Now it fires a real Fortune register invocation.

**Why this matters:** The pitch proves bars-engine's architecture works in a form executives can experience in 60 seconds. "You played the game, the system cast the I Ching, and your hexagram is now in bars-engine."

---

## Design Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| **Aesthetic** | Harvest Moon cozy village | Warm, earthy, inviting — not dark dungeon crawler. Harvest Moon nostalgia sells the developmental angle. |
| **Village name** | Alloy Village | The synthesis thesis in a place name. "Alloy" = multiple metals → one stronger whole. |
| **Bridge direction** | Alloy Village calls bars-engine | The game initiates; the API responds. No bars-engine code changes needed for MVP. |
| **API endpoint** | `POST /api/daoe/cast-fortune` | Already built in DAOE Phase 2. No new endpoint. |
| **Fallback** | Client-side I Ching simulation if bars-engine unreachable | Demo must work offline. Simulation returns same hexagram-shaped output. |
| **State storage** | localStorage + bars-engine reference | Village remains fully offline-capable. API call enriches state, doesn't replace it. |
| **NPC dialogue** | Not in MVP | Focus: Forge BAR → I Ching cast. NPC adaptation deferred to Phase 2. |
| **Player identity** | Anonymous for MVP | Single-session experience. No auth. |
| **Register visibility** | Fortune register shown | I Ching cast result displayed prominently. The randomness IS the feature. |

---

## Harvest Moon Aesthetic

### Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Overworld grass | Warm moss green | `#7ec850` |
| Dirt path | Wheat brown | `#d8a060` |
| Tree canopy | Deep forest | `#2d5a1b` |
| Water/river | Clear blue | `#5090d8` |
| Village buildings | Warm wood | `#8b5e3c` |
| Mill (was Inquiry) | Stone grey-brown | `#9a8060` |
| Hearth (was Shadows) | Warm amber-brown | `#c06030` |
| Archive (was Library) | Parchment gold | `#d0a820` |
| Dojo | Dark timber | `#503820` |
| BAR artifact (undone) | Forge orange | `#e09030` |
| BAR artifact (done) | Harvest green | `#40c060` |
| Exit portal | River blue | `#60b0d0` |

### Typography

- Font: `Press Start 2P` (pixel art)
- Google Fonts CDN import
- HUD: 7-8px
- Body/dialogue: 5-6px
- Buttons: 6px

### Animation

- NPC bounce: 1s ease-in-out infinite (gentle bob)
- Portal pulse: 1s ease-in-out (slow glow)
- BAR glow: 1.5s ease-in-out (forge heat shimmer)
- Room transition fade: 400ms

---

## Game Mechanics

### Map Structure

```
┌──────────────────────────────────┐
│  🌲🌲🌲    MILL    ARCHIVE  🌲🌲  │
│  🌲  [MILL]  [ARCHIVE]     🌲🌲  │
│     [HEARTH]    🌲              │
│  ═══════PATH══════════════       │
│     🌲🌲🌲    [DOJO]  🌲🌲🌲     │
│         [DOJO]                   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ~~~~RIVER/RANCH~~~~            │
│     [VILLAGE CENTER PATH]        │
│          ↑ PLAYER STARTS         │
└──────────────────────────────────┘
```

### Rooms

| Room | NPC | BAR Artifact |
|------|-----|-------------|
| **The Mill** | Mill Guide [architect] | Encode truth |
| **The Hearth** | Memory Keeper [shaman] | Alchemize shadow |
| **The Archive** | Elder Archivist [regent] | Catalogue wisdom |
| **The Dojo** | Dojo Master [challenger] | Train in practice |

### Phase 1: DAOE Bridge

When `submitBar()` fires:

```
1. POST /api/daoe/cast-fortune { campaignId, intent: barText }
   ↓
2. If 200: show hexagram result (id, name, narrative)
   If network error: client-side I Ching simulation
   ↓
3. Store { barText, hexagramId, hexagramName, source } in localStorage
```

Hexagram display in the BAR modal (after forge):
- Pixel-art hexagram grid
- Hexagram name in barcode text
- Brief narrative guidance
- "Bars-Engine LIVE" or "Village Simulation" badge

---

## API Contract

### `POST /api/daoe/cast-fortune`

**Request:**
```json
{ "campaignId": "demo-alloy-village", "intent": "I am here because..." }
```

**Response:**
```json
{
  "hexagram": {
    "hexagramId": 26,
    "changingLines": [2],
    "resultingHexagramId": 44,
    "narrativeGuidance": "The Creative exerts its influence.",
    "registeredAt": "2026-04-27T..."
  }
}
```

**Simulation fallback** (if bars-engine unreachable):
```json
{
  "simulation": true,
  "hexagram": { "hexagramId": 31, "changingLines": [], "narrativeGuidance": "...", "registeredAt": null }
}
```

---

## Persistence

| Key | Content | Notes |
|-----|---------|-------|
| `alloy-village-v1` | GameState | Survives across sessions |
| `alloy-forge-{roomId}` | `{ text, hexagramId, hexagramName, source, forgedAt }` | Written on forge |

---

## Dependencies

- `bars-engine/src/app/api/daoe/cast-fortune/route.ts` (Phase 2 — must be deployed)
- Zo Space (no additional dependencies)

---

## Out of Scope

- Bars-engine authentication (anonymous MVP)
- NPC tone weights (Phase 2)
- Bars-engine campaign persistence (MVP is demo-only)
- Multi-session progression
- Sound effects

---

*Rename history: Pallet Town (placeholder) → Alloy Village (2026-04-27)*
