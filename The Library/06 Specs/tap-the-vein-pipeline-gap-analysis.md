# Tap the Vein × Pallet Town × Daemon — Pipeline Gap Analysis
**Status:** Research — Phase 0
**Owner:** Architect
**Created:** 2026-04-27
**Dependency:** `tap-the-vein-321-to-pallet-town-bridge.md`

---
See also: [[KEYTERM-TAP-THE-VEIN.md]]


- [[KEYTERM-TAP-THE-VEIN]]

## What This Spec Is

Defines the full pipeline from **Tap the Vein write → EA channel → 321 → Pallet Town BAR → Daemon collection**. This is a Phase 1 (known) + Phase 2 (TBD) document. Phase 2 sections are explicitly deferred with open questions.

---

## The Pipeline (Full Arc)

```
Tap the Vein
    │ write 750 words
    │ analytics run silently
    ▼
[1] Analytics Output
    - EA channel detected
    - Charge strength
    - BAR phrases (raw, unrefined)
    │
    ▼
[2] Recap Card (Tap the Vein)
    - "Begin 321" CTA (if strong/intense charge)
    - "Hone the meaning" → corrects EA channel
    - "Distill the meaning" → refines BAR phrase
    │
    ├──────────────────────────────┐
    ▼                              ▼
[3a] Direct to Pallet Town    [3b] 321 Shadow Process
    (no charge, just               (strong/intense charge
     distill)                       → emotional descent)
        │                              │
        ▼                              ▼
    [3a.1] Distill the Meaning    [3b.1] 3-2-1 dialogue
        - EA channel (refined)         - face the mask
        - refined BAR phrase           - talk to it
        ▼                              - be it
    [3a.2] Send to Pallet Town    [3b.2] Bars Seed Output
        → shadows room BAR             - belief summary
          artifact (pre-filled)        - EA channel (locked)
                                         ▼
                                    [3b.3] Send to Pallet Town
                                        → shadows room BAR
                                          artifact (pre-filled)
                                          + EA channel tagged
    │
    ▼
[4] Pallet Town — Shadows Room
    - Approach BAR artifact → encode modal opens
    - Pre-filled text (bars-seed or refined phrase)
    - User can edit before confirming
    - On confirm: room = DONE, BAR sealed
    ▼
[5] Daemon Collection (Phase 2 — TBD)
    - Daemon emerges from ??? (see Section 4 open questions)
    - Daemon visualized in Pallet Town (???)
    - Daemon evolves via ??? (see Section 4 open questions)
```

---

## Section 1 — What's Defined (Phase 1)

### 1.1 Analytics Output (Tap the Vein)

Rule-based detection:
- **EA channel:** metal | water | wood | fire | earth | none
- **Charge strength:** none | mild | moderate | strong | intense
- **BAR phrases:** 0-5 extracted text snippets, 1-3 sentences each, game-world-ready

Storage model: analytics output only (not raw text). Per-entry ID, channel, strength, phrases, tags, timestamp.

### 1.2 Recap Card

Shows after each submission:
- EA channel detected + "Hone the meaning" (inline correction)
- Charge strength
- BAR phrase(s) + "Distill the meaning" (refine)
- Auto-summary (3-5 sentences)
- "Begin 321" CTA (strong/intense only)
- Link to `/tap-the-vein/weekly`

**Hone the meaning** — user picks correct EA channel from canonical 5 (metal/water/wood/fire/earth/none). When corrected, future analytics improve (learning loop).

**Distill the meaning** — user refines the extracted BAR phrase. Triggers bars-engine BAR creation flow (Phase 2).

### 1.3 321 Shadow Process

Pre-seeded from Tap the Vein charge:
- EA channel pre-selected
- Charge descriptor pre-filled
- BAR phrase pre-loaded as opening belief

Output on completion:
- **Bars-seed:** 1-2 sentence summary of the 321 session
- **EA channel:** locked (not editable after 321)
- **Source:** `tap_entry_id` + `session_321_completed`

### 1.4 321 → Pallet Town Bridge

**Spec in dependency:** `docs/plans/tap-the-vein-321-to-pallet-town-bridge.md`

Summary:
- 321 completion writes bars-seed to `localStorage` keyed by source
- Pallet Town reads on approach to shadows room BAR artifact
- Pre-fill in encode modal — user confirms or edits before sealing

---

## Section 2 — DAEMON EMERGENCE (Phase 2 — TBD)

### 2.1 The Core Question

**When does a daemon emerge?**

The question is not "what is a daemon?" — it is "what triggers daemon emergence?"

Options under consideration:

**Option A — Accumulation trigger:** After N (3? 5? 7?) completed 321 sessions, a daemon materializes in Pallet Town. The daemon's type/form is determined by the dominant EA channel across those sessions.

**Option B — Pattern recognition:** When the same dissatisfaction pattern (from Tap the Vein analytics) fires across N sessions, a daemon emerges as the named pattern-holder. The daemon IS the pattern.

**Option C — BAR evolution:** A daemon IS a refined BAR. When a user "distills" enough BAR phrases from Tap the Vein, and those bars share a thread (same channel, same theme), a daemon emerges from the collection.

**Option D — 321 milestone:** Daemon emerges specifically from completing a 321 in the Shadows room (the most emotionally intense path). Each daemon has 321 lineage.

**Option E — Choice-based:** Player chooses when to "awaken" a daemon. Completing 3+ 321 sessions in a month unlocks the option. Player names the daemon and chooses its form.

### 2.2 Daemon Form (Visual)

If a daemon is a collectible in Pallet Town, what does it look like?

Options:
- **NPC sprite** in a new room (e.g., "Daemon Sanctum")
- **Companion sprite** that follows the player in Pallet Town
- **Evolves from the shadows room NPC** (Shadow Guide transforms into daemon when first daemon awakens)
- **Stored in an inventory panel** (like a Pokémon PC box)

### 2.3 Daemon Evolution

If a daemon grows, what makes it grow?
- More Tap the Vein entries (same channel)
- More 321 completions (same pattern)
- BAR phrases marked-as-BAR
- Time-based (daily practice → daemon grows)
- Choice-based (player feeds it specific things)

---

## Section 3 — Pipeline Data Model

### 3.1 Canonical Entry (Tap the Vein)

```
TapEntry {
  id: uuid
  ea_channel: string          // metal | water | wood | fire | earth | none
  ea_channel_corrected?: string  // if user corrected
  charge_strength: string    // none | mild | moderate | strong | intense
  bar_phrases: string[]      // raw extracted phrases
  bar_phrases_distilled?: { phrase: string, refined: boolean }[]
  theme_tags: string[]
  vibeulon_flag: boolean
  created_at: timestamp
}
```

### 3.2 321 Session Record

```
Session321 {
  id: uuid
  tap_entry_id?: uuid        // link back to Tap the Vein
  ea_channel: string        // locked at session start
  bars_seed: string          // 1-2 sentence summary
  mask_name?: string
  desire?: string
  fear?: string
  aligned_action?: string
  completed_at?: timestamp
  sent_to_pallet_town: boolean
}
```

### 3.3 Pallet Town BAR (via localStorage)

```
PalletTownBar {
  room: 'inquiry' | 'shadows' | 'library' | 'dojo'
  text: string
  source: 'tap-the-vein-distill' | '321-bars-seed'
  ea_channel?: string        // tagged if from 321
  tap_entry_id?: string
  session_321_id?: string
  sealed: boolean
  sealed_at?: timestamp
}
```

### 3.4 Daemon (Phase 2 — TBD schema)

Deferred until Section 2 decisions are made.

---

## Section 4 — Open Questions (Must Resolve Before Phase 2 Build)

| # | Question | Options | Decision Needed By |
|---|---|---|---|
| OQ1 | What triggers daemon emergence? | A (accumulation) / B (pattern) / C (BAR evolution) / D (321 milestone) / E (choice) | Phase 2 spec |
| OQ2 | What does a daemon look like in Pallet Town? | NPC / companion / inventory / room | Phase 2 spec |
| OQ3 | What makes a daemon evolve? | Tap entries / 321 completions / BAR count / time / choice | Phase 2 spec |
| OQ4 | How does "Distill the meaning" connect to Pallet Town? | A: new Pallet Town entry (no 321) / B: stored separately, not in Pallet Town | Phase 1 spec |
| OQ5 | Is the daemon collection stored in bars-engine (backend) or localStorage (Pallet Town)? | Backend (bars-engine) / localStorage / Hybrid | Phase 2 spec |

---

## Section 5 — Dependency Status

| Spec | Status | Blocks |
|---|---|---|
| `tap-the-vein-321-to-pallet-town-bridge.md` | **DEPENDENCY — in progress** | This spec's [3a.2] and [3b.3] |
| Tap the Vein write surface | ✅ Done | — |
| Tap the Vein analytics engine | ✅ Done | — |
| Tap the Vein "Hone" correction | ✅ Done | — |
| 321 pre-seed from Tap the Vein | ✅ Done | — |
| Pallet Town shadows room | ✅ Done | — |
| Pallet Town BAR encode modal | ✅ Done | — |

**This spec is BLOCKED on:** `tap-the-vein-321-to-pallet-town-bridge.md` completion.

---

## Section 6 — Next Steps

1. **Resolve bridge spec** (tap-the-vein-321-to-pallet-town-bridge.md) — unblocks [3a.2] and [3b.3]
2. **Resolve OQ4** — how does "Distill the meaning" route? (Phase 1 decision)
3. **Resolve daemon emergence (OQ1)** — this gates all of Section 5
4. **Resolve OQ2 + OQ3 + OQ5** — daemon form, evolution, storage (Phase 2)
5. **Write Daemon Spec** — full schema + Pallet Town integration once OQ1-5 resolved

---

*Status: BLOCKED on bridge spec — daemon emergence model not yet determined*