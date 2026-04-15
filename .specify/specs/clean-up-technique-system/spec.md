# Spec: Clean Up Technique Library — Learning, Discovering, and Equipping Shadow Work Methods

**Status:** Early — this spec captures the design conversation before writing stories or tasks
**Created:** 2026-04-14
**Source conversation:** Doc Future reading + charge/vibeulon/metabolism discussion + I Ching council

---

## The Problem

The system has two Clean Up methods documented:
- **3-2-1 Process** (Integral Life Practice / Gendlin Focusing)
- **Existential Kink** (Carolyn Elliott: Wallow → Identify → Conscious)

Players who are ILP-familiar use 3-2-1. Players who prefer other frameworks have no equivalent in-game path. More importantly:

1. **Players don't know when they need a Clean Up move** — no signal architecture
2. **Players don't know what technique to use** — no technique selection at the moment of charge
3. **Learning techniques feels like homework** — not exploration or reward
4. **The hub/spoke/spatial map architecture already exists** — it just needs technique content mapped onto it

---

## The Core Design Thesis

> **Techniques are not unlocked. They are found, earned, and taught.**

This is the Pokemon/Rune Factory principle:
- You don't read about Fire Blast in a manual — you find it by exploring
- You don't select it from a menu — you encounter it as a creature in a place
- You don't just equip it — you build a relationship with it over time

In the BARS ontology:
- **The Forest** (8 gates, spatial map) IS the technique discovery layer
- **Charge/blocks** ARE the signal that a technique is needed
- **Teaching other players** IS the social reward loop
- **Vibeulons** ARE the currency for equipping/remembering techniques

---

## What Already Exists (Don't Rebuild)

| Asset | Location | Use for this spec |
|-------|----------|-------------------|
| **Hub/spoke/landing architecture** | `campaign-hub-spoke-landing-architecture/spec.md` | Portal structure, CYOA spoke entry |
| **Spatial map (forest clearing)** | `campaign-hub-spatial-map/spec.md` | Octagonal clearing, 8 rim portals |
| **Spoke move seed beds** | `spoke-move-seed-beds/spec.md` | 4 beds per spoke (Wake/Clean/Grow/Show) |
| **The Forest doc** | `docs/handbook/THE_FOREST.md` | 8 gates, 5 channels, anti-hero trap |
| **3-2-1 praxis** | `docs/FELT_SENSE_321_PRAXIS.md` | Technique content for 3-2-1 |
| **EK book content** | `.specify/books/book-existential-kink.txt` | Technique content for EK |
| **Pyrakanth nation** | `docs/handbook/nations/pyrakanth.md` | Fire element, burn offering, charge-as-heat |
| **Charge capture flow** | `src/app/capture/page.tsx` | Where charge is logged — needs technique signal |

---

## Conceptual Model

### The Technique Discovery Loop

```
VILLAGE (Show Up / Clean Up)
    ↓ player encounters charge
FOREST ENTRY — 8 gates (spatial portals on the clearing)
    ↓ choose which gate to enter
GATE ENCOUNTER — NPC / situation reveals a technique
    ↓ learn / attempt the technique
METABOLISM — charge → vibeulon
    ↓ technique succeeds
REWARD — vibeulons + technique added to known library
    ↓ teach technique to another player
SOCIAL REWARD — transfer, appreciation creates sustainable charge
RETURN TO VILLAGE — now equipped with new Clean Up tool
```

### Technique = Equippable Move

A **Technique** is a specific Clean Up method a player has learned and can deploy when charged. It's tracked in their profile like:
- Pokemon move slots (limited, must choose which to bring)
- Rune Factory equip slots (context-dependent loadout)

### Known Techniques (extensible)

| Technique | Source framework | Core steps | Nation affinity |
|-----------|----------------|------------|----------------|
| **321 Shadow Process** | ILP / Gendlin | Face It (3rd) → Talk to It (2nd) → Be It (1st) | Meridia (water, listening) |
| **Existential Kink** | Carolyn Elliott | Wallow → Identify → Conscious Enjoyment | Pyrakanth (fire, burning) |
| **Burn Offering** | Pyrakanth nation | Confront / Transform / Sacrifice | Pyrakanth |
| **Felt Sense Check-in** | Gendlin focusing | Pause → Locate in body → Ask "what's this?" → Wait | Meridia |
| *(more techniques can be added)* | | | |

### Where Techniques Live in the Architecture

```
Campaign Hub (forest clearing)
  └─ 8 Portals (spokes 0–7) = 8 Gates
       └─ Each portal → CYOA spoke adventure
            └─ Clean Up bed → available techniques
                 └─ Player chooses which learned technique to use
                      └─ Completion → vibeulons + possible new technique discovery
```

The spoke-move-seed-beds already has Wake/Clean/Grow/Show as four beds. **The Clean Up bed becomes a technique selector** — it shows which Clean Up techniques the player has learned, and they choose which one to run for that spoke.

### The Charge Signal (When Clean Up is Offered)

When a player logs charge at `/capture` or encounters a block mid-quest, the system checks:
1. Is this a Clean Up opportunity? (emotional charge pattern)
2. Does the player have a known technique for Clean Up?
3. If yes → offer Clean Up path with technique selector
4. If no → offer orientation to Clean Up + invitation to learn a technique from the Forest

---

## Design Questions (For User Input Before Spec Completes)

### Q1 — Technique discovery: guided or exploratory?

**Option A (Guided):** The Forest automatically assigns techniques based on the player's dominant emotional channel. Fire channel → EK/Burn Offering. Water channel → 3-2-1/Felt Sense. *(Structured, predictable.)*

**Option B (Exploratory):** All 8 gates are open. The player chooses which gate to enter. Each gate has a different technique associated with it. The player discovers which technique fits through encounter. *(More Pokemon-like, less predictable.)*

**Option C (Hybrid):** Early techniques are guided (first 2–3). Later techniques require exploration and choice. *(Balanced, respects learning curve.)*

### Q2 — How many techniques can a player know at once?

**Option A (Loadout model):** 2–3 slots max. Player chooses which techniques to "bring" to each session. Like Pokemon moves — limited by slot count. *(Strategic, forces choice.)*

**Option B (Full library):** All learned techniques are available. Player always has the right tool. *(Less friction, less strategy.)*

**Option C (Progressive unlock):** Start with 1 technique. Unlock slots as you level up Clean Up skill. *(RPG progression feel.)*

### Q3 — How is a new technique learned (the discovery moment)?

**Option A (NPC encounter):** An NPC at a gate teaches the technique through a dialogue CYOA. The technique is earned after completing a small quest for the NPC.

**Option B (Item drop):** The technique appears as a "found object" in the Forest — a book, a ritual tool, a recording. Using it teaches it.

**Option C (Social teaching):** Another player who knows a technique can teach it to you. This costs vibeulons for the teacher (they spent energy teaching) and the learner.

**Option D (Confrontation):** A gate presents a charge situation that *requires* a specific technique to pass. You learn it by surviving it.

### Q4 — How does orientation introduce this?

The standard onboarding (321 on ramp) currently teaches Clean Up. Questions:
- Should orientation give players ONE starter technique automatically?
- Should orientation explicitly point players to the Forest for technique discovery?
- Should the orientation explicitly say "you will find more techniques as you explore"?

---

## Proposed UX Flow (Draft — Requires Q Resolution)

### Flow 1: Player logs charge, has no technique

```
/capture → charge logged → system sees no Clean Up technique known
  → "You're carrying something heavy. Want to find a tool for that?"
  → Offer: (A) Continue with what you have  (B) Go to the Forest to learn a technique
  → If B → /world/bruised-banana/bb-campaign-clearing (hub spatial map)
  → Player sees 8 portals → chooses one to explore
```

### Flow 2: Player logs charge, has techniques

```
/capture → charge logged → system sees known Clean Up techniques
  → "You've learned some ways to work with charge. Which fits this moment?"
  → Show technique selector (cards for each known technique)
  → Player chooses → run that technique's CYOA (the Clean Up spoke bed)
  → Completion → vibeulons awarded
```

### Flow 3: Forest exploration (technique discovery)

```
Player at hub (clearing) → steps on Portal 3 (the Skeptic gate)
  → CYOA: encounter with Skeptic voice asking "is this even real?"
  → NPC at gate: "You're looking for something. I have what you need."
  → Teach EK technique through encounter
  → EK added to player's known technique library
  → Return to hub → Clean Up bed now shows EK as available
```

---

## Data Model (Sketch)

```prisma
model Technique {
  id          String   @id @default(cuid())
  name        String   // "Existential Kink", "321 Shadow Process"
  moveType    String   // "cleanUp"
  nationId    String?  // which nation this technique belongs to (flavor)
  
  // Content
  description String   // short description for card display
  steps      Json     // array of step objects for the CYOA
  
  // Discovery
  gateIndex   Int?     // which gate (1-8) this technique is discovered at (null = any)
  isStarter   Boolean  @default(false) // given at orientation?
  
  createdAt   DateTime @default(now())
}

model PlayerTechnique {
  id            String   @id @default(cuid())
  playerId      String
  techniqueId   String
  technique     Technique @relation(...)
  
  // Mastery level (optional progression)
  level         Int      @default(1) // 1=learned, 2=practiced, 3=teaching
  timesUsed     Int      @default(0)
  
  // Discovery context
  discoveredAt  DateTime @default(now())
  discoveredVia String?  // "gate_3", "social_teach", "quest_reward"
  
  @@unique([playerId, techniqueId])
}
```

---

## Relationship to Existing Specs

| Spec | Integration point |
|------|------------------|
| `campaign-hub-spatial-map` | The clearing IS the Forest. Portals are gates. Spatial navigation IS the technique discovery layer. |
| `spoke-move-seed-beds` | The Clean Up bed becomes a technique selector. The planted kernel IS the player's attempt at using that technique. |
| `campaign-hub-spoke-landing-architecture` | The spoke CYOA template is parameterized by chosen technique. The landing shows mastery. |
| `vibeulons_schema` | Using a technique = earning vibeulons. Teaching a technique = transferring vibeulons with sustainable charge. |

---

## What This Spec Needs to Complete

1. [ ] Answer Design Questions Q1–Q4 above
2. [ ] Map which technique goes with which gate (or confirm gates are free exploration)
3. [ ] Define minimum viable technique CYOA template (parameterized by technique name + steps)
4. [ ] Write first two technique content sets (321 + EK) as structured JSON for the CYOA engine
5. [ ] Define how technique discovery triggers in the orientation/onboarding flow

---

## Open Questions for the Council

1. **Skill vs. Technique distinction:** Is "Clean Up" the *skill* (developmental line) and "321" the *technique* (specific method)? Or are they the same thing at different levels?
2. **Can techniques be wrong?** If a player chooses the wrong technique for a charge, does the system signal that? Or is every technique valid?
3. **Can techniques conflict?** If two players use different techniques on the same charge, can both be valid? What does the system do?
4. **Pace of discovery:** How fast should players accumulate techniques? (ILP users might want all quickly. Exploratory players might want them one at a time.)
