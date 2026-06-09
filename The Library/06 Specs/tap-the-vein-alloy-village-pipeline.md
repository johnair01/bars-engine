# Tap the Vein × 321 × Alloy Village — Pipeline Spec
**Status:** Draft
**Owner:** Architect
**Created:** 2026-04-28
**Parent spec:** `tap-the-vein-321-to-pallet-town-bridge.md`
**Naming note:** "Pallet Town" renamed to "Alloy Village" (confirmed in parallel chat, 2026-04-27). Existing `/alloy` route reflects this.

---
See also: [[KEYTERM-TAP-THE-VEIN.md]]


- [[KEYTERM-TAP-THE-VEIN]]

## 0. What This Spec Covers

The full pipeline from daily shadow practice (Tap the Vein) through emotional alchemy (321) into the game world (Alloy Village), ending in daemon emergence.

```
Tap the Vein (daily write)
    ↓ distill (optional 321)
    ↓ CTA "Enter the Village" — direct drop warp
    ↓ Alloy Village (game world)
        ↓ The Lab building
            ↓ Distillery (sub-room) — extraction
            ↓ Refinery (sub-room) — refinement + forging
    ↓ charge accumulates across sessions
    ↓ daemon emerges when: player misses quest deadline (rhythm broken = charge signal)
```

---

## 1. Key Decisions from This Session

| Decision | Answer |
|---|---|
| World name | Alloy Village (not Pallet Town — renamed in parallel chat) |
| New building | The Lab — larger building with two sub-rooms: Distillery + Refinery |
| Entry mechanism | CTA "Enter the Village" → direct warp drop (not navigation through overworld) |
| Auth requirement | Sign-in required — state persists across sessions |
| Daemon trigger | Player misses quest deadline = rhythm broken = charge present → daemon emerges |
| Distill routing | Can go to Alloy Village without 321 |

---

## 2. Routing Map

### Entry Path A: Tap the Vein → Distill → Alloy Village

```
Tap the Vein (/tap-the-vein)
    ↓ word count ≥ 750, analytics run
    ↓ "Hone the meaning" — player distills BAR phrase
    ↓ CTA "Enter the Village" (always visible)
    ↓ auth gate (Zo sign-in)
    ↓ warp drop → Alloy Village (player appears in The Lab entrance)
```

### Entry Path B: Tap the Vein → 321 → Alloy Village

```
Tap the Vein
    ↓ charge detected (strong/intense)
    ↓ "Begin 321" CTA → /shadow/321 (charge pre-seeded)
    ↓ 321 completion screen
    ↓ CTA "Enter the Village" (on completion screen)
    ↓ auth gate
    ↓ warp drop → Alloy Village (player appears in Room of Shadows OR The Lab, based on charge)
```

### Routing rule for 321 completion → destination

| 321 outcome | Destination in Alloy Village |
|---|---|
| Strong/intense charge, descent completed | Room of Shadows |
| Mild/moderate charge, descent completed | The Lab (Distillery entrance) |
| No charge, no descent | The Lab (Distillery entrance) |

---

## 3. The Lab Building — Structure

The Lab is a **multi-room building** in Alloy Village. It occupies a building slot on the overworld (like Mill, Archive, Hearth, Dojo).

### Overworld placement
- The Lab replaces one existing building slot OR is added as a 5th building
- Door leads to Lab entrance room
- Lab entrance → Distillery OR Refinery (based on what's been done)

### Interior Layout

```
┌─────────────────────────────────────────┐
│  THE LAB — where raw becomes refined    │
├──────────────┬──────────────────────────┤
│  DISTILLERY  │  REFINERY                │
│  (left wing) │  (right wing)            │
│  extraction  │  forging + daemon       │
└──────────────┴──────────────────────────┘
        ↓
   Lab Entrance (connecting room)
        ↓
   Overworld exit portal
```

### Distillery (left wing)
- **Purpose:** Extraction — raw write material is distilled into essence
- **Interaction:** Player distills a phrase (from Tap the Vein queue OR fresh input)
- **BAR artifact:** The Distillery's forge produces a refined BAR
- **Output:** Refined BAR phrase stored in player's inventory

### Refinery (right wing)
- **Purpose:** Final refinement + daemon forging
- **Interaction:** Player takes accumulated refined BARs → transforms them into a daemon
- **Daemon emergence trigger:** When player has 3+ refined BARs AND attempts aligned action but misses deadline → daemon emerges
- **Output:** Daemon entity (evolved from accumulated refined material)

### Lab Entrance (center room)
- Connects Distillery and Refinery
- Shows player's accumulated refined BARs (as visual artifacts on the wall)
- Shows daemon status (if daemon emerged: daemon sprite present; if not: "daemon潜力" = potential shown)
- NPC: Lab Keeper (face: Shaman or Architect — TBD)

---

## 4. Auth Gate

**Why:** State must persist across sessions for the pipeline to work meaningfully.

**Implementation:**
- CTA "Enter the Village" checks Zo auth status
- If not authenticated → redirect to Zo sign-in
- After sign-in → warp drop into Alloy Village
- Player state (refined BARs, daemon status, quest progress) stored in user's Zo account data

**Auth approach:** Use Zo's built-in auth (same as how other private routes work). The user's Zo identity is the auth layer.

---

## 5. Daemon Emergence — Mechanism

### Trigger Conditions (both must be true)

1. **Charge present:** Player has accumulated 3+ refined BARs in the Lab
2. **Rhythm broken:** Player misses a quest deadline (or explicitly signals "I'm blocked")

### What happens when daemon emerges

```
Player has 3+ refined BARs
    ↓ tries to take aligned action (Grow Up / Show Up quest)
    ↓ blocked (misses deadline OR explicitly says "I'm blocked")
    ↓ charge is high enough
    ↓ DAEMON EMERGES
        - accumulated refined BARs coalesce into daemon entity
        - daemon appears in Alloy Village (visible in Lab or on overworld)
        - player can now interact with daemon
        - daemon can be evolved (collected) over time
```

### Daemon States

| State | Description |
|---|---|
| **Potential** | Player has <3 refined BARs — no daemon yet |
| **Emerging** | Trigger fired — daemon coalescing (brief animation/transformation) |
| **Evolved** | Daemon fully formed — player can interact with and collect it |
| **Collected** | Daemon added to player's daemon collection |

### Daemon Collection
- Evolved daemons can be "collected" (added to a daemon journal/collection)
- Collected daemons represent the player's journey — each is unique to the charge that formed it
- Collection is visible in the Lab or a dedicated room

---

## 6. Queue System (Tap the Vein → Alloy Village)

From the bridge spec (`tap-the-vein-321-to-pallet-town-bridge.md`):

### localStorage keys (updated for Alloy Village naming)

```typescript
const TTV_QUEUE_KEY = 'ttv-to-alloy-queue';     // Queue of phrases to bring into the game
const TTV_321_KEY   = 'ttv-321-completion';     // 321 completion record
const TTV_DISTILL_KEY = 'ttv-distill';           // Distill record (phrase + EA channel)
```

### Queue flow

1. Player distills a phrase in Tap the Vein (or completes 321)
2. Phrase stored in `ttv-to-alloy-queue` (array, newest last)
3. Player taps "Enter the Village" CTA
4. Auth verified → warp drop into Alloy Village
5. Player enters The Lab → Distillery
6. Queue items pre-loaded in Distillery (player can pick which to distill)

---

## 7. The Lab — Building Config

```typescript
interface LabBuilding {
  id: 'lab'
  label: 'The Lab'
  labelSub: 'where raw becomes refined'
  tileX: number        // TBD — placement on overworld
  tileY: number
  width: 5              // larger than other buildings (has two wings)
  height: 4
  doorX: number
  doorY: number
  interiorId: 'lab-entrance'
  roofColor: '#1a1020'  // dark, alchemical
  wallColor: '#2a1830'
  trimColor: '#6040a0'
  chimneyColor: '#401020'
}
```

### Lab Entrance Room Config

```typescript
interface LabEntranceConfig {
  id: 'lab-entrance'
  name: 'The Lab — Entrance'
  subtitle: 'where raw becomes refined'
  floorColor: '#1a1020'
  wallColor: '#2a1830'
  npc: {
    x: 2, y: 3
    name: 'Lab Keeper'
    color: '#8060c0'
    faceId: 'shaman'   // felt-reality — what the material is saying
    dialogues: [
      'The Lab holds what the village has refined.',
      'Distillation extracts. Refinement forges.',
      'What累积 here becomes your daemon.',
      'The Lab transforms charge into form.',
    ]
    barcodedDialogueSeeds: [3, 9, 15, 21]
  }
  distilleryPortal: { x: 2, y: 5 }   // portal to Distillery wing
  refineryPortal: { x: 7, y: 5 }    // portal to Refinery wing
  exitPortal: { x: 5, y: 9 }
}
```

### Distillery Room Config

```typescript
interface DistilleryConfig {
  id: 'distillery'
  name: 'The Distillery'
  subtitle: 'extraction — raw to essence'
  floorColor: '#281820'
  wallColor: '#381828'
  npc: {
    x: 2, y: 3
    name: 'Distiller'
    color: '#c06030'   // warm amber — transformation
    faceId: 'architect' // structure of extraction
    dialogues: [
      'The Distillery takes raw material and extracts its essence.',
      'Your words go in. What comes out is purer.',
      'Each distillation produces a refined BAR.',
      'Three refined BARs and the Refinery can forge a daemon.',
    ]
    barcodedDialogueSeeds: [4, 10, 16, 22]
  }
  barArtifact: {
    x: 6, y: 5
    undoneColor: '#c06030'
    doneColor: '#40c060'
    label: 'DISTILL'
  }
  // Queue items from Tap the Vein appear here as selectable items
  queueDisplay: true
  exitPortal: { x: 5, y: 9 }
}
```

### Refinery Room Config

```typescript
interface RefineryConfig {
  id: 'refinery'
  name: 'The Refinery'
  subtitle: 'forging — essence to form'
  floorColor: '#201828'
  wallColor: '#301828'
  npc: {
    x: 2, y: 3
    name: 'Refiner'
    color: '#a040c0'   // purple — transformation complete
    faceId: 'sage'      // mastery of the process
    dialogues: [
      'The Refinery takes refined BARs and forges them into form.',
      'Three refined BARs. One aligned action blocked.',
      'The daemon emerges from charge that could not be moved.',
      'Your daemon is the shape of what you could not yet do.',
    ]
    barcodedDialogueSeeds: [5, 11, 17, 23]
  }
  barArtifact: {
    x: 6, y: 5
    undoneColor: '#a040c0'
    doneColor: '#40c060'
    label: 'FORGE DAEMON'
  }
  daemonEmergenceTrigger: {
    minRefinedBars: 3
    blockedAction: boolean   // true if player tried aligned action and missed deadline
  }
  exitPortal: { x: 5, y: 9 }
}
```

---

## 8. New Overworld Buildings (updated)

Alloy Village now has 5 buildings:

| Building | Purpose | Interior |
|---|---|---|
| **The Mill** | Where work happens (existing) | Mill room |
| **The Archive** | Where wisdom is kept (existing) | Archive room |
| **The Hearth** | Where memory lives (existing) | Hearth room |
| **The Dojo** | Where practice lives (existing) | Dojo room |
| **The Lab** | Where raw becomes refined + daemon forging (NEW) | Lab entrance → Distillery + Refinery |

---

## 9. UI Changes Required

### Tap the Vein
- "Enter the Village" CTA (always visible, bottom of recap card)
- Auth check on CTA tap → redirect to sign-in if needed
- On auth success → warp drop to Alloy Village

### Alloy Village
- Add The Lab building to overworld (new sprite/position)
- Add Lab entrance room (connects to Distillery + Refinery portals)
- Add Distillery room (sub-room of Lab)
- Add Refinery room (sub-room of Lab)
- Update HUD to show Lab progress (refined BARs count, daemon status)
- Add daemon emergence animation/trigger

### 321 Completion Screen
- Add "Enter the Village" CTA (after 321 completion)
- Route to Alloy Village based on charge level

---

## 10. Phase Scope

### Phase 1 (this spec — dependency of daemon spec)
- [ ] Add The Lab building to Alloy Village overworld
- [ ] Build Lab entrance room (with Distillery + Refinery portals)
- [ ] Build Distillery room (queue display + distill interaction)
- [ ] Build Refinery room (daemon forging interface)
- [ ] Implement "Enter the Village" CTA with auth gate
- [ ] Implement warp drop from Tap the Vein / 321 into Alloy Village
- [ ] Implement refined BAR count tracking (visible in Lab)
- [ ] Connect queue system from Tap the Vein to Distillery

### Phase 2 (daemon emergence)
- [ ] Define quest deadline system
- [ ] Track blocked aligned actions
- [ ] Implement daemon emergence trigger
- [ ] Build daemon entity (sprite + interaction)
- [ ] Implement daemon collection

---

## 11. Open Questions (your call)

| # | Question | Options |
|---|---|---|
| OQ1 | Which face runs the Lab Keeper NPC? | Shaman (felt-reality) or Architect (structure) — you chose "felt-reality" in conversation, but Architect is also strong |
| OQ2 | Is The Lab the 5th building or does it replace one of the existing 4? | 5th building (preferred) or replace one existing |
| OQ3 | Where on the overworld does The Lab go? | Upper area (near Archive/Mill) or lower area (near Dojo/Hearth) |
| OQ4 | Does the Distillery have its own BAR artifact forge, or does it use the same one as other rooms? | Own forge (Distillery produces refined BARs) |
| OQ5 | What does the daemon look like when it emerges? (sprite/design) | TBD — future design pass |

---

## 12. Dependencies

```
tap-the-vein-321-to-pallet-town-bridge.md (Phase 1 bridge — READY)
    ↓
This spec (Lab building + Distillery + Refinery + auth gate)
    ↓
Daemon emergence spec (Phase 2 — blocked on this spec)
```

---

## 13. Companion Files

- `/alloy` — existing Alloy Village route (zo.space page)
- `/shadow/321` — 321 shadow process route
- `/tap-the-vein` — Tap the Vein write surface
- `The Library/06 Specs/tap-the-vein-321-to-pallet-town-bridge.md` — bridge spec (Phase 1 dependency)
- `docs/plans/pallet-town-phase-2.md` — existing Alloy Village Phase 2 spec (for room format reference)