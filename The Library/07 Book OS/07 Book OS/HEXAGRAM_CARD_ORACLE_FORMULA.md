---
type: spec
aliases:
  - Oracle Text Formula
  - Hexagram Card Formula
tags:
  - mtgoa
  - bars
  - hexagram-cards
  - oracle
created: 2026-05-20
authority: in-progress
state: canonical — formula confirmed via Ch2 pilot; design decisions locked 2026-05-21; C2 Source Requirement + TYPE A/B/C classification added 2026-05-22; ALLYSHIP DOMAIN integration pending (see ALLYSHIP_DOMAINS_SPEC.md)
---

# Hexagram Oracle Card — Oracle Text Formula
**Purpose:** A generative formula for writing consistent, oracular 2-3 sentence card text across all 64 hexagram cards. Without this, each card is ad-hoc and quality is inconsistent.

**Related files:**
- `GATE_GIFTS_ALLYSHIP_MOVES.md` — gate gifts + behavioral tasks (the tasks section of each card)
- `BARS_ICHING_ARCHITECTURE.md` — 64-hexagram matrix, trigram mappings
- `CHAPTER_GOALS_AND_MILESTONES.md` — chapter goals (locked) + capacity milestones

---

## What the Oracle Text Must Do

1. **Work in two directions simultaneously:** Memory-activation (you've been here before — what's it calling back?) AND forward oracle (what does this moment need from you?). Same text, both functions.
2. **Be oracular, not prescriptive:** Speaks to multiple situations without being so abstract it says nothing. A tarot card works whether you're in the Tower, approaching it, or coming through it.
3. **Pivot from shadow to gift:** The reader draws this card because the shadow is probably running. The oracle text names what's blocking AND what's available. The pivot is the move.
4. **Anchor to the chapter context:** "Skeptic in the Shaman" is different from "Skeptic in the Challenger." The chapter goal shapes what the gate's gift is being called to do HERE.
5. **Wendell's voice:** Compressed. Direct. No teaching mode. No setup sentences. No announcement phrases. The observation IS the insight.

---

## The Inputs (per card)

| Input | Source |
|-------|--------|
| Gate name | BARS_ICHING_ARCHITECTURE.md |
| Gate shadow (what blocks the gift) | GATE_VOICES_CANONICAL.md |
| Gate gift (what it offers in allyship) | GATE_GIFTS_ALLYSHIP_MOVES.md |
| Chapter name (Face) | BARS_ICHING_ARCHITECTURE.md |
| Chapter goal (what the chapter builds toward) | CHAPTER_GOALS_AND_MILESTONES.md |
| Chapter trigram quality | BARS_ICHING_ARCHITECTURE.md |
| Gate trigram quality | BARS_ICHING_ARCHITECTURE.md |
| Hexagram number + traditional name | BARS_ICHING_ARCHITECTURE.md |
| **Hexagram Image text (Wilhelm/Baynes)** | **Wilhelm/Baynes translation — required for C2** |
| WAVE stage | GATE_VOICES_CANONICAL.md |
| Double-trigram flag | BARS_ICHING_ARCHITECTURE.md (bold cells) |

---

## The Formula

### Component 1 — The Shadow Running (1 sentence)
Names what's probably happening that brought this card. The reader is likely IN this state. Written in second person, present tense. Not accusatory — diagnostic.

**Pattern:** *[What the shadow is doing] — not to the situation, but [where it's actually aimed].*

**Voice rule:** Don't name the gate in this sentence. Name the experience. The reader should recognize themselves before they see the gate label.

**Examples:**
- "Something in you already knows what this moment needs — and something else is making sure you don't trust it." (Skeptic shadow)
- "You've been trying to figure out what to do. The trying is the problem." (Vulnerable Child in exile)
- "You know what needs to be said. You're managing the delivery instead of making the move." (Challenger shadow)

---

### Component 2 — The Gift × Chapter Intersection (1 sentence)
Names what this gate's gift is being called to do IN THIS CHAPTER'S TERRITORY. This is the pivot — from shadow to gift. It uses the chapter goal as the context that sharpens the gate's gift.

**Pattern:** *[Gate gift] meets [chapter territory/goal] — what becomes possible here is [specific intersection].*

Or more compressed: *[What the gift does] + [what the chapter needs] = [the move].*

**Voice rule:** Don't over-explain the intersection. One clean statement of what this combination makes available. The reader brings the rest.

**Formula for generating this sentence:**
1. Take the gate gift (from GATE_GIFTS_ALLYSHIP_MOVES.md — the key insight line)
2. Take the chapter goal (from CHAPTER_GOALS_AND_MILESTONES.md — the orienting goal line)
3. Ask: what does this gate do when it's operating IN the service of this chapter's goal?
4. Write that as one sentence.

**Examples (Skeptic × Shaman — chapter goal: read the emotional field before acting):**
- Shadow: "The Skeptic slows things down — and in the Shaman's territory, that's not the problem. That's the practice."
- Gift: "The deliberate pause is how the emotional field gets read accurately."

**Examples (Fixer × Regent — chapter goal: steward without owning):**
- "The Fixer's scope discipline — only fix what's yours — is exactly the move the Regent's territory needs: not fixing the institution, but naming the one thing within your stewardship that's broken."

---

---

## C2 Source Requirement (locked 2026-05-22)

Component 2 must open with the hexagram's Image text (Wilhelm/Baynes — the "Great Image" lines) rendered as a present-tense situation before stating the gate's gift. The Image text is not appended to C2; it IS the opening of C2. Without it, cards are built from two inputs (gate gift × chapter goal) and generate accurate but generic allyship guidance. The Image text is the third input that provides the situational specificity no formula can generate.

**Translation protocol for "superior man" language:**
- "The superior man does not tread paths..." → "the move is not to force the path" (retain meaning, remove figure)
- "Thus the superior man stands firm..." → "stand firm" (retain directive, remove authority)
- The image stays. The Confucian authority figure becomes the player's own move.

**The Challenger's test:** Cover the hexagram name. Does the oracle text change? If not, the Image text isn't load-bearing yet.

---

## Component Order — TYPE Classification

Each hexagram belongs to one of three types. The type determines which component opens the card.

**TYPE A — Difficulty/Blockage**
Hexagrams whose energy is obstacle, constraint, or stuck state.
Order: Shadow → Image+Gift → Move.
The shadow is the entry because the situation IS the stuck state.
*Examples: Hex 39 Obstruction, Hex 60 Limitation, Hex 63 After Completion, Hex 29 Abyss, Hex 62 Small Exceeding, Hex 3 Difficulty at the Beginning*

**TYPE B — Movement/Availability**
Hexagrams whose energy is already in motion toward something.
Order: Image → Gift → Shadow.
The image is the entry because the energy is already moving — meet it there.
*Examples: Hex 16 Enthusiasm, Hex 24 Return, Hex 11 Peace, Hex 51 The Arousing, Hex 46 Pushing Upward, Hex 34 Great Power*

**TYPE C — Threshold/Transition**
Hexagrams that mark a crossing, a peak, or a release point.
Order: Image → Shadow → Gift.
Name the moment first, then what blocks at the threshold, then what moves through it.
*Examples: Hex 50 The Cauldron, Hex 40 Deliverance, Hex 55 Abundance, Hex 48 The Well, Hex 54 Given Conditions*

**Note:** If a hexagram's energy doesn't fit cleanly into A/B/C, the hexagram's energy wins. The classification serves the oracle, not the formula.

---

### Component 3 — The Invitation (1 sentence, optional)
Closes the oracle text. What becomes possible. Sometimes this is explicit; sometimes the first two sentences already carry it and Component 3 would over-explain.

**Test for inclusion:** If removing this sentence makes the card feel incomplete, include it. If the first two sentences already land, leave it out.

**Pattern:** *[What's now available] — [the specific quality of what opens when the gift is operating].*

**Voice rule:** Not "you can now do X." More like: "what was blocked is available." Don't announce — point.

**Examples:**
- "It's still there." (Skeptic — the knowing went underground but persists)
- "The move comes after." (Vulnerable Child — don't strategize yet, receive first)
- "The one thing worth doing is smaller than you think." (Fixer — scope discipline)

---

## Full Card Structure (annotated)

```
[Gate name] in [Face/Chapter name]
Hex [number] · [Traditional name OR MTGOA name if traditional is opaque]

[Component 1: Shadow running — 1 sentence]
[Component 2: Gift × Chapter intersection — 1 sentence]
[Component 3: Invitation — 1 sentence, optional]

Gate: [Gate name] · WAVE: [Wake Up / Clean Up / Grow Up / Show Up]

1. [Task 1 — body/sensing move]
2. [Task 2 — move in the world]
3. [Task 3 — capture as BAR]

Skilled players: Take [Gate name] into the 3-2-1 ([WAVE stage]) if the shadow is blocking the gift.

→ Appendix: [Domain] activities and the Chapter [N] quest for deeper practice.
```

---

## Voice Rules for Oracle Text

1. **No setup sentences.** Don't explain what you're about to say. Say it.
2. **No announcement phrases.** "Notice that..." / "Here's what's happening..." / "The key insight is..." → all cut.
3. **Second person, present tense.** "You're not stuck because..." not "People often find themselves..."
4. **The observation IS the insight.** Don't explain the metaphor after you use it.
5. **Short is hard.** A vague sentence is usually a long one. Each sentence should be load-bearing.
6. **The shadow sentence doesn't shame.** It diagnoses. "Something in you already knows" not "You're avoiding."

---

## The Double-Trigram Rule

When the gate trigram and chapter trigram are the same (8 cells in the matrix — marked bold), the card carries special resonance: the energy is doubled, pure, without the tension of two different forces.

For these 8 cards:
- Component 1 (shadow) is often more intense — the doubled energy amplifies the shadow when unchecked
- Component 2 (gift) is often the simplest, most essential statement of the gate's gift — no complexity from a second trigram
- Component 3 (invitation) should reflect the doubled nature — "pure," "complete," "the deepest version of this work"

**The 8 double-trigram cards:**
- G1/Ch5 = Hex 1 (Protector × Architect = Heaven doubled)
- G2/Ch6 = Hex 58 (Controller × Diplomat = Lake doubled)
- G3/Ch8 = Hex 30 (Skeptic × Player = Fire doubled)
- G4/Ch3 = Hex 51 (Fixer × Challenger = Thunder doubled)
- G5/Ch4 = Hex 57 (Victim × Regent = Wind doubled)
- G6/Ch1 = Hex 29 (Emotional Body × Forest = Water doubled)
- G7/Ch7 = Hex 52 (Damaged Self × Sage = Mountain doubled)
- G8/Ch2 = Hex 2 (Vulnerable Child × Shaman = Earth doubled)

---

## Quality Test (per card)

A card passes if:
1. **Recognition test:** Someone in the shadow state reads Component 1 and thinks "that's me."
2. **Both-directions test:** The oracle text works whether you're about to act OR reflecting after.
3. **No-book test:** The tasks are actionable even for someone who hasn't done the 3-2-1 before.
4. **Voice test:** No sentence could be from a workshop handout. Every sentence sounds like it was said, not written.
5. **Specificity test:** The gate × chapter combination is distinct — "Skeptic in the Shaman" has different oracle text than "Skeptic in the Challenger."

---

## Design Decisions (locked 2026-05-21)

**Appendix routing line:** Every card ends with a routing line below the Skilled Players note pointing to the appendix for deeper allyship practice. Format: `→ Appendix: [Domain] activities and the Chapter [N] quest for deeper practice.` The domain is the gate's home domain (from gate-domain affinity table). The chapter number is the current chapter. This line appears on all 64 cards — it converts the card from a self-contained encounter into a doorway. Existing cards (Ch1–Ch3) need this added in the full revision pass after all 64 are drafted.

**Difficulty levels:** Don't add. These are earned cards. Fix underspecified tasks; don't label them. The Vulnerable Child "which mode is live right now" model is the template for meeting the person where they are.

**Relational Task 2 variant:** "Solo / With:" modifier, applied selectively to intrinsically relational gates only: Controller, Victim, context-dependent Challenger. Interior gates (Skeptic, Vulnerable Child, Damaged Self) stay solo-only. Format: one line beneath Task 2 text — *Solo: [form]. With: [who and what].*

**Hexagram name rule:**
- *Actively misleads* → replace with MTGOA oracle name
- *Opaque but not misleading* → keep + parenthetical: e.g., "Biting Through (Forcing Through Resistance)"
- *Already evocative* → keep as is
- Credit line: "(I Ching: [pinyin])" in small text for readers who know the system

**Visual hierarchy (physical-first design):**
1. Gate × Chapter heading
2. Hex number + symbol + name
3. Oracle text (Components 1–3) — 50 words max
4. WAVE stage inline (near Skilled Players line, not top navigation)
5. Tasks 1-2-3 — 30 words each max
6. Skilled players → 3-2-1 deep link

Total: ~150 words physical / ~200 words digital. Hexagram symbol in header.

---

## Pilot: Ch2 Shaman — 8 Cards to Draft First

Upper trigram: Kun ☷ Earth | Chapter goal: Read the emotional field before any allyship move is made.

| Gate | Hexagram | Traditional name | Notes |
|------|---------|-----------------|-------|
| G1 Protector | 11 | Peace | Gate that keeps you functional meets the chapter that asks you to feel first |
| G2 Controller | 19 | Approach | Meta-gate (routes other voices) meets emotional field reading |
| G3 Skeptic | 36 | Darkening of Light | Already drafted — knowing goes underground |
| G4 Fixer/Healer | 24 | Return | Scope-discipline meets the chapter about reading before fixing |
| G5 Victim | 46 | Pushing Upward | Storytelling gate meets the felt-sense chapter |
| G6 Emotional Body | 7 | The Army | Home territory — this is the Shaman's core gate |
| G7 Damaged Self | 15 | Modesty | Chosen damage meets the chapter about what the body carries |
| G8 Vulnerable Child | 2 | The Receptive | **Double-trigram** — Earth doubled, the deepest card in this chapter |
