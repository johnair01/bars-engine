---
type: writing-spec
aliases:
  - Oracle Card Integration Spec
  - BAR Manuscript Integration Spec
tags:
  - mtgoa
  - bars
  - hexagram-cards
  - oracle
  - editorial
created: 2026-05-22
authority: working
state: draft — all 64 cards complete; this spec defines the full integration sequence
---

# Hexagram Card Manuscript Integration Spec
**Purpose:** Define how the 64 oracle cards fold into the manuscript — what appears in the book, where it goes, how the earn mechanic works, and what the complete integration pass looks like for each chapter.

---

## The Two-Layer System

There are two distinct artifacts. This spec governs how they interlock.

**Layer 1 — BAR Gate Prompts (in-manuscript)**
Short embedded captures, one per gate per chapter. 2–4 sentences in Wendell's voice. No teaching mode. Appear in the chapter body, after the gate's closing prose, before the section divider. These are what the reader sees while reading. Total: 56 prompts across Ch1–Ch7.

**Layer 2 — Oracle Cards (earned deck)**
Full-length hexagram oracle cards — the card texts in `HEXAGRAM_CARDS_CH*.md`. These are NOT embedded in the chapter prose. They are either: (a) delivered to the reader via the app after a BAR capture, or (b) collected as a physical/printable card deck in the book's back matter or app. The reader earns a card by making a BAR capture at the matching gate. Total: 64 cards.

**The mechanic in sequence:**
1. Reader reaches Gate N in Chapter M
2. BAR Gate Prompt fires immediately after the gate closes
3. Reader opens app, captures a BAR (2–3 minutes)
4. App unlocks the matching oracle card (Gate N × Chapter M hexagram)
5. Oracle card gives a deeper invitation: richer image text, 3 tasks, appendix routing
6. Reader keeps the card in their deck for ongoing practice

**What this means for the manuscript:** The BAR prompt is the bridge. The oracle card is the destination. The chapter body never contains oracle card text. The chapter body contains only the 2–4 sentence prompt that opens the bridge.

---

## BAR Gate Prompt — Rules

### Placement
- After the gate section's closing prose (the "when you're ready, keep walking" line or equivalent)
- Before the `---` section divider
- Formatted as a block quote (italic) or set off with a visual element — see Open Questions

### Length and voice
- 2–4 sentences. No more.
- Direct address. Wendell's register for this chapter's Face.
- No explanation of what a BAR is (Ch0 handles that once)
- No teaching mode — not "what the gate teaches us" or "using the BAR format"
- Points to app (use `→ app` as placeholder until URL is confirmed)
- Does not name the hexagram or I Ching

### Content logic (per BAR_GATE_PROMPT_SPEC.md)
For each gate × chapter prompt, the writer uses:
1. What this gate does in this chapter's Face context
2. What the ideal reader will do instead of capturing (default processing reflex)
3. What we want captured — the felt-sense instance before interpretation
4. The hexagram character — the quality of movement that shapes the prompt's voice (invisible to reader)

### What the prompt is not
- Not journaling ("take a moment to reflect")
- Not comprehension check ("what did the gate teach you")
- Not an achievement marker ("you've completed Gate 3")
- Not therapeutic ("how does this connect to earlier experiences")
- Not relational advice ("share this with someone you trust") — that's the oracle card's job

---

## Chapter-by-Chapter Integration Matrix

Upper trigram per chapter determines the Face's territory — the coloring every gate encounter carries in that chapter.

| Ch | Face | Upper Trigram | Gate × Chapter Color | Double-Trigram Card |
|----|------|--------------|---------------------|-------------------|
| 1 | Forest | Kan ☵ Water | The threshold — all gates encountered through water: uncertainty, depth, what moves in the dark | Card 6 Emotional Body (Water × Water = Hex 29) |
| 2 | Shaman | Kun ☷ Earth | Reception — all gates as versions of what the body receives before the story about it | Card 8 Vulnerable Child (Earth × Earth = Hex 2) |
| 3 | Challenger | Zhen ☳ Thunder | Confrontation — all gates as versions of what blocks a clean no or a clean move | Card 3 Skeptic (Thunder × Thunder = Hex 51) |
| 4 | Regent | Xun ☴ Wind | Stewardship — all gates as versions of carrying something worth belonging to | Card 5 Victim (Wind × Wind = Hex 57) |
| 5 | Architect | Qian ☰ Heaven | Design — all gates as versions of building something that runs without you | Card 1 Protector (Heaven × Heaven = Hex 1) |
| 6 | Diplomat | Dui ☱ Lake | Field-holding — all gates as versions of keeping the container open | Card 2 Controller (Lake × Lake = Hex 58) |
| 7 | Sage | Gen ☶ Mountain | Altitude — all gates as versions of seeing the whole game without leaving it | Card 7 Damaged Self (Mountain × Mountain = Hex 52) |
| 8 | Player | Li ☲ Fire | Composition — all gates as versions of designing a practice that outlives you | Card 3 Skeptic (Fire × Fire = Hex 30) |

**Double-trigram cards are the deepest prompt in the chapter.** The BAR prompt for a double-trigram gate should carry the chapter's fullest register — the place where the Face and the Gate meet most completely. These are the prompts most likely to stop the reader.

---

## Ch0 — Deck Introduction

**There are no gate prompts in Ch0.** Ch0 is before the 8-chapter journey; it doesn't have a gate walk.

**Ch0's job regarding BARs:** Introduce the capture system in Wendell's voice before the reader hits the first prompt. One paragraph, probably near the end of Ch0 where the reader is being oriented to the journey ahead.

**What the paragraph needs to do:**
- Name what a BAR is without using the acronym or the teaching register
- Tell the reader they're building something (a deck, a practice — whatever the final framing is)
- Give them the mechanics: open app, capture, it takes 2 minutes, it becomes theirs
- Make it feel earned, not instructional — like being told about a thing worth keeping

**Draft register** (Wendell Shaman voice, not final):
> At each Gate, you'll get a moment to capture it before it goes. Not analysis — what actually happened in your body. Behavior. Affect. What's clearer. Two minutes in the app. Those captures are how you build your deck. By the end of the book, you won't have a collection of insights. You'll have evidence. What it cost. What shifted. What's actually yours now. The deck is the book's grown-up version of itself.

*(Draft only — needs Wendell voice pass against WENDELL_FACE_VOICES.md before use.)*

**App URL/entry point placeholder:** `bars-engine.app` or similar. Do not print a specific URL until the book-reader onboarding flow is stable enough to guarantee the path won't change.

---

## Ch8 — CTA BARs (Different Format)

Ch8 (The Player) does not use the standard 8-gate-walk format. The Player chapter is about composing a practice — authoring the game rather than walking through it. The BAR integration here is different.

**Issue 9 in the tracker covers this spec.** Key design considerations not yet resolved:

- Ch8's 8 oracle cards are complete (`HEXAGRAM_CARDS_CH8_PLAYER.md`) and follow the standard format
- The earn mechanic presumably still applies — reader can earn Ch8 cards
- But the activation context is not a gate walk — it's the composition of a practice
- The BAR prompts in Ch8 probably fire at different structural moments: the chapter's CTA moments, the moment of committing to a practice design, the moment of letting it go
- The 5 "modes" of the Vulnerable Child card (grow / learn / play / explore) suggest Ch8 uses a different prompt architecture — orientation-based rather than gate-based
- The "CTA BARs" framing: BARs that fire when the reader commits to something outward-facing — designing a game, sharing a practice, naming what they're handing forward

**Hold Ch8 BAR integration until Issue 9 spec is written.** The oracle cards are complete and available; the activation mechanic for this chapter needs its own design session.

---

## Integration Sequence — Priority Order

### Phase 1 — Prerequisite Pass (do before embedding any prompts)

**Note on Gates 5/6 numbering (Issue 8 CLOSED):** Issue 8 resolved 2026-05-20 — no manuscript swap needed. The BAR/hexagram gate numbering (EH trigram positions) and the prose gate numbering (reading order) are independent systems. "Gate 5" in BAR_GATE_PROMPT_SPEC.md = Victim (Xun ☴, EH position 5) — in Ch2 prose this content sits at the section labeled "Gate 6: The Victim." "Gate 6" in the spec = Emotional Body (Kan ☵, EH position 6) — in Ch2 prose this sits at "Gate 5: Fear." Placement rule: each prompt goes after the section containing its gate's content, regardless of how that section is numbered in the prose. BAR_GATE_PROMPT_SPEC.md has been updated with placement notes for Gates 5 and 6.

**Phase 1 — Ch1 + Ch2 full revision pass — Image text + appendix routing**
Oracle card formula requires I Ching Image text (Wilhelm/Baynes) as the C2 opening and appendix routing on every card. Ch1 and Ch2 cards were built before this requirement was locked. Both files need a revision pass to add Image text and appendix routing before the earn mechanic can connect cleanly to the card content.
- `HEXAGRAM_CARDS_CH1_FOREST.md` — Image text + appendix routing (8 cards)
- `HEXAGRAM_CARDS_CH2_PILOT.md` — Image text + appendix routing (8 cards)

### Phase 2 — Complete Ch2 Pilot Embedding

Ch2 is the pilot chapter. BAR_GATE_PROMPT_SPEC.md has all 8 gates fully mapped with draft prompts. Complete the Ch2 embedding first, verify the system, then apply the pattern to other chapters.

**Ch2 steps:**
1. Move the existing Gate 8 prompt (currently at line 825 in Ch2, after the post-walk coda) to immediately after Gate 8's closing prose, before the coda
2. Embed prompts for Gates 1–7 per BAR_GATE_PROMPT_SPEC.md draft texts — after each gate's closing line, before `---`
3. Run a voice pass on all 8 prompts against `WENDELL_FACE_VOICES.md` (Shaman register)
4. Review the chapter end — confirm the existing "BARs for the Shaman Level" section at chapter close is removed (replaced by gate-embedded prompts)

**Gate 8 note:** The existing prompt in Ch2 at line 825 is already close to the final version. It just needs repositioning.

### Phase 3 — Map Remaining Chapters (Ch1, Ch3–Ch7)

For each chapter, write the 8 gate prompts using the template from BAR_GATE_PROMPT_SPEC.md:
1. Gate character in this chapter's Face context
2. Ideal reader's default response
3. What to capture (felt-sense instance, not interpretation)
4. Hexagram character (shaping prompt voice, not named in text)
5. Draft 2–4 sentence prompt

**Priority order** (based on most-read → least-read arc, and existing work):
1. Ch1 Forest — 8 prompts (threshold chapter, first encounter with the system)
2. Ch3 Challenger — 8 prompts (high-intensity chapter, ideal reader recognition peak)
3. Ch4 Regent — 8 prompts
4. Ch5 Architect — 8 prompts
5. Ch6 Diplomat — 8 prompts
6. Ch7 Sage — 8 prompts

### Phase 4 — Embed in Manuscript

For each chapter: after all 8 prompts are drafted and voice-passed, embed in the manuscript chapter file at the correct placement points.

**Placement verification for each gate:**
1. Find the gate's closing line (varies by chapter — not always "keep walking")
2. Insert prompt block after closing line, before `---`
3. Confirm the `---` divider remains after the prompt (the prompt does not replace the divider — it sits above it)

### Phase 5 — Ch0 Deck Introduction

Write the Ch0 BAR introduction paragraph in Wendell's register (Shaman/Forest level — he's introducing the system before the reader has entered any Face). Embed in Ch0 at the correct orientation moment.

### Phase 6 — Ch8 CTA BARs

After Issue 9 spec is written. Separate design session.

---

## Gate Prompt Template (per chapter)

Use this template to draft the 8 prompts for any chapter not yet covered by BAR_GATE_PROMPT_SPEC.md.

```
### Gate [N]: [Gate Name] [trigram symbol] × [Chapter Face] [trigram symbol] = Hexagram [number] ([name])

**Chapter context:** What this gate's voice does in the territory of this chapter's Face.

**Ideal reader's default:** What she will do with this gate encounter before the prompt interrupts her.

**What to capture:** The specific felt-sense instance — not the pattern, not the interpretation, not the reframe. The body-level event of this gate landing in this chapter.

**Hexagram character:** [hexagram name] — one sentence on the quality of movement this hexagram describes. Use this character to shape the prompt's voice without naming it.

**Draft prompt:**
> *[2–4 sentences. Direct address. Specific to this gate × chapter. Points to app.]*
```

---

## Open Questions (unresolved before final manuscript edits)

**1. App URL / entry point**
The book needs a stable URL or QR entry point that won't change after printing. Confirm with app team before embedding any app pointer in final manuscript. Use `→ app` as placeholder throughout.

**2. Visual treatment**
How does the BAR prompt appear in the printed book?
- **Option A:** Inline block quote (set off typographically — italic, different font, or indented block)
- **Option B:** Sidebar element (separate column or pull-quote treatment)
- **Option C:** Icon-flagged moment (a deck/card icon marks the prompt position)
  
Option C (icon-flagged) is the most legible in the earn mechanic logic — the icon becomes the visual cue that "this is a card moment." Recommend taking to book designer. Do not finalize placement format until this is decided.

**3. Ch8 CTA BARs design**
The standard 8-gate-walk format does not apply to Ch8. The earn mechanic for the 8 Ch8 oracle cards needs its own activation architecture. See Issue 9.

**4. Reflection Prompts section removal**
BARS_INTEGRATION_SPEC.md specifies that the existing "BARs for the [Face] Level" sections at chapter ends are removed when gate-embedded prompts are in place. Confirm this decision chapter by chapter — some of these sections may contain content worth keeping in a different form (not as BAR prompts, but as reading-for-depth prompts for a second pass).

**5. Ch2 Gate 8 prompt repositioning**
The existing Gate 8 prompt currently sits after the post-walk coda at line ~825 in Ch2. It should sit immediately after Gate 8's closing prose, before the coda. This is a repositioning, not a rewrite — but it changes the reading experience. Confirm before moving.

---

## File Reference

| File | Purpose |
|------|---------|
| `BAR_GATE_PROMPT_SPEC.md` | Writing spec for gate prompts; Ch2 fully mapped; template for other chapters |
| `BARS_INTEGRATION_SPEC.md` | Architecture: 8 per chapter, voice rules, earn mechanic lineage |
| `HEXAGRAM_CARDS_CH[N]_*.md` | Oracle card texts (all 64 complete); earned after BAR capture |
| `BARS_ICHING_ARCHITECTURE.md` | 64-hexagram matrix; gate/chapter trigram assignments |
| `GATE_GIFTS_ALLYSHIP_MOVES.md` | Gate behavioral tasks (source for oracle card content) |
| `WENDELL_FACE_VOICES.md` | Load before voice pass on any prompts |
| `DEVELOPMENTAL_ISSUES_TRACKER.md` | Issue 3 (BAR integration), Issue 9 (Ch8 CTA BARs) — Issue 8 CLOSED |
