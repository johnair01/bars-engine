---
type: session-artifacts
topic: polarity-design-session-pulls
date: 2026-05-25
purpose: Three reference artifacts for POLARITY-DESIGN-SESSION-BRIEF.md
related:
  - POLARITY-DESIGN-6FACE-ANALYSIS.md
  - POLARITY-DESIGN-SESSION-BRIEF.md
tags: [mtgoa, friendcraft, scene-atlas, session-prep]
---

# Polarity Session — Pulled Artifacts

Three cards/views for the live polarity design session. Pulled 2026-05-25.

---

## 1. MTGOA hexagram card (exploration 64)

**Source:** `07 Book OS/HEXAGRAM_CARDS_CH1_FOREST.md` — Card 3

### Skeptic in the Forest

**Hex 63 · After Completion**  
*Gate: Skeptic · WAVE: Wake Up · Trigram: Li ☲ × Kan ☵*

**Cell coordinates (exploration layer):** Gate 3 (Skeptic) × Chapter 1 (Forest / Kan ☵)

You're pausing at the edge because the record says walks like this don't deliver. The doubt arrived before you entered.

The Skeptic in the Forest brings the awareness move — deliberate deceleration at the threshold. After completion, you see the path you actually walked, not the one the record predicted.

**Tasks**
1. Stop at the edge. What does the Skeptic's record say about how this goes? *One sentence.*
2. Take the second look: what's true about **this** walk that didn't match the pattern? Name one difference.
3. Walk from the second look. Capture what the record couldn't have predicted. *In the app, after the walk.*

*Skilled players: If the record blocks entry entirely, 3-2-1 (Wake Up) first.*

→ *Appendix A: The Four Allyship Domains — Raise Awareness*

**Session use:** This is **8×8 exploration** — interior gate × chapter face. Domain appears as **routing tag**, not suit. Ask: is Gate×Chapter enough for polarity, or do we need player-resolved overlay on application 52?

---

## 2. Friendcraft quest card (application 52)

**Source:** `04 Quests/Friendcraft Game/DECK-2026-05-14-52CardPromptDeck.md`

### ♠️ 5 — Show Up (base prompt)

**Rank tier:** Workhorse (2–7)  
**Suit:** Show Up  
**Telos bias:** Growing  

**Base prompt (channel-agnostic):**  
*"Let's do the thing we've been saying we'll do but haven't."*

**Channel is chosen at send-time** — same prompt, five registers:

| Channel | Translation |
|---------|-------------|
| **Earth / Neutral** | "Let's do the thing we've been saying we'll do but haven't." |
| **Wood / Joy** | "Let's finally do this. I've been wanting to — let's just go." |
| **Fire / Anger** | "We've been saying it. What's actually been in the way?" |
| **Water / Sadness** | "What does finally doing this mean to us? I want to sit with that." |
| **Metal / Fear** | "What are we afraid will happen if we actually do this?" |

**Session use:** Application layer — WCGS suit + rank + **send-time channel**. No hexagram coordinates. Friend sees one chosen register. Ask: what **8×8 axes** would produce a **book exploration** card that complements this, not duplicates it?

---

## 3. Scene Atlas quadrant view (application 2×2)

**Source:** `bars-engine/src/lib/creator-scene-grid-deck/polarities.ts` + `suits.ts`  
**Live route:** `/creator-scene-deck` (instance `creator-scene-grid`)

### Default polarity resolution

| Axis | − pole | + pole |
|------|--------|--------|
| **pair1** | Top | Bottom |
| **pair2** | Lead | Follow |

**Resolution source:** `default` (fallback when no adventure JSON or nation/playbook derivation)

### 2×2 quadrant grid

```
                    pair2 (−) LEAD          pair2 (+) FOLLOW
                 ┌─────────────────────────┬─────────────────────────┐
 pair1 (−) TOP   │  SCENE_GRID_TOP_DOM     │  SCENE_GRID_TOP_SUB     │
                 │  Top · Lead             │  Top · Follow           │
                 ├─────────────────────────┼─────────────────────────┤
 pair1 (+) BOTTOM│  SCENE_GRID_BOTTOM_DOM  │  SCENE_GRID_BOTTOM_SUB  │
                 │  Bottom · Lead          │  Bottom · Follow        │
                 └─────────────────────────┴─────────────────────────┘
```

Each quadrant = **13 ranks** (Anchor → Integration) = **52 application cells**.

**Stable storage:** suit key (`SCENE_GRID_*`) never changes.  
**Display labels:** derived from resolved pairs (adventure → nation+playbook → default).

**Session use:** This is **application polarity** (2×2→4). MTGOA/Friendcraft **exploration** is **8×8→64** — same *method* (Cartesian product + stable keys + resolved labels), different factorization.

---

## Side-by-side (why one session)

| | Hexagram (MTGOA) | Quest (Friendcraft) | Scene Atlas |
|---|------------------|---------------------|-------------|
| **Layer** | Exploration 64 | Application 52 | Application 52 |
| **Grid** | 8 × 8 = 64 | 4 suits × 13 ranks | 2×2 × 13 ranks |
| **Axes** | Gate × Chapter | WCGS suit (function) | pair1 × pair2 (labels) |
| **Personalization** | Book-stable cell | Channel at send | Resolved quadrant labels |
| **Earn / play** | BAR capture unlock | Draw → send → provenance | Bind BAR → grid cell |

---

## Open prompts (with artifacts in hand)

1. **MTGOA:** Is Skeptic×Forest the right *kind* of cell for exploration polarity? (default: yes)
2. **Domains:** Is "Raise Awareness" footer enough, or does task 1–3 need domain-colored rewrite?
3. **Friendcraft:** What two **8-way** axes produce a cell that feels like hexagram depth but friendship voice?
4. **Scene Atlas:** Required primer before craft lines, or soft link from `/hand`?
