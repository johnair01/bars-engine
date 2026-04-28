# Pallet Town × Bars-Engine DAOE Bridge: Tasks

**Spec:** `.specify/specs/pallet-town-daoebridge/spec.md`
**Plan:** `.specify/specs/pallet-town-daoebridge/plan.md`

---

## Phase 1: Forge BAR Bridge (MVP)

### Task 1.1: Add `forgeBAR()` function
**File:** `wendellbritt.zo.space/pallet-town` (via `write_space_route`)

Add `forgeBAR()` before the component:
```ts
async function forgeBAR(roomId: string): Promise<{
  hexagramId: string; changingLines: number[]; guidance: string; mode: 'live' | 'simulated'
}> {
  // Try bars-engine API
  try {
    const res = await fetch('/api/daoe/cast-fortune', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: 'pallet-town-demo', intent: roomId }),
    })
    if (res.ok) {
      const data = await res.json()
      return {
        hexagramId: data.hexagram.hexagramId,
        changingLines: data.hexagram.changingLines,
        guidance: data.hexagram.narrativeGuidance,
        mode: 'live',
      }
    }
  } catch { /* fall through */ }

  // Fallback: client-side I Ching simulation
  const lines = Array.from({ length: 6 }, () => (Math.random() < 0.5 ? 0 : 1))
  const hexId = 1 + lines.reduce((a, b, i) => a + b * Math.pow(2, i), 0)
  const changing = lines.map((b, i) => b === 1 ? i + 1 : -1).filter(n => n > 0)
  const hexagrams = ['Hexagram 1','Hexagram 2','Hexagram 3','Hexagram 4','Hexagram 5','Hexagram 6','Hexagram 7','Hexagram 8','Hexagram 9','Hexagram 10','Hexagram 11','Hexagram 12','Hexagram 13','Hexagram 14','Hexagram 15','Hexagram 16','Hexagram 17','Hexagram 18','Hexagram 19','Hexagram 20','Hexagram 21','Hexagram 22','Hexagram 23','Hexagram 24','Hexagram 25','Hexagram 26','Hexagram 27','Hexagram 28','Hexagram 29','Hexagram 30','Hexagram 31','Hexagram 32','Hexagram 33','Hexagram 34','Hexagram 35','Hexagram 36','Hexagram 37','Hexagram 38','Hexagram 39','Hexagram 40','Hexagram 41','Hexagram 42','Hexagram 43','Hexagram 44','Hexagram 45','Hexagram 46','Hexagram 47','Hexagram 48','Hexagram 49','Hexagram 50','Hexagram 51','Hexagram 52','Hexagram 53','Hexagram 54','Hexagram 55','Hexagram 56','Hexagram 57','Hexagram 58','Hexagram 59','Hexagram 60','Hexagram 61','Hexagram 62','Hexagram 63','Hexagram 64']
  return {
    hexagramId: String(hexId),
    changingLines: changing,
    guidance: `Inquiry deepens. Your truth awaits encoding.`,
    mode: 'simulated',
  }
}
```

**Verify:** Function exists, compiles, fetch call targets correct endpoint.

---

### Task 1.2: Add `pallet-bars` state
**File:** `wendellbritt.zo.space/pallet-town`

Add to GameState interface:
```ts
barsState: Record<MapId, { text: string; hexagramId: string; changingLines: number[]; guidance: string; castAt: string }>
```

Add localStorage key `SK_BARS = 'pallet-bars'` and load/save functions.

---

### Task 1.3: Update BAR modal to show hexagram result
**File:** `wendellbritt.zo.space/pallet-town`

When `s.barModalOpen && !done`:
1. Show loading state: "CASTING..." with animated dots
2. On hexagram result: display hexagram name + number above text input
3. Show changing lines count + guidance text as flavor
4. Remove "Ctrl+Enter to forge" — replace with "Ctrl+Enter to encode your truth"

**Verify:** Modal shows hexagram before text input appears.

---

### Task 1.4: Store hexagram in `pallet-bars` on submit
**File:** `wendellbritt.zo.space/pallet-town`

On `submitBar()`:
1. Fetch hexagram before storing (Task 1.1)
2. Save `{ text, hexagramId, changingLines, guidance, castAt: new Date().toISOString(), roomId: s.map }` to `pallet-bars` array
3. Continue with existing room completion logic

---

### Task 1.5: Add Archive view
**File:** `wendellbritt.zo.space/pallet-town`

1. Add `archiveOpen: boolean` to GameState
2. Add Archive button to HUD (next to RESET)
3. Archive modal: scrollable list of all `pallet-bars` entries
4. Each entry shows: room name, hexagram art, text (barcoded), date, mode badge ('LIVE' or 'SIM')

**Verify:** Archive shows all 4 rooms when completed.

---

### Task 1.6: Show hexagram on room complete
**File:** `wendellbritt.zo.space/pallet-town`

When room is sealed:
1. Show hexagram name in the success notification
2. Add hexagram art (using BarPattern) in the sealed-room UI
3. Link shows "bars-engine →" routing URL

---

### Task 1.7: Add Fortune register label to Room of Inquiry
**File:** `wendellbritt.zo.space/pallet-town`

In Room of Inquiry HUD or status bar:
- Show "FORTUNE REGISTER" label in gold/yellow color
- Brief: "Randomness shapes the path — trust the cast"

**Verify:** Label appears when in inquiry room, not on overworld.

---

## Phase 2: NPC Personality Bridge (before pitch demo)

### Task 2.1: Add 3-question intake modal
**File:** `wendellbritt.zo.space/pallet-town`

Show on first room enter if `localStorage['pallet-personality']` is empty:
1. Stage: 4 buttons (Wake Up / Clean Up / Grow Up / Show Up)
2. GM Face: 6 face buttons with color dots
3. Itch: single text field (50 char max)

Store to `localStorage['pallet-personality']` as JSON.

**Verify:** Intake only shows once. Re-entering rooms doesn't re-trigger.

---

### Task 2.2: Flavor NPC dialogue based on preferred GM face
**File:** `wendellbritt.zo.space/pallet-town`

Each NPC has `faceId` in config. Add flavor modifier:
- `shaman`: grounded, felt-reality language
- `challenger`: direct, provocation language
- `regent`: orderly, stewardship language
- `architect`: structural, design language
- `diplomat`: relational, bridging language
- `sage`: synthesis language

Prepend 1-2 words to first dialogue line based on faceId.

**Verify:** Different personality profiles produce different NPC dialogue flavor.

---

### Task 2.3: Add register labels to all rooms
**File:** `wendellbritt.zo.space/pallet-town`

- Inquiry → "FORTUNE REGISTER" (red/amber)
- Shadows → "KARMA REGISTER" (blue/purple)
- Library → "ARCHIVE REGISTER" (gold)
- Dojo → "ALLYSHIP REGISTER" (brown/red)

**Verify:** Labels appear in room status bar.

---

## Phase 3: Archive View Enhancement

### Task 3.1: Pixel-art hexagram rendering
**File:** `wendellbritt.zo.space/pallet-town`

Add `HexagramArt({ id, size })` component that renders a pixel-art hexagram using CSS grid or bars. Use the hexagram ID to determine which pattern to show.

**Verify:** Each hexagram (1-64) has a visually distinct pixel pattern.

---

### Verification Checklist (run after each phase)

- [ ] Task 1.1: forgeBAR() compiles without errors
- [ ] Task 1.3: Hexagram shows in modal before text input
- [ ] Task 1.5: Archive shows all completed rooms
- [ ] Task 1.7: "FORTUNE REGISTER" label appears in Room of Inquiry
- [ ] Phase 2: Intake modal only appears once per session
- [ ] Phase 2: NPC dialogue flavor shifts based on preferred GM face
- [ ] All: No regressions — existing Pallet Town gameplay works unchanged
- [ ] All: npm run build passes (if bars-engine changes) / route deploys (zo.space)

---

*Tasks produced: 2026-04-27*