---
type: architecture-spec
aliases:
  - BARs I Ching System
  - Hexagram BAR Architecture
tags:
  - mtgoa
  - bars
  - iching
  - gates
  - chapters
created: 2026-05-19
authority: in-progress
state: draft — core architecture captured, mappings TBD via interview
---

# BARs ↔ I Ching Hexagram Architecture
**Core insight from 2026-05-19 session**
**Status:** Architecture confirmed. Specific trigram↔gate and trigram↔chapter mappings need to be locked in.

---

## The System

A BAR in MTGOA is not just a captured moment — it is a **hexagram**: the intersection of a Gate (Earlier Heaven trigram) and a Chapter/Face (Later Heaven trigram).

- **8 Gates** → map to **Earlier Heaven (Fuxi/Xiantian)** trigram arrangement
- **8 Chapters** → map to **Later Heaven (King Wen/Houtian)** trigram arrangement
- **A BAR** = Gate trigram (lower?) + Chapter trigram (upper?) = 1 of 64 hexagrams

This gives a complete BAR space: **64 hexagram types** = 64 distinct types of transformation moment.

The reader's BAR deck, over the course of the book, is a set of hexagrams they've personally activated.

---

## Earlier Heaven (Fuxi) — Gate Mapping

The Earlier Heaven arrangement describes the **primordial order** — pre-manifestation, pure potential. Maps to the Gates because the Gates are the pre-manifest interior structure: the voices that shape experience before it becomes visible behavior.

Earlier Heaven sequence (standard):
| Position | Trigram | Symbol | Element | Quality |
|----------|---------|--------|---------|---------|
| 1 | Qian | ☰ | Heaven | Pure Yang / Creative |
| 2 | Dui | ☱ | Lake | Joy / Open |
| 3 | Li | ☲ | Fire | Clarity / Brightness |
| 4 | Zhen | ☳ | Thunder | Movement / Arousal |
| 5 | Xun | ☴ | Wind | Penetrating / Gentle |
| 6 | Kan | ☵ | Water | Depth / Danger |
| 7 | Gen | ☶ | Mountain | Stillness / Keeping Still |
| 8 | Kun | ☷ | Earth | Pure Yin / Receptive |

**Gate → Trigram mapping (confirmed 2026-05-19, prose order clarified 2026-05-20):**

**Two numbering systems — do not conflate:**
- **Earlier Heaven position** = the trigram's place in the Fuxi sequence. This is what determines which trigram each voice maps to, and how hexagrams are computed in the BAR system.
- **Prose gate number** = the reading order in the manuscript gate walk (1–8). Matches Earlier Heaven positions for Gates 1–4 and 7–8. **Gates 5 and 6 diverge:** Emotional Body appears at prose position 5 and Victim at prose position 6 — matching traditional Big Mind order and readability logic. But their trigram identities follow the Earlier Heaven sequence: Victim = Xun (EH position 5), Emotional Body = Kan (EH position 6).

**BAR tagging uses voice name → trigram, not prose gate number.**

| EH Position | Voice | Prose Gate # | Trigram | Symbol | Rationale |
|-------------|-------|-------------|---------|--------|-----------|
| 1 | Protector | 1 | Qian | ☰ Heaven | Pure Yang, first mover — survival is the first question |
| 2 | Controller | 2 | Dui | ☱ Lake | Contained, managed field — the Controller holds what is acceptable |
| 3 | Skeptic | 3 | Li | ☲ Fire | Illuminates and consumes — casts light on threat, burns away possibility |
| 4 | Fixer/Healer | 4 | Zhen | ☳ Thunder | Sudden arousal — can't sit still when something is broken, gets things moving |
| 5 | Victim | **6** | Xun | ☴ Wind | Penetrates everywhere, circulates story, finds every sympathetic opening |
| 6 | Emotional Body | **5** | Kan | ☵ Water | Depth, danger, what lies beneath — the raw signal before language arrives |
| 7 | Damaged Self | 7 | Gen | ☶ Mountain | Stillness, immovable, has absorbed everything — doesn't perform what shaped it |
| 8 | Vulnerable Child | 8 | Kun | ☷ Earth | Pure Yin, receptive, fertile ground — the destination state |

---

## Later Heaven (King Wen) — Chapter Mapping

The Later Heaven arrangement describes the **manifest world** — the cycle of seasons, movement through time. Maps to the Chapters because the Chapters are the visible developmental journey the reader moves through.

Later Heaven sequence (standard, by compass direction):
| Position | Trigram | Symbol | Element | Season/Direction |
|----------|---------|--------|---------|-----------------|
| 1 | Kan | ☵ | Water | North / Winter |
| 2 | Kun | ☷ | Earth | Southwest |
| 3 | Zhen | ☳ | Thunder | East / Spring |
| 4 | Xun | ☴ | Wind | Southeast |
| 5 | (center) | — | — | Center |
| 6 | Qian | ☰ | Heaven | Northwest |
| 7 | Dui | ☱ | Lake | West / Autumn |
| 8 | Gen | ☶ | Mountain | Northeast |
| 9 | Li | ☲ | Fire | South / Summer |

**Chapter → Trigram mapping (confirmed 2026-05-19 — King Wen sequence, positions 1–4 then 6–9, applied sequentially):**

| Chapter | Face | KW Position | Trigram | Symbol | Element | Direction | Rationale |
|---------|------|------------|---------|--------|---------|-----------|-----------|
| Ch1 | The Forest | 1 | Kan | ☵ | Water | North/Winter | Entering the depths — the threshold is the abyss you don't know you'll return from |
| Ch2 | Shaman | 2 | Kun | ☷ | Earth | Southwest | Receptive, fertile ground — the Shaman works with what is already here |
| Ch3 | Challenger | 3 | Zhen | ☳ | Thunder | East/Spring | Sudden arousal, shock that gets things moving — the Challenger's energy exactly |
| Ch4 | Regent | 4 | Xun | ☴ | Wind | Southeast | Gentle but persistent penetration — the Regent holds through quiet consistent presence |
| Ch5 | Architect | 5 | Qian | ☰ | Heaven | Northwest | Pure creative force — the Architect builds from vision downward into structure |
| Ch6 | Diplomat | 6 | Dui | ☱ | Lake | West/Autumn | Joy, exchange, the open mouth — the Diplomat holds space for genuine delight |
| Ch7 | Sage | 7 | Gen | ☶ | Mountain | Northeast | Stillness, the panoramic view from height — the Sage keeps still in order to see |
| Ch8 | Player | 8 | Li | ☲ | Fire | South/Summer | Clarity, brilliance, illumination — the Player brings everything into light |

**Note on the double-trigram cases:**
- Xun ☴ (Wind) appears as both Gate 5 (Victim) in Earlier Heaven AND Ch4 (Regent) in Later Heaven. This means the BAR "Victim encountered in the Regent chapter" = Xun over Xun = Hexagram 57 (巽, The Gentle/Wind) — pure penetration, the repeating wind.
- Gen ☶ (Mountain) appears as both Gate 7 (Damaged Self) in Earlier Heaven AND Ch7 (Sage) in Later Heaven. "Damaged Self encountered in the Sage chapter" = Gen over Gen = Hexagram 52 (艮, Keeping Still) — complete stillness, the mountain doubled.
- These resonances are meaningful, not accidental.

---

## The Victim / Damaged Self — Trigram Mapping (Resolved 2026-05-19)

**Victim = Xun ☴ (Wind)**
Wind penetrates everywhere. It finds every crack, every sympathetic ear, every social opening. The Victim's story *circulates* — it enters every conversation, adapts to whoever is listening, keeps moving until it finds traction. Wind is the most social element. The Drama Triangle runs on social narrative. Wind doesn't have its own form — it follows the shape of whatever it enters.

**Damaged Self = Gen ☶ (Mountain)**
The Mountain doesn't explain what shaped it. It has absorbed everything that struck it and does not perform that absorption. Doesn't move regardless of what hits it. "Did you die though" — the Mountain answer is no, and it doesn't say it out loud. Still. Immovable. Has absorbed.

**Why this pairing works:**
- Victim = how the story moves through social space
- Damaged Self = what actually happened
- Wind/Mountain separates social-narrative function from survival-structure function
- Water (Kan) for Victim would have blurred the two — both would be about depth and damage

**Resolution (2026-05-19):** Gates 5 and 6 swapped. Victim = Gate 5 = Xun ☴ (Wind). Emotional Body = Gate 6 = Kan ☵ (Water). The mapping is sequential — gate number = Earlier Heaven position. The swap resolves the trigram conflict.

**Manuscript implication:** None. Prose order (Emotional Body at position 5, Victim at position 6) is correct and intentional. Earlier Heaven positions apply to the BAR/hexagram system by voice identity, not by prose number.

---

## Manuscript Impact — Gates 5/6 Ordering

**Status: CLOSED — by design (2026-05-20). No manuscript edits needed.**

The current manuscript order (Emotional Body at prose position 5, Victim at prose position 6) is correct:
- Matches traditional Big Mind sequence (Emotional Body before Victim)
- Matches readability logic for this book

The Earlier Heaven trigram positions are preserved for the BAR/hexagram system via voice-name identity (Victim = Xun = EH position 5; Emotional Body = Kan = EH position 6), not via prose gate number. The BAR system tags by voice, not by prose number. The two numbering systems are independent and do not conflict.

---

## Interview Notes (2026-05-19)

*To be filled in as interview proceeds*

**Q: What does it feel like from the inside to be in the Damaged Self?**
A: [TBD]

**Q: What does the Victim feel like from the inside?**
A: [TBD]

**Q: Is there a sequence — does one come before the other, or do they coexist?**
A: [TBD]

**Q: In the gate walk as readers encounter it — which one do they hit first?**
A: [TBD]

---

## The 64 Hexagram Matrix

**Formula:** Gate trigram (lower) + Chapter trigram (upper) = hexagram = BAR type

**Trigram reference numbers (King Wen encoding):**
Qian=1 ☰, Dui=2 ☱, Li=3 ☲, Zhen=4 ☳, Xun=5 ☴, Kan=6 ☵, Gen=7 ☶, Kun=8 ☷

**Chapter upper trigrams:**
Ch1=Kan(6), Ch2=Kun(8), Ch3=Zhen(4), Ch4=Xun(5), Ch5=Qian(1), Ch6=Dui(2), Ch7=Gen(7), Ch8=Li(3)

**Gate lower trigrams:**
G1=Qian(1), G2=Dui(2), G3=Li(3), G4=Zhen(4), G5=Xun(5), G6=Kan(6), G7=Gen(7), G8=Kun(8)

| Gate (lower) | Ch1 Forest ☵ | Ch2 Shaman ☷ | Ch3 Challenger ☳ | Ch4 Regent ☴ | Ch5 Architect ☰ | Ch6 Diplomat ☱ | Ch7 Sage ☶ | Ch8 Player ☲ |
|---|---|---|---|---|---|---|---|---|
| **G1 Protector ☰** | 5 Waiting | 11 Peace | 34 Great Power | 9 Small Taming | **1 Creative** | 43 Breakthrough | 26 Great Taming | 14 Great Possession |
| **G2 Controller ☱** | 60 Limitation | 19 Approach | 54 Marrying Maiden | 61 Inner Truth | 10 Treading | **58 Joy** | 31 Influence | 38 Opposition |
| **G3 Skeptic ☲** | 63 After Completion | 36 Darkening of Light | 55 Abundance | 37 The Family | 13 Fellowship | 49 Revolution | 22 Grace | **30 Clinging/Fire** |
| **G4 Fixer/Healer ☳** | 3 Difficulty at Beginning | 24 Return | **51 Arousal/Thunder** | 42 Increase | 25 Innocence | 17 Following | 27 Nourishment | 21 Biting Through |
| **G5 Victim ☴** | 48 The Well | 46 Pushing Upward | 32 Duration | **57 The Gentle/Wind** | 44 Coming to Meet | 28 Great Excess | 18 Work on Decay | 50 The Cauldron |
| **G6 Emotional Body ☵** | **29 Abysmal/Water** | 7 The Army | 40 Deliverance | 59 Dispersion | 6 Conflict | 47 Oppression | 4 Youthful Folly | 64 Before Completion |
| **G7 Damaged Self ☶** | 39 Obstruction | 15 Modesty | 62 Small Exceeding | 53 Gradual Progress | 33 Retreat | 31 Influence | **52 Keeping Still** | 56 The Wanderer |
| **G8 Vulnerable Child ☷** | 8 Holding Together | **2 Receptive** | 16 Enthusiasm | 20 Contemplation | 12 Standstill | 45 Gathering | 23 Splitting Apart | 35 Progress |

**Bold = same trigram appears as both gate and chapter (double-trigram hexagrams) — these carry special resonance.**

### Notable intersections
- **G1/Ch5 = Hex 1 (Creative):** Protector encountered in the Architect chapter — pure Heaven, the moment before you decide whether to build
- **G4/Ch3 = Hex 51 (Arousal):** Fixer/Healer in the Challenger chapter — Thunder doubled, the shock of recognizing your fixing as avoidance of clean confrontation
- **G5/Ch4 = Hex 57 (The Gentle):** Victim in the Regent chapter — Wind doubled, the story that has been circulating so long it feels like governance
- **G6/Ch1 = Hex 29 (Abysmal):** Emotional Body in the Forest chapter — Water doubled, the threshold is also the abyss
- **G7/Ch7 = Hex 52 (Keeping Still):** Damaged Self in the Sage chapter — Mountain doubled, the deepest stillness in the book
- **G8/Ch2 = Hex 2 (Receptive):** Vulnerable Child in the Shaman chapter — Earth doubled, pure receptivity — this is the destination of the Shaman work

---

## How the Hexagram System Works in Practice

When a reader captures a BAR, they are (knowingly or not) activating a hexagram:

> **Gate encountered** (which voice spoke) × **Chapter context** (which Face's work) = **hexagram**

Example: If the Skeptic (Gate 3) spoke loudly during the Challenger chapter (Ch3), the BAR is the hexagram formed by the Skeptic's trigram (lower) and the Challenger's trigram (upper).

The app can:
1. Tag BARs by Gate + Chapter automatically (since the reader is in a specific chapter when they capture)
2. Show the reader which hexagram they've activated
3. Build a picture of which hexagram-types dominate their pattern
4. Suggest quests based on hexagram patterns

---

## Open Design Questions

1. **Direction of the hexagram:** Is the Gate the lower trigram and the Chapter the upper, or vice versa? (Lower = the foundation/interior; Upper = the situation/exterior — Gate-as-foundation makes more sense)
2. **All 64 or a subset?** Not every Gate will be encountered in every Chapter — does the app track what's theoretically possible or only what the reader activates?
3. **Hexagram meaning:** Do the traditional I Ching hexagram meanings inform the BAR type? Or is the mapping purely structural?
4. **Ch0 and the 8-chapter count:** Ch0 (Infinite Arcade) is a prologue — is it in the Later Heaven mapping or outside it?
5. **The Victim/Damaged Self ordering:** Locked by interview.

---

## Related Files
- `BARS_INTEGRATION_SPEC.md` — original BAR integration spec (book ↔ app)
- `GATE_VOICES_CANONICAL.md` — canonical gate breakdown
- `DEVELOPMENTAL_ISSUES_TRACKER.md` — Issue 3 (BARs integration)
