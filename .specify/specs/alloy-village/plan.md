# Pallet Town × Bars-Engine DAOE Bridge: Plan

**Spec:** `.specify/specs/pallet-town-daoebridge/spec.md`
**Phase:** Bridge Pallet Town to bars-engine DAOE infrastructure

---

## Implementation Order

### Phase 1: Forge BAR Bridge (MVP — this session)

**What changes:**

1. **`forgeBAR()` function** — adds async fetch to `/api/daoe/cast-fortune` with fallback simulation
   - File: `pallet-town.tsx` (zo.space route — `write_space_route`)
   - Output: `{ hexagramId, changingLines, guidance, mode: 'live'|'simulated' }`

2. **Hexagram display in BAR modal** — shows result before text input
   - File: same route, modal section
   - Shows: hexagram name/number, changing lines, guidance text
   - Loading state while API call resolves

3. **`pallet-bars` localStorage** — stores all forged BARs with hexagram data
   - Key: `pallet-bars` — JSON array of `{ text, hexagramId, changingLines, guidance, castAt, roomId }`

4. **Archive view** — new menu option showing all forged BARs with barcoded rendering
   - Modal with scrollable list of all bars
   - Hexagram art + text + date per bar

5. **Hexagram on room complete** — room sealed banner shows hexagram result

**File impact:**
```
wendellbritt.zo.space/pallet-town (rewrite — full route)
```

**Verification:** Manual test: enter Room of Inquiry, press Forge BAR, see hexagram result, complete room, re-enter and see VIEW mode.

---

### Phase 2: NPC Personality Bridge (before pitch demo)

**What changes:**

1. **3-question intake modal** — appears before entering first room
   - Stage: wakeUp / cleanUp / growUp / showUp
   - Preferred GM face: shaman / challenger / regent / architect / diplomat / sage
   - Developmental itch: free text (50 chars)
   - Stored in `localStorage['pallet-personality']`

2. **NPC dialogue flavor** — shift NPC text based on preferred GM face
   - NPC config already has `faceId` — use it to flavor dialogue
   - Room of Inquiry NPC faceId = 'architect' → dialogue leans into strategic design language

3. **Register labels** — room entrance shows register type
   - Room of Inquiry → "FORTUNE REGISTER"
   - Room of Shadows → "KARMA REGISTER"
   - Library → "ARCHIVE"
   - Dojo → "ALLYSHIP TRAINING"

**File impact:**
```
wendellbritt.zo.space/pallet-town (edit)
```

---

### Phase 3: Archive View (bonus)

**What changes:**

1. **Archive menu option** — HUD button showing bar count
2. **Archive modal** — scrollable grid of all forged BARs
3. **Hexagram art** — pixel-art rendering of each hexagram using bar-artifact tile style

**File impact:**
```
wendellbritt.zo.space/pallet-town (edit)
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **API call timing** | Async on Forge BAR press — not on room enter | Keeps room entrance instant. Only the forge action triggers the bridge. |
| **Fallback** | Client-side I Ching simulation if API unreachable | Demo must work even if bars-engine is slow/offline. The simulation produces the same output shape. |
| **State storage** | `pallet-bars` key in localStorage | Extends existing pattern. No new storage mechanism needed. |
| **Hexagram art** | Pixel-art rendering using existing tile/CSS system | No new image assets. Use the existing `BarPattern` / `BarcodedText` components. |
| **No auth** | Anonymous session | MVP pitch demo. No player identity needed. |
| **No new bars-engine endpoint** | Uses existing `/api/daoe/cast-fortune` | Already implemented in DAOE Phase 2. Zero new backend work. |

---

## Out of Scope (Phase 2+)

- Real NPC dialogue generation (AI) — static scripts only for MVP
- Twine Drama register integration
- Player identity persistence
- JWT / subscription kill-switch
- bars-engine campaign sync

---

*Plan produced: 2026-04-27*