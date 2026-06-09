---
type: protocol
title: Chapter Polarity — Integral Design Process
created: 2026-05-25
duration: 60–90 min per chapter
prerequisite:
  - BOOK-OVERARCH-6FACE-ANALYSIS.md (book overarch locked or provisional)
  - ../06 Specs/GOVERNING-POLARITIES-INTERVIEW-PROTOCOL.md
  - ../FSR/Polarity Rules.md
related:
  - BOOK-CHAPTER-GOVERNING-POLARITIES.md
  - CHAPTER_GOALS_AND_MILESTONES.md
  - ../manuscripts/sources/integral-design/
tags: [integral-design, polarity, mtgoa, 6-face, chapters]
---

# Chapter Polarity — Integral Design Process

**Purpose:** Derive **chapter governing polarities** (Ch1–Ch8) through full integral design — **not** inference from milestone copy or chapter goals. Hypothesis pairs from goals doc **withdrawn** after Wendell rejection (2026-05-25).

**One chapter per session.** Do not batch Shaman + Challenger in one hour.

---

## When to use

| Situation | Use this process |
|-----------|------------------|
| Naming Ch2–Ch7 polarity | **Required** |
| Validating Ch1 Forest↔Village | Shorter pass — Wendell named; six-face stress-test |
| Unlocking Ch8 | **Stuck workshop** variant (§8) |
| Book overarch | Separate doc: `BOOK-OVERARCH-6FACE-ANALYSIS.md` |

---

## Process overview

```mermaid
flowchart LR
  A[0. Cast + hexagram] --> B[1. WAVE inventory]
  B --> C[2. Six face cards]
  C --> D[3. Polarity extraction]
  D --> E[4. FSR lint]
  E --> F[5. Milestone alignment]
  F --> G[6. Log + card skews]
```

---

## 0. Open session

### Cast statement (outcome language)

> By the end of **[Chapter / Face]**, the reader can **hold [specific capacity]** without collapsing into **[shadow pole]** — evidenced by **[milestone behavior]**.

*Draft cast from chapter goals only as **starting prompt** — outcome may change in session.*

### Optional ritual

- 321 somatic check ([book editing protocol](https://wendellbritt.zo.space/321))
- Hexagram cast (record number + name in session log)
- Read aloud: *"We're not naming grid axes. We're naming the one tension this chapter teaches."*

### Inputs (facilitator pre-read)

| Input | Path |
|-------|------|
| Chapter goals + milestone | `CHAPTER_GOALS_AND_MILESTONES.md` |
| Chapter SPEC / draft | `manuscripts/chapters/ch[N]-*/SPEC.md` |
| Book overarch (provisional OK) | `BOOK-OVERARCH-6FACE-ANALYSIS.md` |
| GP-A craft pairs | `GOVERNING-POLARITIES-REGISTER.md` |
| FSR rules | `../FSR/Polarity Rules.md` |

---

## 1. WAVE inventory

| Phase | Questions | Capture |
|-------|-----------|---------|
| **Wake** | What's already true in manuscript + reader's lived allyship for this Face? | Bullet list |
| **Assess** | What's charged, rejected, sticky? Include Wendell's "hypothesis wrong" if applicable | Release / keep |
| **Grow** | What becomes possible if we name the right pair? | 2–3 sentences |
| **Show** | What must this session produce? (pair name, poles, milestone link) | Checklist |

---

## 2. Six face cards (required)

For each face, produce a **short card** (template below). Facilitator may pre-draft from manuscript; Wendell **edits or rejects** each card.

### Face card template

```markdown
## [Face emoji] [Face name] — Ch[N] [Face name]

**Research question:** [One question this face asks of this chapter's polarity]

### Shadow
What goes wrong if we name the wrong pair or skip this chapter's tension?

### Recommendation
What should the chapter polarity **do** for the reader?

### Risk
What must we **not** do in copy, cards, or milestones?

### MTGOA anchor
One sentence tying to existing manuscript geography (Forest, village, gates, domains).
```

### Face-specific research questions

| Face | Question |
|------|----------|
| **Regent** | What tradition, capacity, or continuity must this chapter preserve? |
| **Architect** | What structure (milestone, gates, BAR stack) must the polarity load-bear? |
| **Shaman** | What does the reader's **body** feel when this Face's shadow is active? |
| **Challenger** | What failure mode must this chapter **prevent**? |
| **Diplomat** | How does this chapter bridge interior walk and village application? |
| **Sage** | What principle underneath connects this chapter to book overarch? |

### Output location

Save face cards to:

`manuscripts/sources/integral-design/chapter-polarities/ch[N]-[face]/`

Example: `ch2-shaman/regent_card.md`

*(Create folder on first session.)*

---

## 3. Polarity extraction (Wendell-led)

**Only after six face cards.**

**Mandatory output:** 2×2 table per `POLARITY-TEACHING-GRAMMAR.md` — healthy + shadow on **both** poles before logging.

### Core questions

1. What do allies get wrong **in this Face's territory**?
2. Name two **capacities** — both gifts, both have overreach costs (FSR).
3. How does this chapter's pair **serve** book overarch without duplicating it?
4. Which GP-A pair (if any) is **dialect** here, not the chapter pair?
5. Third thing people confuse with a pole?

### Naming rules

- **Behavior, not identity** (FSR Rule 5)
- **~10 min actionable** per pole (FSR Rule 2)
- **No moral language** (FSR Rule 4)
- Prefer **Wendell's words** over facilitator polish
- Chapter-specific labels OK (e.g. **Forest ↔ Village** for Ch1 — not abstracted unless Wendell asks)

---

## 4. FSR validity lint

| Rule | Pass? |
|------|-------|
| Both sides useful | |
| Both actionable ~10 min | |
| Both can fail (overuse) | |
| No moral language | |
| Behavior not identity | |

**Fail → return to step 3.** Do not log to register.

---

## 5. Milestone alignment

Cross-check `CHAPTER_GOALS_AND_MILESTONES.md`:

| Check | Question |
|-------|----------|
| Orienting goal | Does milestone prove **integrated** pair, not one pole? |
| Milestone BAR | Can B/A/R fields be written without lying about the polarity? |
| Gate BARs | Do 8 gates = distortions **of this chapter pair**? |
| Domain pass | Does Show Up domain note attach cleanly (GP-A1 dialect)? |

---

## 6. Log + card skews

Append to `GOVERNING-POLARITIES-REGISTER.md`:

```markdown
### GP-A-Ch[N]: [Pole A] ↔ [Pole B]

| Field | Content |
|-------|---------|
| **Chapter** | Ch[N] — [Face / locale] |
| **− pole** | … |
| **+ pole** | … |
| **Tension** | Wendell one sentence |
| **Book overarch relation** | Facet of … / geographic instantiation / etc. |
| **Shows up in** | … |
| **Card implication** | … |
| **Integral design** | `manuscripts/sources/integral-design/chapter-polarities/ch[N]-*/` |
| **Status** | Validated [date] |
```

Add **2–3 example card skews** (reject if single-pole).

---

## Session schedule (recommended)

| # | Session | Output |
|---|---------|--------|
| 0 | Book overarch somatic lock | GP-BOOK in register |
| 1 | Ch1 Forest — validate Forest↔Village | GP-A-Ch1 + six face cards |
| 2 | Ch2 Shaman | GP-A-Ch2 |
| 3 | Ch3 Challenger | GP-A-Ch3 |
| 4 | Ch4 Regent | GP-A-Ch4 |
| 5 | Ch5 Architect | GP-A-Ch5 |
| 6 | Ch6 Diplomat | GP-A-Ch6 |
| 7 | Ch7 Sage | GP-A-Ch7 |
| 8 | Ch8 Player — **stuck workshop** | Option A–F decision |

**Ch0:** Uses GP-A3 / GP-A4 dialects — separate short pass if needed; not a Face chapter.

---

## 8. Ch8 stuck workshop variant

**Duration:** 45–60 min. **Do not force a pair in first 20 min.**

### Phase 1 — Name the stuckness (Shaman + Challenger)

- What's wrong with Credentials↔Authorship, Walk↔Build, Village↔Road?
- Is the stuckness **"Ch8 isn't a polarity chapter"**?
- Read CH8_REWRITE_SPEC "What If You Don't Have a Game?" aloud

### Phase 2 — Six faces on Ch8 options

Use options table in `BOOK-OVERARCH-6FACE-ANALYSIS.md` § Ch8 workshop.

### Phase 3 — Decision

| Outcome | Log as |
|---------|--------|
| Pair validated | GP-A-Ch8 |
| No pair — stage grammar | `Ch8 integration grammar` in register |
| Dual layer | GP-A-Ch8 (thin) + stage grammar primary |

---

## Anti-patterns (from failed hypothesis pass)

- ❌ Milestone shadow copy → polarity labels
- ❌ "Managed no ↔ Clean no" because Challenger chapter mentions no
- ❌ Same pair structure for Ch8 as Ch2–7 without Wendell yes
- ❌ Skipping six face cards "to save time"
- ❌ Book overarch = Care↔Impact because domains spec exists

---

## Ch1 starting point (Wendell-validated)

**GP-A-Ch1: Forest ↔ Village** — pending six-face stress-test in session 1.

| Pole | Provisional meaning |
|------|---------------------|
| **Forest** | Where you learn — inner walk, gates, parts |
| **Village** | Where you apply — outward allyship, others |

Facilitator runs full process to **confirm or revise** poles and milestone wiring.

---

## References

- Six-face overarch analysis: `BOOK-OVERARCH-6FACE-ANALYSIS.md`
- Chapter architecture: `BOOK-CHAPTER-GOVERNING-POLARITIES.md`
- Face card examples: `../manuscripts/sources/integral-design/appendix/*_card.md`
- Polarity research: `../06 Specs/POLARITY-THINKING-RESEARCH.md`
