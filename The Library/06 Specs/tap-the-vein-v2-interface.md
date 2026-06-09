# Tap the Vein v2.0 — Interface to Alloy Village

**Status:** Draft — Version 2.0
**Owner:** Architect
**Created:** 2026-04-28
**v1 parent:** `tap-the-vein-alloy-village-pipeline.md` (superseded)
**Pattern:** `write_space_route` — zo.space page + API routes

---
See also: [[KEYTERM-TAP-THE-VEIN.md]]


- [[KEYTERM-TAP-THE-VEIN]]

## Changelog: v1 → v2

| Change | Section |
|---|---|
| Expanded daemon sprite design (full visual spec, EA channel mappings) | Section 14 |
| Daemon emergence spec (Phase 2) — exact trigger, animation, interaction states | Section 15 |
| Daemon collection + evolution (Phase 3) — full mechanic | Section 16 |
| Correction feedback UI (deferred → specced) | Section 13.5 |
| Distillery queue visual states (deferred → specced) | Section 13.3 |
| Phase numbering updated: Phase 1 (Lab/Distillery/Refinery) → Phase 2 (daemon emergence) → Phase 3 (collection/evolution) |

---

## 0. What This Spec Covers

The full pipeline from daily shadow practice (Tap the Vein) through emotional alchemy (321) into Alloy Village, ending in daemon emergence and collection.

```
Tap the Vein (daily write)
    ↓ distill (optional 321)
    ↓ CTA "Enter the Vein" — warp drop to Alloy Village
    ↓ Alloy Village
        ↓ The Lab (on linked map)
            ↓ Distillery — extraction, queue consumption, refined BARs
            ↓ Refinery — daemon forging
    ↓ charge accumulates across sessions
    ↓ Phase 2: daemon emerges when player misses quest deadline
    ↓ Phase 3: daemon collected, evolves over time
```

**Updated phase structure:**

| Phase | Contents | Status |
|---|---|---|
| **Phase 1** | Lab building, Distillery, Refinery, auth gate, queue, corrections | READY TO BUILD |
| **Phase 2** | Daemon emergence (trigger, animation, interaction) | SPEC IN V2 |
| **Phase 3** | Daemon collection + evolution | SPEC IN V2 |
| **Phase 4** | Allyship integration, milestone rewards | NOT YET SPECCED |

---

## 1. Key Decisions (v1 + v2 confirmed)

| Decision | Answer |
|---|---|
| World name | Alloy Village |
| New building | The Lab — larger building with two sub-rooms: Distillery + Refinery |
| Entry mechanism | CTA "Enter the Vein" → direct warp drop (not navigation through overworld) |
| Auth requirement | Sign-in required — state persists across sessions |
| Daemon trigger | Player misses quest deadline = rhythm broken = charge present → daemon emerges |
| Lab Keeper face | **Architect** |
| Lab placement | **5th building, on linked map** — warp drop, not overworld walk-up |
| Distillery forge | **Own forge** — Distillery produces refined BARs, Refinery produces daemons |
| Daemon sprite design | **Defined in v2 Section 14** — EA channel → visual characteristics |
| Collection/evolution | **Defined in v2 Section 16** — Phase 3 |

---

## 2. Routing Map

### Entry Path A: Tap the Vein → Distill → Alloy Village

```
Tap the Vein (/tap-the-vein)
    ↓ word count ≥ 750, analytics run
    ↓ "Hone the meaning" — player distills BAR phrase
    ↓ CTA "Enter the Vein" (always visible)
    ↓ auth gate (Zo sign-in)
    ↓ warp drop → Alloy Village (player appears in Distillery)
```

### Entry Path B: Tap the Vein → 321 → Alloy Village

```
Tap the Vein
    ↓ charge detected (strong/intense)
    ↓ "Begin 321" CTA → /shadow/321 (charge pre-seeded)
    ↓ 321 completion screen
    ↓ CTA "Enter the Vein" (on completion screen)
    ↓ auth gate
    ↓ warp drop → Alloy Village
        - Strong/intense charge, descent completed → Room of Shadows
        - Mild/moderate charge → Distillery
        - No charge → Distillery
```

---

## 3. The Lab Building — Structure

The Lab is a **multi-room building** on a linked map (not the main overworld). A warp portal on the Alloy Village overworld links to the Lab map.

### Overworld warp portal (entry point)

On the main Alloy Village overworld, a **warp portal tile** links to The Lab:
- Distinct visual from regular portal (purple shimmer, not blue)
- Label: "The Lab" — shown on hover/touch
- Player taps/approaches → warp drop to Lab map

### Lab Map Interior Layout

```
┌─────────────────────────────────────────┐
│  THE LAB — where raw becomes refined    │
├──────────────┬──────────────────────────┤
│  DISTILLERY  │  REFINERY               │
│  (left wing) │  (right wing)           │
│  extraction  │  forging + daemon      │
└──────────────┴──────────────────────────┘
        ↓
   Lab Entrance (connecting room)
        ↓
   Warp back to overworld
```

---

## 4. Auth Gate

**Why:** State must persist across sessions for the pipeline to work.

- CTA "Enter the Vein" checks Zo auth status
- If not authenticated → redirect to Zo sign-in
- After sign-in → warp drop into Alloy Village
- Player state (refined BARs, daemon status, quest progress) stored in user data

---

## 5. Queue System

### localStorage keys

```typescript
const TTV_QUEUE_KEY = 'ttv-to-alloy-queue'      // Queue of phrases
const TTV_321_KEY   = 'ttv-321-completion'     // 321 completion record
const TTV_DISTILL_KEY = 'ttv-distill'          // Distill record
```

### Queue capacity

**Max 5 items.** If full: warning shown, oldest items shown first for distillation.

---

## 6. The Distillery — Extraction

### Purpose

Extraction — raw write material is distilled into refined BARs.

### Queue item states

| State | Visual | Interaction |
|---|---|---|
| **Pending** | ○ (hollow circle), dim text | Selectable |
| **In progress** | ◐ (half circle), highlighted | Distillation modal open |
| **Refined** | ● (filled circle), green, strikethrough | Consumed, shown as historical |
| **Archived** | ○ dim, italic | Cannot interact, shown at bottom |

### Distillation interaction

1. Player selects queue item
2. Distill modal opens — shows phrase, allows final edit
3. Player taps "Distill" → transformation animation (raw → essence)
4. Queue entry marked refined
5. Refined BAR added to Lab inventory
6. Refined BAR count shown: "Refined BARs: 1/3"

### Refined BAR format

```typescript
interface RefinedBar {
  id: string
  phrase: string
  eaChannel: string        // metal | water | wood | fire | earth
  chargeStrength: string    // mild | moderate | strong | intense
  refinedAt: string        // ISO timestamp
  constituentQueueIds: string[]
}
```

### Distillery NPC — Distiller

**Face:** Architect
**Color:** `#c06030` (amber)
**Dialogue (pre-completion):**
- "The Distillery takes raw material and extracts its essence."
- "Your words go in. What comes out is purer."
- "Each distillation produces a refined BAR."
- "Three refined BARs and the Refinery can forge a daemon."

**Dialogue (after 3+ refined BARs):**
- "You have the material. The Refinery awaits."
- "Three refined BARs are ready for forging."

---

## 7. The Refinery — Forging

### Purpose

Final refinement + daemon forging. Takes accumulated refined BARs and transforms them into a daemon entity.

### Forge Daemon interaction

1. Player has 3+ refined BARs
2. Forge button activates (pulses amber glow)
3. Player taps "Forge Daemon" → forging animation (3 refined BARs converge)
4. Refined BARs consumed, marked forged
5. Daemon entity created (Phase 2 emergence)
6. Forge button deactivates until 3 more refined BARs accumulated

### Refinery NPC — Refiner

**Face:** Sage
**Color:** `#a040c0` (purple)
**Dialogue (pre-completion):**
- "The Refinery takes refined BARs and forges them into form."
- "Three refined BARs. One aligned action blocked."
- "The daemon emerges from charge that could not be moved."
- "Your daemon is the shape of what you could not yet do."

**Dialogue (after daemon forged):**
- "Your daemon walks the village now."
- "It will grow as you grow."
- "Each daemon is unique to the charge that forged it."

---

## 8. Correction Feedback Loop

### Write to correction file

```typescript
// ~/tap-the-vein/signal-corrections.json
interface SignalCorrection {
  phrase: string
  playerChannel: string     // what player selected
  systemChannel: string    // what system detected
  date: string            // ISO timestamp
  entryId: string         // which Tap the Vein entry
}
```

### Correction UI in "Hone the meaning" modal

```
┌─────────────────────────────────────────┐
│  Confirm your channel                    │
│                                         │
│  Phrase: "I feel like I'm drowning"    │
│  System detected: water (sadness)         │
│                                         │
│  Is this correct?                        │
│  ○ Metal  ○ Water  ● Wood  ○ Fire  ○ Earth │
│                                         │
│  [CORRECT]  [OVERRIDE → DISTILL]       │
└─────────────────────────────────────────┘
```

Player selects correct channel OR overrides. Both update signal-corrections.json.

---

## 9. DAEMON SPRITE DESIGN — PHASE 2

### 9.1 Base Daemon Form

- **Central core:** Glowing orb (channel color) — accumulated charge
- **Aura:** Semi-transparent outer layer — shifts color based on channel composition
- **Form stability:** 60% opacity — daemons are not fully solid
- **Breathing animation:** Core pulses (scale 1.0 → 1.05, 2s cycle)
- **Phase flicker:** Random micro-shifts in opacity (±5%) every 0.5s

### 9.2 Channel-Based Visual Traits

| Channel | Primary Color | Texture | Aura Pattern | Core Shape |
|---|---|---|---|---|
| **Metal/Fear** | `#8899aa` (cold silver) | Crystalline, sharp | Radial spikes | Diamond |
| **Water/Sadness** | `#3366aa` (deep blue) | Flowing, liquid | Wave ripples | Circle |
| **Wood/Joy** | `#44aa44` (living green) | Organic, root-like | Tendril curls | Organic blob |
| **Fire/Anger** | `#cc4422` (hot orange-red) | Jagged, burst | Flame tongues | Irregular |
| **Earth/Neutral** | `#887766` (warm brown) | Stable, block | Layered bands | Square |

### 9.3 Composite Channel Blending

When forged from 3 refined BARs of different channels:
- **Core color:** Dominant channel by count (2+ same = that; all different = purple blend `#8866aa`)
- **Aura:** Mix of all channel textures — layered effects
- **Special trait per extra channel:** Metal adds shimmer, Water adds ripple, Wood adds tendril, Fire adds flicker, Earth adds stability

### 9.4 Daemon Naming

Player names daemon at emergence. If skipped, procedural name from channel roots:
- Metal: Edge, Veil, Iron, Shard, Lattice
- Water: Tide, Current, Well, Depth, Drift
- Wood: Grove, Reach, Branch, Root, Thorn
- Fire: Ember, Flare, Blaze, Spark, Cinder
- Earth: Stone, Barren, Cleft, Sill, Keel

### 9.5 Daemon Size

Scale with number of refined BARs:
- 3 BARs → 100% size
- 4 BARs → 120%
- 5 BARs → 140%
- 6+ BARs → 160% (cap)

---

## 10. DAEMON EMERGENCE — PHASE 2

### 10.1 Emergence Trigger

**Both conditions must be true:**
1. Player has 3+ refined BARs in Lab inventory
2. Player attempts aligned action (Grow Up / Show Up quest) but misses deadline OR explicitly says "I'm blocked"

**Charge threshold:** `blockedAction.charge >= 7` → daemon emerges.

### 10.2 Emergence Sequence (4 phases)

```
Phase 1 — Gathering (0–800ms)
  All 3 refined BAR orbs float to center of Refinery room
  Converge into single bright point
  Screen: subtle purple vignette

Phase 2 — Compression (800–1600ms)
  Bright point contracts, intensifies
  Background darkens
  HUD: "Charge building..."

Phase 3 — Emergence (1600–2400ms)
  Daemon sprite bursts outward
  Expands to full size
  Phase flicker stabilizes
  Name prompt appears

Phase 4 — Naming (2400ms+)
  Name modal appears
  Player names OR skips for procedural name
  Daemon saved to localStorage
  Refined BARs consumed
  "DAEMON EMERGED" banner shown
```

### 10.3 Daemon Detail View

```
┌─────────────────────────────────────────┐
│  DAEMON: [Name]                        │
│  Channel: Metal + Fire (composite)      │
│  Forged: April 28, 2026                 │
│  Constituent BARs: 3                    │
│                                         │
│  [Character portrait — animated sprite]  │
│                                         │
│  "What you could not move, now moves."  │
│                                         │
│  [TEND] — train this daemon            │
│  [COLLECT] — add to collection         │
└─────────────────────────────────────────┘
```

### 10.4 Quest Deadline System

- Each Grow Up / Show Up quest has optional deadline field (player-set)
- If deadline passes without completion → `missedDeadline: true`
- Player can manually tap "I'm blocked" on any active quest
- Either trigger checks charge level → emerge if >= 7

---

## 11. DAEMON COLLECTION + EVOLUTION — PHASE 3

### 11.1 Collection

- Collecting adds daemon to persistent collection in the Lab
- Each daemon can only be collected once
- Collection is the permanent record of the player's shadow journey

**Collection trigger:** Player taps "Collect" on emerged daemon.

### 11.2 Daemon Stats

| Stat | Description | How computed |
|---|---|---|
| **Level** | Power/capability | Number of refined BARs forged into it |
| **Channel purity** | How focused | 1 ch = 100%; 2 ch = 70%; 3 ch = 50% |
| **Age** | When forged | ISO timestamp |
| **Bond** | Connection to player | Starts 0, increases with interaction |
| **Trait slots** | Special abilities | Unlocked at Lv.3, Lv.5 |

### 11.3 Evolution Mechanic

Each time player forges a NEW daemon, all collected daemons gain +1 XP.

| Level | XP Threshold | Visual change |
|---|---|---|
| Lv.1 | 0 XP | Base sprite |
| Lv.2 | 3 XP | Aura intensifies, core brighter |
| Lv.3 | 7 XP | First trait unlocked |
| Lv.4 | 12 XP | Sprite +10% size |
| Lv.5 | 18 XP | Second trait unlocked |
| Lv.6+ | 25+ XP | Further traits, capped at Lv.6 |

### 11.4 Trait System

Traits unlocked at Lv.3 and Lv.5 (player chooses which):

| Trait | Channel | Unlock | Visual effect |
|---|---|---|---|
| Clarity | Metal | Lv.3 | Crystalline particles orbit daemon |
| Flow | Water | Lv.3 | Ripple effect in aura |
| Growth | Wood | Lv.3 | Tendrils extend outward |
| Heat | Fire | Lv.3 | Flame flicker in aura |
| Root | Earth | Lv.3 | Stable opacity |
| Depth | Water+Metal | Lv.5 | Clarity + Flow combined |
| Spark | Fire+Wood | Lv.5 | Heat + Growth combined |
| Stone | Earth+Metal | Lv.5 | Root + Clarity combined |
| Cascade | Water+Wood | Lv.5 | Flow + Growth combined |
| Ember | Fire+Earth | Lv.5 | Heat + Root combined |

### 11.5 Bond System

- Bond increases: Collect (+10), View detail (+3), Name at emergence (+5), Per session in Lab (+1)
- At 100%: permanent color mark (player-chosen color blended into aura)
- Purely cosmetic in Phase 3

### 11.6 Aging

Daemons are permanent — no decay. At 90+ days: aura becomes more stable (less flicker).

---

## 12. Updated Phase Scope

### Phase 1 — Lab, Distillery, Refinery (READY TO BUILD)
- [ ] Warp portal on Alloy Village overworld → Lab map
- [ ] Lab map with Distillery + Refinery wings
- [ ] Distillery room (queue display, distillation, refined BAR production)
- [ ] Refinery room (forge interface, trigger)
- [ ] Lab entrance room (inventory, NPC)
- [ ] "Enter the Vein" CTA with auth gate
- [ ] Warp drop from Tap the Vein / 321
- [ ] Refined BAR count tracking
- [ ] Queue → Distillery connection
- [ ] Correction feedback loop

### Phase 2 — Daemon Emergence (SPEC IN THIS DOC)
- [ ] Quest deadline tracking
- [ ] "I'm blocked" button
- [ ] Blocked action record
- [ ] Charge computation at block
- [ ] Emergence trigger (charge >= 7 + blocked)
- [ ] 4-phase emergence animation
- [ ] Name prompt
- [ ] Daemon entity save
- [ ] Refined BAR consumption
- [ ] "DAEMON EMERGED" banner

### Phase 3 — Collection + Evolution (SPEC IN THIS DOC)
- [ ] Daemon collection (collect button, display)
- [ ] Daemon stats
- [ ] XP gain on new daemon forged
- [ ] Evolution thresholds + level-up animation
- [ ] Trait system (unlock + selection)
- [ ] Bond increase on interaction
- [ ] Bond visual reward at 100%
- [ ] Visual aging at 90+ days

### Phase 4 — Allyship Integration (NOT YET SPECCED)
- [ ] Quest system integration
- [ ] Milestone rewards
- [ ] Mechanical trait effects

---

## 13. Open Questions (v2 — new)

| # | Question | Options |
|---|---|---|
| OQ9 | Where does warp portal appear on main overworld? | Upper area (near Archive) or center (near Dojo) |
| OQ10 | Max daemons collectible? | No cap OR cap at 12 (one/month) |
| OQ11 | Can daemons be released/dismissed? | No (permanent) OR archived list |
| OQ12 | Distillery fresh-input mode? | Yes (direct text input) |
| OQ13 | Level-up visual effect? | Aura burst + size + trait icon flash |
| OQ14 | Separate uncollected inventory? | Collection IS inventory; no separate pool |

---

## 14. Files in This Spec Family

| File | Status |
|---|---|
| `The Library/06 Specs/tap-the-vein-spec.md` | Phase 1 spec |
| `The Library/06 Specs/tap-the-vein-zo-space-impl.md` | Live implementation |
| `The Library/06 Specs/tap-the-vein-321-to-pallet-town-bridge.md` | Bridge (Phase 1) |
| `The Library/06 Specs/tap-the-vein-alloy-village-pipeline.md` | Parent v1 (superseded) |
| `The Library/06 Specs/tap-the-vein-v2-interface.md` | **This file** — v2 |

---

## 15. Companion Files

- `/alloy` — Alloy Village zo.space page
- `/shadow/321` — 321 route
- `/tap-the-vein` — Tap the Vein write surface
- `The Library/06 Specs/pallet-town-phase-2.md` — room format reference
- `docs/plans/pallet-town-building-system.md` — building config reference
