# MTGOA Developmental Issues Tracker
**For:** Starting document for every editorial session
**Created:** 2026-05-08
**Status:** Living document — update as issues are resolved or refined
**Session log:** Below each issue, add a dated note when progress is made

---

## How to Use This Document

Open this first. Every session. It tells you what the real problems are, not just what the next task is. Issues are ordered by structural importance — fix the deeper ones first or the surface fixes won't hold.

---

## ISSUE 1 — The Ideal Reader Is Not Caught in Ch0
**Status:** CLOSED — 2026-05-25. Two surgical edits made to Ch0 reader-catch section.
**Priority:** HIGH — affects reader trust from page one

### The Problem
The current Ch0 critiques "allyship as courtroom" — the compliance-based, shame-driven version. The ideal reader graduated from that version years ago. She reads that critique and thinks: *I already know this. What are you going to show me that I haven't heard?*

The book is skirting the current discourse around allyship and DEI without naming it — and the ideal reader's finely tuned B.S. detector will catch the evasion.

### The Ideal Reader
See full profile: `IDEAL_READER_PROFILE.md`

Compressed: Integral Green altitude, Enneagram 2, femme. White or POC from white-dominated culture. West coast. Non-profit worker or therapist. Has been doing the evolved, therapy-fluent version of allyship for years. Still burning out. Suspects the architecture of the game is wrong but hasn't said it out loud.

Her specific traps:
- **The Unwinnable Game (Advanced Level):** She's not playing the courtroom version. She's playing the credential-collecting, ongoing-work version. The rules keep moving. Enough is never enough.
- **Flatland:** Green altitude believes it has escaped hierarchy. Cannot acknowledge developmental stages without triggering hierarchy allergy. Can only ally with Green-coded people while thinking she's doing cross-difference work.
- **The Projection Mechanism:** All her good qualities projected onto marginalized people (idealized). All her shadow qualities projected onto oppressors (demonized). She doesn't date complex human beings — she dates her projection of what marginalized people should be.

### The Editorial Fix
**NOT:** Add a section about DEI rollbacks or engage with conservative critiques.  
**YES:** One surgical paragraph in Ch0 that names the *advanced* version of the unwinnable game. Her version. Precise enough to make her feel caught — not shamed, but recognized.

The sentence the book currently doesn't have:  
*You are not here because you haven't tried. You are here because trying harder has stopped working, and some part of you has started to wonder whether the game itself is the problem.*

The Six Faces framing is already correct — "faces" not "levels" sidesteps her hierarchy allergy. The architecture doesn't need to change. The entry point needs to be more precise.

### Why the Six Faces Are the Right Structure for Her
Each Face is a gift she has been projecting outward or demonizing in others:
- Shaman: felt-sense wisdom she projects onto marginalized people as innate
- Challenger: clean "no" she calls oppressor energy — her most avoided face
- Regent: stewardship she reads as conservatism
- Architect: systems thinking she reads as capitalism
- Diplomat: her home altitude — but only holding Green-coded fields
- Sage: altitude awareness she can't access without acknowledging altitude exists

The book is a reclamation project. The faces framing lets her receive it.

### Session Notes
- 2026-05-08: Full diagnosis completed. `IDEAL_READER_PROFILE.md` created. No manuscript edits yet.
- 2026-05-25: **CLOSED.** Two edits to Ch0 reader-catch section: (1) "whether leaving was ever actually an option" → "whether the game itself is the problem" — sharpens from exit to structural critique, aligns with book's thesis; (2) new paragraph inserted before "The game you moved into": "The people you've been most loyal to in this work already knew the vocabulary..." — names intra-Green coalition trap obliquely without Integral vocab. Score moved from 5.5/7 to 7/7.
- 2026-06-03: Ch0 now explicitly tells the reader to bring their own concrete allyship scenario (anti-racism / applied feminism / emergent week-specific issue) and frames the book's job as staying in the game until the transformation happens, not replacing their expertise.

---

## ISSUE 2 — Voice: Wendell Is Not In Love With the Book
**Status:** Voice infrastructure built. Umbrella issue for voice/comedy/punch-up passes; no manuscript edits made yet.
**Priority:** HIGH — the voice affects every page

### The Problem
The manuscript is structurally complete but the prose doesn't delight the author. Two sub-problems:

**2a. The book has one reader profile but needs to hold two polarities.** The femme Green reader needs permission, recognition, and the flatland disruption. The masculine Teal reader (Wendell himself) needs to be surprised, intellectually caught, and met as an equal. Teaching mode serves neither fully.

**2b. Prose drifts into teaching mode.** When writing at book length, the voice shifts: more explanatory, more guiding, more concerned with being understood. The tweets are alive. The manuscript often isn't.

### The Voice Wendell Wants
Influence profile: Douglas Adams, Terry Pratchett, Brad Neely (Wizard People), Jung (Red Book specifically), Walt Whitman, Ken Wilber.

What they share: cosmic scope held without solemnity. The joke that IS the truth. Full commitment to the register. Vulnerability inside the system. Direct address without apology.

See: `VOICE_MATRIX_BY_FACE.md` for how each influence does each Face's work.

### What's Currently Missing
From the tweet corpus analysis (`WENDELL_VOICE_PROFILE.md`):
- **Jung + Whitman are almost entirely absent** — the descent into the personal that becomes universal; first-person story reported from inside the experience, not from after
- **Personal stories are absent** because they're painful — but this is the book enacting its own shadow. The places that are hard to say are the places the book needs most
- **Teaching mode compresses insight into explanation** — "Cynicism is grief with a better vocabulary" becomes a paragraph unpacking what that means

### The Masculine Teal Shadow (Why the Voice Is Guarded)
The masculine Teal shadow is the higher-level version of every lower shadow. For Wendell: using the role of "author who teaches systems" to avoid the role of "person whose specific pain is visible." The absence of personal risk in the prose demonstrates the pattern the book needs to break.

### Voice Infrastructure Built
- `WENDELL_VOICE_PROFILE.md` — the moves extracted from actual writing (tweets + BARs)
- `WENDELL_VOICE_AGENT_GUIDE.md` — operational HOW/WHEN/WHERE/WHY for AI agents editing the manuscript
- `VOICE_MATRIX_BY_FACE.md` — all five influences by Face
- Individual `VOICE_ANALYSIS_*.md` for each influence

### Next Step
Need 2-3 manuscript passages from Wendell that he IS in love with — to build the voice profile from what's already working rather than imposing it from outside.

### Session Notes
- 2026-05-08: Voice infrastructure complete. Tweet corpus and BAR registry analyzed. No manuscript edits yet.
- 2026-05-18: **Ch2 voice pass complete** (S3-4). Removed teaching-mode setup sentences, all prose bold (was signaling importance), redundant "Real emotional alchemy is different.", announcement phrases ("Notice the difference.", "Notice what's happening in each case:", "Here's how it works at the deepest level:"). Removed Architect-register bold from mechanics numbered list. Personal story section (customer service) preserved exactly. Backup: `DRAFT_CHAPTER2_SHAMAN_2026-05-18.md`.
- 2026-06-04: Voice/comedy cluster merged under this umbrella. Issue 15 (Ch6 Integrative Negotiator voice pass) and Issue 21 (Council of Joanne's punch-up engine) now track as sub-passes of the same voice/comedy workstream.

---

## ISSUE 3 — BARs Are Not Integrated Into the Reading Experience
**Status:** CLOSED — 2026-06-03. BAR intro, app handoff, and gate prompts are integrated across Ch0–Ch8.
**Priority:** HIGH — affects the book-to-app conversion that is the product's flywheel

### The Problem
Igniting Joy (Book 1) used a physical blank-card BARs deck: readers wrote a BAR card after each challenge, building a personalized deck of transformation moments by the end. The BARs were the "gold" of the alchemy — the captured evidence of change.

MTGOA (Book 2) has:
- A bars-engine APP that can capture BARs digitally
- No prompts in the manuscript telling readers to capture BARs
- Reflection Prompts at the end of each chapter, but these don't connect to the app
- No moments explicitly designated as BAR capture opportunities

Without prompts from the book, readers won't open the app during the reading journey. The book and the app will remain separate experiences instead of being one integrated practice.

### What BARs Are in the bars-engine Context
From the app schema and Igniting Joy model: A BAR is a captured moment of significant experience — a charge, an emotional recognition, a behavioral observation. In Igniting Joy: "every time you transform anger into joy, you'll capture that moment of transformation on a BAR card."

In MTGOA terms, a BAR would be:
- A Gate encounter that landed (the Gate that was yours)
- A moment of recognition during a Face chapter ("that's the game I've been playing")
- The output of a "Try It Now" practice
- A moment where a real situation came to mind during reading

### The Grown-Up Version
Igniting Joy: physical card → handwritten note
MTGOA: specific prompt in the text → bars-engine app → saved to player profile → available for campaigns

The app can:
- Save the BAR to the reader's profile
- Tag it by Face/Gate/chapter
- Suggest quests based on what was captured
- Serve as starting material when the reader joins a campaign

### What the Book Needs
**BAR Moments** embedded at specific structural points in each chapter — not as an appendix or sidebar, but as a natural part of the reading rhythm, in Wendell's voice.

**Where they belong (per chapter):**
- After the 8 Gates walk — "One of those gates just cost you something. Name it."
- After the "Try It Now" practice — "What happened? Capture it before it fades."  
- After the Exile/Distortion section where a reader might recognize themselves — "You just recognized something. That recognition is a BAR."
- At the end of each chapter — consolidated prompt to app

**The prompt format (in Wendell voice, not teaching mode):**
Not: "Take a moment to reflect on your experience using the BAR format (Behavior-Affect-Reflection)..."
Yes: Something like: *You just walked through something. Before the insight fades — what happened, what you felt, what's now clearer. Open the app. Two minutes. It becomes yours.*

**How many per chapter:** 2-3 explicit BAR moments + 1 chapter-end prompt directing to app

### Connection to Issue 1
The BAR capture moments are also where the ideal reader is most likely to face her specific shadow. A Gate encounter that showed her the Challenger's clean "no" — that's where she'll resist. The BAR prompt at that moment should be precise enough to name what just happened.

### Session Notes
- 2026-05-08: Issue diagnosed. Igniting Joy BAR system reviewed. No manuscript or app changes yet.
- 2026-05-19: **Architecture confirmed.** A BAR is a hexagram — Gate trigram (lower) × Chapter trigram (upper) = 1 of 64. Full matrix built. Gates 1–8 map to Earlier Heaven trigrams; Chapters 1–8 map to Later Heaven trigrams. Architecture file: `BARS_ICHING_ARCHITECTURE.md`. App spec for I Ching → BAR: `feat-iching-prompt-deck/SPEC.md`. Bars-engine backlog entry: **ICA** (I Ching ↔ Allyship Book Integration). **New structural finding:** Gates 5/6 need to swap order in all chapters — see Issue 8.
- 2026-05-19: **BAR prompt count corrected.** 8 BAR prompts per chapter (Ch1–Ch7), one per Gate, embedded after each Gate section in the Gates walk. End-of-chapter Reflection Prompts section removed entirely — the 8 gate prompts ARE the BARs. `BARS_INTEGRATION_SPEC.md` updated. Ch2 currently has 1 of 8 prompts (after Gate 8, line 825). Pilot: write all 8 for Ch2, then apply pattern to Ch1, Ch3–Ch7.
- 2026-05-19: **Full architecture session.** BAR = hexagram card. Reader knows they're activating a hexagram. 64 cards = choose-your-own-adventure re-engagement deck after reading. Each card must be self-contained enough for a standalone allyship practice. Hexagram card formula: Chapter Goal × Gate WAVE Stage (most alive) × Internal/External × Hexagram I Ching Wisdom = Question + Action. **WAVE/Gate pairing confirmed** (Wendell): Wake Up = Skeptic+Victim, Clean Up = Emotional Body+Controller, Grow Up = Fixer+Vulnerable Child, Show Up = Protector+Damaged Self. Chapter goals locked in `CHAPTER_GOALS_AND_MILESTONES.md` with capacity milestones + milestone BAR templates. Gate developmental arcs (Lower→Wake→Clean→Grow→Show) captured for all 8 gates in `GATE_DEVELOPMENTAL_STAGES_RD.md` and merged into `GATE_VOICES_CANONICAL.md`.
- 2026-05-20: **Oracle card system complete.** Key reframe: cards are an ALLYSHIP DIVINATION DECK (not I Ching translation). Draw mechanic: Option C — starts as personal earned deck (BARs captured during reading), expands to full 64. Card purpose: post-book oracle → routes reader to `/shadow/321` (3-2-1 practice) in the app. Card format: oracle text (shadow running / gift × chapter intersection / invitation) + 3 tasks with containers + 3-2-1 handoff. Gate gifts spec built via interview (all 8 gates): `GATE_GIFTS_ALLYSHIP_MOVES.md`. Oracle text formula spec: `HEXAGRAM_CARD_ORACLE_FORMULA.md`. **Ch2 pilot cards written and confirmed** (all 8 Shaman cards): `HEXAGRAM_CARDS_CH2_PILOT.md`. 6 GM analysis vs. V3 ally deck completed — container discipline added from V3 lesson. **Key correction:** Emotional Body has ALL 5 channels at ALL levels — do not assign home channels to Faces.
- 2026-05-22: **Cards Ch3–Ch6 complete.** Oracle formula updated: I Ching Image text (Wilhelm/Baynes) added as required C2 source; TYPE A/B/C component order locked (A=Difficulty: Shadow→Image+Gift→Move; B=Movement: Image→Gift→Shadow; C=Threshold: Image→Shadow→Gift); appendix routing line added to every card. Ch1 Card 7 revised. 6 priority Ch3 cards revised. New files: `HEXAGRAM_CARDS_CH3_CHALLENGER.md` (Zhen ☳ Thunder, double-trigram Hex 51 Skeptic), `HEXAGRAM_CARDS_CH4_REGENT.md` (Xun ☴ Wind, double-trigram Hex 57 Victim), `HEXAGRAM_CARDS_CH5_ARCHITECT.md` (Qian ☰ Heaven, double-trigram Hex 1 Protector), `HEXAGRAM_CARDS_CH6_DIPLOMAT.md` (Dui ☱ Lake, double-trigram Hex 58 Controller). Ch1+Ch2 full revision pass (Image text + appendix routing) deferred to after Ch7–Ch8 are drafted. **Remaining: Ch7 Sage (Gen ☶ Mountain) + Ch8 Player (Li ☲ Fire) = 16 cards.**

### Next Steps (in order)
1. ~~**Resolve 4 open questions**~~ **DONE 2026-05-21** — decisions locked in `HEXAGRAM_CARDS_CH2_PILOT.md` and `HEXAGRAM_CARD_ORACLE_FORMULA.md`: no difficulty levels; "Solo / With:" modifier on Controller + Victim cards only; two-tier hexagram name rule (replace misleading, keep evocative, parenthetical for opaque); visual spec physical-first, oracle text 50 words max, tasks 30 words each, total ~150 words.
2. **Apply formula to Ch1, Ch3–Ch8** — **ALL CHAPTERS COMPLETE.** Ch1 DONE (2026-05-21): `HEXAGRAM_CARDS_CH1_FOREST.md`. Ch3 DONE (2026-05-22): `HEXAGRAM_CARDS_CH3_CHALLENGER.md`. Ch4 DONE (2026-05-22): `HEXAGRAM_CARDS_CH4_REGENT.md`. Ch5 DONE (2026-05-22): `HEXAGRAM_CARDS_CH5_ARCHITECT.md`. Ch6 DONE (2026-05-22): `HEXAGRAM_CARDS_CH6_DIPLOMAT.md`. Ch7 DONE (2026-05-22): `HEXAGRAM_CARDS_CH7_SAGE.md` (Gen ☶ Mountain, double-trigram Hex 52 Keeping Still; matrix discrepancy Card 2 flagged). Ch8 DONE (2026-05-22): `HEXAGRAM_CARDS_CH8_PLAYER.md` (Li ☲ Fire, double-trigram Hex 30 Clinging/Fire = Skeptic × Player). **All 64 oracle cards drafted.** Next: Wendell review pass on Ch3–Ch8 batches; Ch1+Ch2 full revision pass (Image text + appendix routing); appendix content.
3. ~~**Embed BAR prompts in Ch2 manuscript**~~ **DONE 2026-05-22** — 8 gate prompts embedded (Gates 1–7 after "When you're ready, keep walking." + Gate 8 after closing prose before coda). Gate 8 old generic prompt removed from coda. Reflection Prompts section removed. Backup: `DRAFT_CHAPTER2_SHAMAN_2026-05-22_pre-BAR-embedding.md`. Next: voice pass on all 8 prompts against WENDELL_FACE_VOICES.md (Shaman register).
4. ~~**Apply manuscript prompts to Ch1, Ch3–Ch7**~~ **DONE 2026-05-22** — 8 gate BAR prompts embedded in all 6 chapters via parallel subagents. Backups created for each. Reflection Prompts sections removed from Ch1 (Section 9), Ch3, Ch4. Structural notes: Ch1 gate headers use "### Gate N Deep Dive:" format; Ch5 had no `---` dividers between gates (added by agent); Ch6 uses non-standard gate names (Already Alone = Emotional Body, Hollowed Self = Damaged Self); Ch7 uses "**The N Gate: Name**" bold headers in Section 5. All Gate 5/6 routing correct across all chapters. **Voice pass DONE 2026-05-28** — 16 targeted revisions across Ch2 (Gates 2,4,6,7), Ch3 (Gates 1,3,7,8), Ch4 (Gates 2,5,7), Ch5 (Gates 1,5,6,7,8). Ch6 + Ch7 already at register (kept). Ch1 single prompt kept. Scoring: Ch6 strongest (all Diplomat-specific), Ch7 strong (I Ching imagery + "What surprised the map?"), Ch5 needed most work (mechanism language added). Backups: `*_backup_2026-05-28_pre-BAR-voice-pass.md` for Ch2–Ch5.
5. **Ch0 BAR introduction** — write intro to BARs + hexagram deck as technology in Wendell's voice.
6. **Ch8 CTA BARs** — spec and write (see Issue 9).

### Key Files (Issue 3)
- `GATE_GIFTS_ALLYSHIP_MOVES.md` — all 8 gate gifts as behavioral tasks (source for all 64 cards)
- `HEXAGRAM_CARD_ORACLE_FORMULA.md` — 3-component oracle text formula
- `HEXAGRAM_CARDS_CH2_PILOT.md` — Ch2 pilot cards, canonical
- `BARS_ICHING_ARCHITECTURE.md` — 64-hexagram matrix, gate/chapter trigram mappings
- `CHAPTER_GOALS_AND_MILESTONES.md` — chapter goals (oracle text context)

---

## ISSUE 4 — Word Count Gaps (Updated After Audit)
**Status:** Re-audited 2026-05-11. Tracker was pointing to pre-expansion files for Ch6, Ch7, Ch8. Actual gaps are smaller than originally diagnosed.
**Priority:** MEDIUM — voice work comes first; expand with the right voice

### Canonical Files and Actual Word Counts (as of 2026-05-11)

| Chapter | Canonical File | Words | Target | Status |
|---------|---------------|-------|--------|--------|
| Ch0 | `ch0-infinite-arcade/CHAPTER0_DRAFT.md` | 4,624 | ~4,000 | ✓ at target |
| Ch1 | `ch1-SHAMAN/CHAPTER1_FULL_DRAFT.md` | 4,818 | ~8,000 | ✗ -3,182 **gap** |
| Ch2 | `ch2-SHAMAN/CHAPTER2_SHAMAN_FULL_DRAFT.md` | 10,993 | ~8,000 | ✓ above target |
| Ch3 | `ch3-CHALLENGER/CHAPTER3_CHALLENGER_FULL_DRAFT.md` | 8,324 | ~8,000 | ✓ at target |
| Ch4 | `ch4-REGENT/CHAPTER4_REGENT_FULL_DRAFT.md` | 6,609 | ~8,000 | ✗ -1,391 **gap** |
| Ch5 | `ch5-ARCHITECT/CHAPTER5_ARCHITECT_FULL_DRAFT.md` | 7,148 | ~8,000 | ✗ -852 **gap** |
| Ch6 | `ch6-diplomat/CHAPTER6_DIPLOMAT_FULL_DRAFT_MASTER.md` | 9,497 | ~8,000 | ✓ at target |
| Ch7 | `ch7-sage/CHAPTER7_SAGE_FULL_DRAFT.md` | 13,436 | ~8,000 | ✓ above target |
| Ch8 | `ch8-player/CHAPTER8_PLAYER_FULL_DRAFT.md` | 8,320 | ~8,000 | ✓ at target |

### Non-Canonical Files to Ignore
- `ch7-sage/CHAPTER7_SAGE_DRAFT_PREEXPANSION.md` (5,000 words) — this is what the tracker was previously pointing to; superseded by FULL_DRAFT
- `ch8-player/DRAFT_CH8_V4_2026-04-21.md` — identical content to CHAPTER8_PLAYER_FULL_DRAFT.md
- `ch5-ARCHITECT/DRAFT_CH5_S4_REPLACED_2026-04-21.md` — discarded draft section
- `ch5-ARCHITECT/DRAFT_CH5_S4+S5_REWRITTEN_2026-04-21.md` — discarded draft section

### Actual Gaps

**Ch1 (-3,182 words):** Foundation chapter. Missing: Wendell's personal confessional story in the Shaman register, somatic exercise ("Try It Now"), ideal reader catch paragraph. The word count gap is structural, not padding — these specific things are absent.

**Ch4 (-1,391 words):** Regent chapter. Missing: concrete scenario showing the Face in action, ideal reader catch paragraph (she reads stewardship as conservatism — needs a paragraph that names that specifically).

**Ch5:** Architect chapter. Ideal reader catch complete 2026-06-03. Added paragraph in the Ch5 concept bridge that names the systems-thinking-as-capitalism flinch and reframes structural design as keeping people human inside the machine.

### Session Notes
- 2026-05-08: Identified in structural review. Deferred pending voice and reader profile work.
- 2026-05-11: Full file audit completed. Tracker was pointing to pre-expansion pre-April files for Ch6/Ch7/Ch8. Canonical files identified. Ch6, Ch7, Ch8 are at or above target. Real gaps are Ch1, Ch4, Ch5.
- 2026-05-12: Ch1 editorial pass completed. Added confession (George Floyd origin story), ideal reader catch, Try It Now somatic exercise, BAR prompt in voice, 4 parentheticals. Word count 4,818 → 5,474. Gap reduced to ~2,526. Remaining work: somatic register in Sections 1-3 (currently analytical — needs body-first rewrite, not expansion). Backup: `DRAFT_CHAPTER1_SHAMAN_2026-05-12.md`.
- 2026-05-13: Gates 6-8 deep dives fully rewritten with canonical interview material. Gate 6: Drama Triangle/Allyship Triangle introduced (Victim→Hero, Villain→Challenger, Rescuer→Ally), two ally failure modes named. Gate 7: "did you die though" resilience frame, ally failure of projecting fragility onto the undefeated. Gate 8: Vulnerable Child as destination state — all 8 gates repurpose correctly when it leads; curiosity vs. obligation framing. Section 7 walkthrough corrected (Performer→Fixer/Healer, Judge→Emotional Body). Word count: 7,809 / target 8,000. Ch1 structurally complete. Remaining: somatic register fix in Sections 1-3 (not a word count issue).
- 2026-05-18: **Ch5 reader catch complete** (after S2, before S3). Structural pass (Epiphany Bridge adapted) + voice pass both done. Removed setup/announcement sentences, condensed double "Architect who" construction, fixed teaching-mode "you'll realize" → direct statement. `EPIPHANY_BRIDGE_ADAPTED.md` created as standalone spec. Backup: `DRAFT_CHAPTER5_ARCHITECT_2026-05-18.md`.
- 2026-05-14: **Ch3 gap closed.** Confession (drew the line in a Black space, wore out the person inside the story, witnessed the fire-without-practice implosion), reader catch (shadow Challenger vs. real Challenger; you've been refusing to trust what you know), 4 parentheticals, Section 3 Challenger register pass. Word count 8,324 → ~8,917. **Ch4 gap closed.** Confession (crown-under-hood; tried to hold governance in allergy-to-structure spaces; collective dissolved across three crises; helps pick up pieces but can't offer the floor before the crisis), reader catch (tradition-as-cage → what-did-you-build-instead), S3 opener fixed. Word count ~6,609 + ~1,000 words added. **Ch7 gap closed (reader catch).** Disruption catch inserted after S1: two-readings structure (exiled Sage vs. shadow Sage using exile as story), ALTITUDE metaphor family introduced. WAVE CLEAN done 2026-05-18 (see Issue 2 notes). GROW (confession) complete 2026-05-18 — confession drafted via full interview (Epiphany Bridge adapted, 6 Game Master analysis applied, voice pass notes incorporated); inserted before S1 as "A Note Before the Exile"; flag later cleared on 2026-06-03. SHOW (register pass) complete 2026-05-18 — removed 4× "And the alchemy is here:" announcement phrases (S4 Transcend moves), unbolded 5× "The Control pattern:" labels (S4), removed S3 setup opener, flattened S2 "Here's the thing" and S5 "Here's what Wilber/Laloux" citation frames. Confession voice pass completed 2026-06-03. Backup: `DRAFT_CHAPTER7_SAGE_2026-05-18b.md`. **Ch5 still open** (-852 words, reader catch missing).
- 2026-06-03: **Ch5 reader catch completed.** Added ideal-reader bridge in the Concept note that acknowledges the systems-language/capitalism flinch and reframes structural design as keeping people human inside the machine. Issue 4 Ch5 gap resolved.

---

## ISSUE 5 — Eight Gates Structure Is Repetitive by Ch7
**Status:** Diagnosed. No design solution yet.
**Priority:** MEDIUM

### The Problem
The 8 Gates walk appears with identical structure in Ch2-7 (six chapters). By Ch7, the reader has seen the Gate 1 → Gate 2 → ... → Gate 8 pattern six times. The structure that creates intimacy in Ch2 has become predictable in Ch7, which dulls the impact at precisely the chapter where the deepest Gate work happens.

### Design Options (not yet chosen)
- Vary the order in later chapters
- Let some chapters focus on 3-4 Gates deeply instead of all 8
- Change the narrative frame (not "a walk" but something else for Sage/Player)
- Add a meta-commentary in the Sage chapter that names the repetition and uses it intentionally

### Variation Rule
The gate questions should vary by chapter's developmental altitude and by the role the gate is playing in that chapter. The repeated outer structure stays, but the inquiry changes from chapter to chapter.

The key distinction: **Protector** is about what is being protected from loss, not simply fear itself. **Controller** is about the standards, conditions, or constraints being enforced. In other words: Protector asks what feeling, push, responsibility, role, or identity is being protected from; Controller asks what standards are being upheld or administrated through the grip.

Initial chapter-specific anchor examples:
- **Ch2 Protector:** what feeling is being protected from surfacing? what push is being protected from making?
- **Ch3 Protector:** where is resistance strongest? what fear is protecting the push from becoming too much?
- **Ch4 Protector:** what responsibility or role are you protecting yourself from? how are you protecting others by not taking responsibility?
- **Ch5 Controller:** what standards are you protecting using the systems you interact with? how do you systemically administrate and engineer your values?
- **Ontology update:** the Skeptic asks what is being perceived and how that perception is doubted; the Fixer may also read as Healer in feminine register; the Fear gate is really the Emotional Body gate asking how emotion is used to perceive reality; Victim grows to Advocate and then Storyteller; Damaged Self is the last line of defense deciding what is still survivable.

**Working spec:** `Spec Inbox/SPEC_GATE_VARIATION_MATRIX_2026-06-04.md`
**Spot-edit sheet:** per-chapter one-liners added for Ch2–Ch8 so the next pass can audit gate wording before manuscript edits.

### Session Notes
- 2026-05-08: Identified in structural review. No design decision yet.

---

## ISSUE 6 — Ch8 Doesn't Integrate the Six Faces
**Status:** CLOSED — 2026-06-03. Ch8 now integrates the six Faces through Player modes and closing recap.
**Priority:** MEDIUM

### The Problem
Ch8 introduces five self-authorship modes (Cartographer, Designer, Founder, Elder, Outlaw) as if they're new concepts, rather than showing how the six Faces blend into self-authorship. The reader who has walked all six Faces doesn't see how those capacities combine in the Player. The bridge is missing.

### The Fix
Add a section showing how the modes use the Faces:
- Cartographer: Shaman's felt-sense + Sage's panoramic view
- Designer: Challenger's clarity + Architect's systems thinking
- Founder: Regent's stewardship + Architect's build logic
- Elder: Diplomat's field-holding + Regent's "pass it on" stewardship
- Outlaw: Challenger's clean "no" + Sage's refusal to play the expected game

### Session Notes
- 2026-05-08: Identified in structural review. No edits yet.
- 2026-06-03: Closed after verification against `CHAPTER8_PLAYER.md` / `CHAPTER8_PLAYER_FULL_DRAFT.md`:
  - Player states "had been through all six Faces"
  - Cartographer / Designer / Founder / Elder / Outlaw modes are explicitly defined
  - Closing recap returns to the six Faces as toolkit, not destination

---

## ISSUE 8 — Gates 5/6 Order
**Status:** CLOSED — by design (2026-05-20). No manuscript edits needed.

The current manuscript order (Emotional Body at prose position 5, Victim at prose position 6) is correct. It matches traditional Big Mind sequence and serves readability. The Earlier Heaven trigram positions (Victim = Xun = EH position 5; Emotional Body = Kan = EH position 6) apply to the BAR/hexagram system by voice-name identity, not by prose gate number. The two numbering systems are independent. See `BARS_ICHING_ARCHITECTURE.md` for the full clarification.

---

## ISSUE 9 — Ch8 CTA BARs Need Their Own Spec
**Status:** CLOSED — 2026-05-28. 8 gate BARs written to Ch8 Section 5 end.
**Priority:** MEDIUM — Ch8 is structurally complete; BAR integration is the remaining piece

### Resolution
8 gate-scan BARs written to Ch8, placed at end of Section 5 after "You are ready to be useful." and before Section 6 "The Game." Introduced by a framing line: *"Before you step into the game: a gate scan. Eight gates, eight questions. One of them is live in you right now…"*

Architecture: Ch8 upper trigram = Li ☲ Fire. 8 hexagrams:
- Gate 1 (Protector) × Li = Hex 14 Great Possession
- Gate 2 (Controller) × Li = Hex 38 Opposition
- Gate 3 (Skeptic) × Li = Hex 30 Clinging/Fire (double-trigram)
- Gate 4 (Fixer) × Li = Hex 21 Biting Through
- Gate 5 (Victim) × Li = Hex 50 The Cauldron
- Gate 6 (Emotional Body) × Li = Hex 64 Before Completion
- Gate 7 (Damaged Self) × Li = Hex 56 The Wanderer
- Gate 8 (Vulnerable Child) × Li = Hex 35 Progress

Register: Player voice (all Faces integrated). Each prompt captures which gate showed up in active building work. App handles mode identification (Cartographer/Designer/Founder/Elder/Outlaw) separately; gate × mode = routing to specific next action.

**Total BARs after this write:** 64 hexagram BARs across Ch1–Ch8. Architecture complete.

Backup: `CHAPTER8_PLAYER_FULL_DRAFT_backup_2026-05-28_pre-BAR-prompts.md`

### Session Notes
- 2026-05-19: Issue identified. No spec yet.
- 2026-05-28: **CLOSED.** 8 prompts specced, approved, written to file.

### Reference
`CHAPTER_GOALS_AND_MILESTONES.md` — Ch8 design decisions section

---

## ISSUE 15 — Four Domains Need Full Depth Pass
**Status:** CLOSED — 2026-06-03. Appendix A reviewed and accepted for integration.
**Priority:** MEDIUM — Appendix A is live in manuscript and now matches the reviewed depth pass.

### The Problem
The four allyship domains (Gather Resources, Skillful Organizing, Direct Action, Raise Awareness) are foundational to the book's architecture — every chapter quest routes to a domain, every BAR is tagged by domain, the hexagram card pre-draw diagnostic uses domains. But the current Appendix A gives each domain only a paragraph: definition, failure mode, EA channel, primary gates. That's not enough.

The domains need the same rigor the book applies to the gates: WAVE arc per domain, shadow at each WAVE stage, what healthy activation looks like vs. managed/performed, somatic signature, worked examples from allyship practice.

### What's Needed
For each of the four domains, a full developmental portrait:
- **WAVE arc inside the domain:** What does Lower, Wake, Clean, Grow, Show look like in Gather Resources practice? In Direct Action? Etc.
- **Shadow at each stage:** What does performative Gather Resources look like at Lower vs. Wake? What does martyrdom look like at Lower vs. Clean?
- **Somatic signature:** How does each domain feel in the body when it's running clean vs. running shadow?
- **Worked examples:** Real allyship situations where each domain shows up — what the shadow version looks like, what the gift version looks like
- **EA channel mapping with depth:** Not just "Anger lives in Direct Action" but how the anger channel functions specifically inside Direct Action work
- **Gate interactions:** When Skeptic serves Raise Awareness vs. when Skeptic sabotages it

### Scope Question (open)
Does this depth live in Appendix A (expanding it from ~800 to ~2,400 words) or does each domain get its own appendix section? The current structure is A = Domains, B = Quests/Campaigns. If domains expand significantly, they may need to break A into A1-A4.

### Session Notes
- 2026-05-28: Issue identified. Appendix A prose draft written. `<!-- EXPANSION NEEDED -->` comment placed at bottom of file. Wendell flagged: "We will need to have as much rigor about the 4 domains as we have for the book itself."
- 2026-05-29: **Depth pass complete.** Structure confirmed via interview: territory portrait (who/where/when) + collapse patterns (domain mismatch) + 6 Faces × 3-beat arc (pattern / shadow / gift per Face). EA channel-domain mapping removed per Wendell correction — conflation. Gate affinity table kept with "why" column added. Backup: `APPENDIX_A_FOUR_ALLYSHIP_DOMAINS_backup_2026-05-29_pre-depth-pass.md`. Word count: ~2,800w (up from ~800w). Needs Wendell review pass before promotion. Issue 15 STATUS → PENDING REVIEW.
- 2026-06-03: Review pass complete. Appendix A matches the four-domain architecture, the pre-draw diagnostic, the bridge to bars-engine, and the chapter-routing role. Marked ready for integration.

### Reference
- `manuscripts/appendices/APPENDIX_A_FOUR_ALLYSHIP_DOMAINS.md` — current draft
- `docs/plans/2026-05-21-allyship-domains-design.md` — original integral design spec (gates × domains research)
- `07 Book OS/GATE_DEVELOPMENTAL_STAGES_RD.md` — model for the depth pass (gate WAVE arcs are the template)

---

## ISSUE 7 — EA Channel Tables Missing in Ch3, Ch4, Ch6
**Status:** CLOSED — 2026-05-20

EA channel alignment tables added to Ch3 (Challenger), Ch4 (Regent), Ch6 (Diplomat). All 5 modes per chapter now mapped to their primary EA signal with Dissatisfaction → Satisfaction Transcend descriptions. Format follows the Ch2/Ch7 template. Book-wide EA consistency achieved.

**Ch3:** Line (Fire/Anger), Interrupt (Metal/Fear), Demand (Fire→Wood), Refusal (Fire/Anger), Reckoning (Water/Sadness)
**Ch4:** Custodian (Earth/Neutrality), Inheritor (Water/Sadness), Teacher (Wood/Joy), Reformer (Fire/Anger), Keeper of Vows (Earth/Neutrality)
**Ch6:** Bridge-Builder (Metal/Fear), Translator (Earth/Neutrality), Field-Holder (Wood/Joy), Repairer (Water/Sadness), Integrative Negotiator (Fire/Anger) — *renamed from Price-Namer 2026-05-24; see `manuscripts/chapters/ch6-diplomat/CHANNEL5_RENAME_MAP.md`*

---

## Gate Voices Canonical Reference (2026-05-12)

**`GATE_VOICES_CANONICAL.md`** — **Load before editing any gate section** — canonical breakdown of how each voice operates specifically in allyship contexts. Built from Wendell interview 2026-05-12. All 8 gates complete.

Key findings:
- Gate 1 (Protector): three directions of protection; self-policing as the most common shadow; canceller archetype
- Gate 2 (Controller): Protector's implementation; conflates discourse-control with safety; kills allyship by managing it to death
- Gate 3 (Skeptic): mushroom problem origin; casts abjuration spell primarily at the self; hero-seeking as the escape from self-doubt
- Gate 4 (Fixer/Healer): two definitions of "fix"; category error (you can only fix objects); aim at circumstances not persons
- Gate 5 (Emotional Body): five channels (Fear/Grief/Anger/Shame/Joy); locate signal before acting
- Gate 6 (Victim): Drama Triangle; Allyship Triangle repurpose (Victim→Hero, Rescuer→Ally)
- Gate 7 (Damaged Self): "did you die though" resilience frame; allies miss resilience and respond to fragility that isn't there
- Gate 8 (Vulnerable Child): destination state; every other gate repurposes correctly when VC leads

Intellectual lineage: Big Mind Process (gate architecture) + Existential Kink (shadow-as-information approach). Both attributed in SOURCE_INTEGRATION_SPEC.md.

---

## ISSUE 10 — Spec Pipeline: Somatic Poetics + Council of Joanne's + Comedic Calibration
**Status:** SPECS COMPLETE — umbrella issue for somatic poetics / shame / emotional-register calibration; awaiting Wendell Session 1 (2026-05-20)
**Priority:** 🔴 BLOCKING — no comedy or somatic work can fire until Session 1

Three interconnected specs built 2026-05-20 as the editorial infrastructure for voice, comedy, and antagonist presence in the manuscript:

**`Spec Inbox/SPEC_SOMATIC_POETICS.md`** — 2-session architecture. Session 1 (Wendell's): 5-channel body-state map + 2 van-tweet moments in Wendell's voice. Session 2 (agent-facilitated): prose calibration. Closes the voice gap flagged since April.

**Style note:** this is now being treated as somatic poetics rather than prescriptive body instruction. The material should evoke body awareness through image, rhythm, and felt language, not tell the reader what they are supposed to feel.

**Session 1 prompt pack:** `Spec Inbox/SOMATIC_POETICS_SESSION_1_PROMPT_PACK_2026-06-04.md`

**`Spec Inbox/SPEC_COUNCIL_OF_JOANNES.md`** (v0.3) — Complete antagonist constellation. 7 wounds mapped with TRIAD comedy calibration (Clown/Cult Leader/Jerk). Shadow-of-the-Diplomat structural reveal. Luke/Dagobah shadow mechanism (you can only fight what lives inside you). Wound 7 author self-immolation strategy (1.CRT-hammer → 2.Feminism-pickup → 3.Correct-and-cruel). Shame parasite integration. Comedy-from-deep-pain calibration. 6-face semiurgy completed.

**`Spec Inbox/SPEC_COMEDIC_CALIBRATION.md`** (v0.2, post-6-face fix) — Wound × Chapter deployment grid. All 9 chapters (Ch0-Ch8), all 7 wounds tracked. Growth model for Wound 7 (Root→Emergence→Leaf→Flower→Harvest). Handoff format with checkboxes. Somatic dependency gate.

**Blocking dependency:** `Spec Inbox/SPEC_SOMATIC_POETICS.md` Session 1 must fire before any comic pass or EA somatic rewrite. The agent cannot conjure Wendell's body states.

**Related:** `Spec Inbox/SPEC_SHAME_PARASITE.md` — The ontological correction: shame is not an emotion; it is a parasite that hijacks EA channels. Shame-valenced states: Anxiety (Fear+Shame), Depression (Sadness+Shame), Desperation (Joy+Shame), Frustration/Rage (Anger+Shame), Boredom/Apathy (Neutrality+Shame).

**Merged subpasses:** Issue 11 (Shame Parasite Ontology Integration) and Issue 23 (Somatic Poetics Manuscript Calibration Pass) now track under this umbrella.

**Session note:** First manuscript calibration pass landed in Ch1 opening / Forest / origin-story passages on both canonical and export surfaces; the register now leans more poetic and body-aware.
**Session note:** Continued calibration extended through the rest of Ch1, including gate language, the center walk, Try It Now prompts, and the BARs loop.
- **Session note:** Ch7 got the same register treatment in the Sage confession and somatic marker sections; the chapter now reads more embodied without losing the altitude analysis.
- **Session note:** Ch8 got a matching body-and-voice calibration in the Player opening, shadow-Player contrast, somatic markers, and Effective Allyship Formula payoff.
- **Session note:** Consistency audit complete across Ch1, Ch7, and Ch8. The new body-forward register is now shared across the three target chapters; remaining differences are structural, not tonal.

---

## ISSUE 11 — Shame Parasite Ontology Integration
**Status:** MERGED INTO ISSUE 10 — 2026-06-04. Ontology defined; now tracked as part of the somatic/emotional-register umbrella.
**Priority:** MEDIUM

Shame is not an emotion. It has no energy of its own. It parasitizes the 5 EA channels, converting clean signals into dissatisfied states:
- Metal/Fear → Anxiety and Worry
- Water/Sadness → Depression and Despair
- Wood/Joy → Desperation
- Fire/Anger → Frustration and Rage
- Earth/Neutrality → Boredom and Apathy

The Controller (Gate 4) is the shame-delivery system. It intercepts charge before it completes.

**What needs to happen:** This should be cross-referenced in Ch1 (Sections 5-7 where gates and Controller are discussed), Ch2 (EA mechanics), and `Spec Inbox/SPEC_SOMATIC_POETICS.md` (body-state descriptions should distinguish raw signal from shame-valenced state).

**Pedagogy note:** Use shame as the reader-facing doorway. The manuscript can start with shame because that is the most accessible entrypoint for allyship self-recognition, then translate outward into the underlying raw signals (fear, sadness, anger, joy, neutrality) once the reader can feel the pattern.

**Spec:** `Spec Inbox/SPEC_SHAME_PARASITE.md` (7,462 chars)

**Session Notes**
- 2026-06-04: Merged into Issue 10. The shame doorway now lives as a reader-facing pedagogy note inside the somatic/emotional-register workstream rather than a standalone issue.

---

## ISSUE 12 — Ch7 Voice Pass Flag
**Status:** CLOSED — 2026-06-03. Ch7 confession voice pass completed and tracker flag cleared.
**Priority:** MEDIUM

Ch7 confession draft contained `<!-- VOICE PASS NEEDED -->` flag. Structural passes (WAVE CLEAN + SHOW register) were already complete; the final voice pass has now been applied to the confession section.

**What needed to happen:** Run the Ch7 voice pass — check: S1-2-3-4 (the 4 stages at Teal altitude), 5 Transcend moves (Panoramic Seer through Returner), and the confession tone. Reference: WENDELL_VOICE_PROFILE.md.

---

## ISSUE 13 — Appendix: Back-Matter Activation System
**Status:** CLOSED — 2026-06-03. Appendices A-E complete; Ch1 seed points to Appendix A.
**Priority:** MEDIUM — needed before press; appendix A referenced in Ch1 seed paragraph

### The Problem
MTGOA has no back matter. The Ch1 domain seed paragraph (inserted 2026-05-21) references "a map in the appendix" that doesn't exist yet. The book needs a four-section appendix that converts readers into players — not academic back matter, but activation infrastructure.

### Spec
`docs/plans/2026-05-21-appendix-design.md` — full integral design spec (Hex 50 The Cauldron, Diplomat + Challenger active). Six face reference cards at `The Library/manuscripts/sources/integral-design/appendix/`.

### Five Sections (ordered for activation, not convention)

**Appendix A — The Four Allyship Domains** ← most urgent (Ch1 references it)
- Leads with diagnostic question: "Which type of power is calling you right now?"
- Four domain descriptions + gate-domain affinity table (2-2-2-2 final)
- Felt-sense diagnostic per domain
- Routes to app pre-draw diagnostic

**Appendix B — Quests + Campaigns**
- 8 chapter quests (solo, 7 days each, one per chapter) + 4 domain campaigns (21 days, group-compatible)
- Quest format follows oracle card formula: shadow → gift → 3 tasks → BAR capture route
- All 12 quest/campaign texts written 2026-06-03; ready for review and route alignment

**Appendix C — Key Terms**
- 26 terms, alphabetical, format: term → 1-sentence definition → first appears in [chapter] → related terms
- Draft complete 2026-06-03; ready for integration

**Appendix D — Emotional Alchemy Practices** ← NEW (added 2026-05-22)
- Three foundational somatic practices from Igniting Joy: Happy Apples, Grounding, The Rose
- ≤200 words per practice; format: name + what it does + steps + when to use in allyship work
- **Draft complete** in `manuscripts/appendices/APPENDIX_D_EMOTIONAL_ALCHEMY_PRACTICES.md` (folded from IJ source 2026-06-03)
- Ready for integration

**Appendix E — Bibliography**
- ≤15 sources, 5-6 annotated (≤2 sentences each)
- Draft complete in `manuscripts/appendices/APPENDIX_E_BIBLIOGRAPHY.md`
- Ready for integration

### Scope Ceiling (locked)
Total appendix ≤10% of final book word count (~6,500 words at ~65,000-word manuscript). Quality gate: every element enables action within 60 seconds of reading. Oracle card formula governs quest length (~150-200 words per quest naturally).

### Timing Dependency
bars-engine quest structures must exist before Appendix B is finalized. Coordinate before press.

### Session Notes
- 2026-05-21: Integral design spec complete. Hex 50 cast. Diplomat + Challenger active. 400-word ceiling challenged and corrected — scope is total book percentage (≤10%), not per-section cap. Appendix D bibliography needs Wendell pass.
- 2026-05-22: Appendix D added as 5th section (Emotional Alchemy Practices: Happy Apples, Grounding, The Rose). Bibliography renumbered to Appendix E. Appendix D draft content written from IJ source (pages 29-49) — in spec under "Appendix D Draft Content." Needs Wendell accuracy review. Scope budget updated: A(~800w)+B(~2,400w)+C(~800w)+D(~600w)+E(~600w)=~5,200w.
- 2026-06-03: Appendix B written as `manuscripts/appendices/APPENDIX_B_QUESTS_AND_CAMPAIGNS.md` with 8 chapter quests and 4 domain campaigns, each routing to bars-engine. Next: review for quest-name alignment with app routes.
- 2026-06-03: Appendix C restored to the fuller reference set (26 entries) and marked ready for integration in `manuscripts/appendices/APPENDIX_C_KEY_TERMS.md`.
- 2026-06-03: Appendix D written as `manuscripts/appendices/APPENDIX_D_EMOTIONAL_ALCHEMY_PRACTICES.md` and folded from the IJ source practices (Happy Apples, Grounding, The Rose); ready for integration.
- 2026-06-03: Appendix E written as `manuscripts/appendices/APPENDIX_E_BIBLIOGRAPHY.md` using the Source Integration Spec "Maps I Used" lineage; ready for integration.
- 2026-06-03: Ch1 seed already points directly to Appendix A in canonical draft and export surface.
- 2026-06-03: BAR intro in Ch0 already includes the deck and app handoff; gate prompts are embedded across Ch1-Ch8 with chapter-end app routes where needed.

---

## ISSUE 14 — Journalistic Integrity: Claims Without Grounding
**Status:** CLOSED — 2026-05-28. Ch0–Ch3 complete. Remaining chapters (Ch4–Ch7) lower priority per Wendell.
**Priority:** HIGH — affects credibility with the ideal reader on every page

### The Problem
The book operates at a high conceptual level but fails the journalistic and academic standards the ideal reader holds. She reads social science, feminist nonfiction, journalistic long-form. She will catch every ungrounded claim.

Three recurring failures:
1. **Claims without evidence** — asserting something about the reader's psychology without naming the experience, study, or observed pattern it's based on
2. **Implicit citations** — drawing on Integral theory, Big Mind, Drama Triangle, etc. without naming the source
3. **Vague specificity** — using phrases like "the people you've been fighting for" or "the room where nobody shares the framework" when a concrete example or first-person account is available and should be used

### Who This Fails
The ideal reader has graduate-level critical thinking. She reads Ta-Nehisi Coates, adrienne maree brown, bell hooks, Malcolm Gladwell. All of them earn their claims. When the book asserts without grounding, she notices — and her trust erodes before the content can land.

### What Journalistic Integrity Looks Like in This Book
Not academic citation style. Rather:
- When making a psychological claim about the reader, ground it in a specific named experience ("In every room I've been in where..." or "Research on coalition dynamics shows...")
- When using a framework from another thinker, name them (even briefly)
- When making a sociological claim ("The people you've been fighting for share your vocabulary"), earn it — with a specific scenario, a first-person account, or an acknowledged source

### Spec
`docs/plans/2026-05-25-journalistic-integrity-spec.md` — full operational spec with claim taxonomy, grounding standards, chapter-by-chapter audit, citation integration plan, acceptance criteria, word count budget.

### Session Notes
- 2026-05-25: Flagged by Wendell from early reader feedback. Confirmed book-wide. Issue 1's Ch0 addition exposed the problem — the coalition-trap paragraph was gestural rather than grounded. Spec written and approved. Estimated final manuscript: 96,000–105,000 words.
- 2026-05-28: **CLOSED.** Ch0: coalition trap paragraph rewritten (first-person grounding from Wendell interview: vocabulary-fluent rooms vs. care-work rooms; missionary parallel); Watts+Carse+Elliott architecture claim grounded (4 paragraphs); "Why a Game" synthesis paragraph added (healthy dissociation/re-engagement thesis); Maslach+Gorski burnout grounding added; Wilber+Chou citations added; "But this book is not a courtroom" defensive transition removed. Ch1: Elliott attribution (shadow Face), Big Mind attribution (gate list), Egan attribution (Practice methodology). Ch2: Elliott+Big Mind (sequential gate walk adds connected sequence Ch1 couldn't), Wilber 3-2-1 attribution. Ch3: Egan attribution (skill development through repeated practice). SOURCE_INTEGRATION_SPEC fully updated — Sources 5–7 (Watts, Carse, I Ching/Wilhelm/Baynes), Research Credits (Maslach/Gorski), Polarity TBD flag, Quote Opportunities table, "Maps I Used" complete (7 entries), Implementation Plan 10 ✅ items, Vault Sources status section.

---

## Reference Documents Built This Session

| Document | Location | Purpose |
|----------|----------|---------|
| `IDEAL_READER_PROFILE.md` | Book OS | Full reader profile — editorial cautions, shadow traps |
| `WENDELL_VOICE_AGENT_GUIDE.md` | Book OS | **Operational** HOW/WHEN/WHERE/WHY for AI editing |
| `WENDELL_VOICE_PROFILE.md` | Book OS | The moves extracted from tweet corpus + BARs |
| `VOICE_MATRIX_BY_FACE.md` | Book OS | All five influences × six Faces quick reference |
| `VOICE_ANALYSIS_ADAMS.md` | Book OS | Adams deep study |
| `VOICE_ANALYSIS_PRATCHETT.md` | Book OS | Pratchett deep study |
| `VOICE_ANALYSIS_NEELY.md` | Book OS | Neely deep study |
| `VOICE_ANALYSIS_JUNG_REDBOOK.md` | Book OS | Red Book Jung deep study |
| `VOICE_ANALYSIS_WHITMAN.md` | Book OS | Whitman deep study |
| `VOICE_ANALYSIS_WILBER.md` | Book OS | Wilber deep study |

---

## ISSUE 15 — Ch6 Integrative Negotiator Voice Pass (Deferred)
**Status:** MERGED INTO ISSUE 2 — 2026-06-04. Channel 5 drafted; now tracked as part of the voice/comedy umbrella.
**Priority:** MEDIUM — structural architecture complete; polish before Obsidian promotion

### Scope
Voice pass on Ch6 material touched by **Price-Namer → Integrative Negotiator** rename (2026-05-24):

| Target | File | Notes |
|--------|------|-------|
| Channel 5 practice block | `CHAPTER6_DIPLOMAT_FULL_DRAFT_MASTER.md` § CHANNEL 5 | Primary — new prose, check Diplomat register |
| Section 1 thesis + vignettes | same | Man vignette updated; woman OK; thesis reframed |
| Move 3 (Close with Honest Terms) | same § Section 6 | Reframed from walk-away; may need tightening vs Channel 5 |
| Section 7 recap | same | Terminology updated |
| Ch0 two-currencies inoculation | `CHAPTER0_DRAFT.md` | After Token System — optional Ch0 voice tie-in |

### What to check
- Teaching-mode setup sentences (see Issue 2 / Ch2 voice pass pattern)
- No walk-away price / Price-Namer lexicon bleed
- Diplomat register: negotiator not Challenger; permission without molasses
- Somatic beats: parity with Channels 1–4 (Channel 5 has one explicit body note)
- Refuse False Equivalence fold — not preachy, still discernment

### References
- `WENDELL_VOICE_AGENT_GUIDE.md`
- `VOICE_MATRIX_BY_FACE.md` (Diplomat row)
- `manuscripts/chapters/ch6-diplomat/CHANNEL5_RENAME_MAP.md`
- `CH6_CHANNEL5_6FACE_ANALYSIS.md`

### Acceptance
Wendell approves Channel 5 + related Ch6 rename prose; rename map checklist item closed; ready for Obsidian promotion of Ch6 architecture.

### Session Notes
- 2026-05-24: Channel 5 drafted. Backlog item created per Wendell — continue editorial pipeline without blocking on voice pass.
- 2026-06-04: Merged into Issue 2. Ch6 voice tuning remains important, but it is no longer tracked as a separate workflow.

---

## ISSUE 16 — Book Tooling Hybrid: Spec–Manuscript Drift
**Status:** OPEN — integrity pass 2026-05-24. Architecture **approved**; implementation **gated**.
**Priority:** HIGH — blocks clean integration pass

### Decision (approved 2026-05-24)
Hybrid Technique Academy + Polarity Phase 2 Split (Option S). Spec: `POLARITY_PHASE2_SPLIT_SPEC.md`, analysis: `TOOL_PLACEMENT_6FACE_ANALYSIS.md`, `POLARITY_PLACEMENT_6FACE_ANALYSIS.md`.

### Integrity finding
Generic `integrity-check` skill sufficient for four-suit loop; **book-specific extension required** for MTGOA source hierarchy, Phase 1/2/3, and kitchen-sink gates. New skill: `.cursor/skills/book-integrity-check/SKILL.md`.

### Blockers before manuscript work
1. ~~Spec sync (`SPEC_BOOK_TOOL_PLACEMENT`, tool inventory)~~ partial 2026-05-24  
2. ~~**`CH3_321_PHASE2_SPEC.md`**~~ — approved + Ch3 inserted 2026-05-24  
3. ~~**Ch2 compression**~~ — 3-2-1 + polarity → Phase 1 catalog (2026-05-24)  
4. ~~**Ch4 encounter + Ch6 Move 3 merge**~~ — **DONE 2026-05-29.** Ch4: `### Polarity Encounter — Honor ↔ Reform` inserted after Section 3 close, before Section 4. Honor↔Reform pair, cargo-cult ideal-reader catch (land acknowledgments / vocabulary-as-membership), solo inheritance draw, appendix cross-ref. Ch6: Move 3 replaced with merged map+close flow — Care↔Impact pair, bridge sentence from Ch4, discernment note (over-care ≠ both-sides), boxed exercise with `/polarity` app handoff, molasses shadow added to somatic. Backups: `CHAPTER4_REGENT_FULL_DRAFT_backup_2026-05-29_pre-polarity.md`, `CHAPTER6_DIPLOMAT_FULL_DRAFT_MASTER_backup_2026-05-29_pre-polarity.md`.

### Integrity spec
`06 Specs/2026-05-24-book-tooling-hybrid-integrity-spec.md`

### Session Notes
- 2026-05-24: Book integrity check run on approved polarity split. Status: **NEEDS REWORK (ready to implement after G4 + Ch2 compress)**. Appendix stub created. `book-integrity-check` skill added.
- 2026-05-24: **Ch3 321 spec approved.** Ch2 compressed (13,981w → 12,549w; 3-2-1 catalog 253w, polarity catalog 282w). Ch3 `Reclaim the Projected Line` exercise inserted. Appendix stubs populated with relocated Ch2 prose. Backups: `CHAPTER2_SHAMAN_FULL_DRAFT_backup_2026-05-24_pre-hybrid-compress.md`, `CHAPTER3_CHALLENGER_FULL_DRAFT_backup_2026-05-24_pre-321-insert.md`. **Next:** Ch4 polarity encounter, Ch6 Move 3 merge.
- 2026-05-29: **Ch4 + Ch6 complete.** Issue 16 implementation done. All 4 blockers resolved. Issue 16 STATUS → CLOSED pending Wendell voice pass approval.

---

## ISSUE 17 — Effective Allyship Formula + Token/Ticket Integration
**Status:** CLOSED — 2026-06-02. Integrated into Ch0, Ch1, and Ch8; spec archived.
**Priority:** HIGH — Friday final-draft integration layer; reduces concept load if implemented lightly.

### The Problem
The manuscript has several powerful frames that risk feeling separate: the Infinite Arcade, tokens/tickets, superpower, BARs, bounded external action, enrollment, institutions, and consistency. The token/ticket mechanic appears early as a strong frame, but then recedes. Ch8 also needs a clean reader-facing interface that gathers the journey without introducing a brand-new system at the end.

### The Integration Fix
Use **The Effective Allyship Formula** as the simplest playable version of the whole book:

1. Identify your superpower.
2. Identify who needs your superpower.
3. Enroll allies to help you help those people.
4. Show up consistently.

Connect the formula to the token/ticket economy:
- Superpower makes the reader more effective at the games in the Infinite Arcade.
- Using a satisfaction-linked superpower costs fewer tokens and generates more tickets.
- Identifying who needs the superpower shrinks the Infinite Arcade to a manageable number of games.
- Trying to care about every game burns tokens and produces few tickets.
- Enrolling allies pools tokens and combines superpowers.
- Showing up consistently turns allyship from a random fun day at the mall into practice.

### Chapter Placement
- **Ch0/Ch1:** Seed the formula as the practical promise; allow impatient readers to skip to Ch8.
- **Ch1:** Tie formula to Infinite Arcade/token scarcity.
- **Ch2:** Superpower source = satisfaction-linked gift / Zone of Genius.
- **Ch3:** Discernment = who needs the superpower; clean no protects clean yes.
- **Ch4:** Roles, responsibilities, and institutions make consistency easier.
- **Ch5:** Leverage and environment design make superpower strategic.
- **Ch6:** Honest terms make ally enrollment clean.
- **Ch7:** Consistency = choosing the real game and returning.
- **Ch8:** Full interface: named section, four-step formula, token/ticket bridge, first rep.

### Spec
`Spec Archive/SPEC_EFFECTIVE_ALLYSHIP_FORMULA_INTEGRATION_2026-06-02.md`

### Analysis
`ISSUE17_22_EFFECTIVE_ALLYSHIP_TOKEN_6GM_ANALYSIS_2026-06-02.md`

### Acceptance
- Exact phrase `The Effective Allyship Formula` appears early and in Ch8.
- Ch1 reconnects formula to tokens/tickets and the Infinite Arcade.
- Ch2-Ch7 each carry only a light chapter-specific bridge.
- Ch8 gathers the full formula and gives the reader an immediate rep.
- Implementation does not become a large rewrite; it should compress and connect existing material.

### Session Notes
- 2026-06-02: Issue created after Wendell identified the Effective Allyship Formula as a late-book interface and then connected it to the token/ticket mechanic. Spec drafted and updated with token/ticket integration. Manuscript edits not started.
- 2026-06-02: 6 Game Master analysis created. Verdict: reconcile Issue 17 + Issue 22 first; use Issue 17 as governing spec and absorb Issue 22 as token/ticket economics unless Ch0 still fails after read-through.
- 2026-06-02: **CLOSED.** Ch0, Ch1, and Ch8 updated with formula/token bridges. Spec moved to `Spec Archive/`.

---

## ISSUE 18 — Book OS Manuscript Promotion Recovery
**Status:** CLOSED — 2026-06-02. Ch0-Ch8 promoted into Book OS canon with backups.
**Priority:** HIGH — source-of-truth stabilization; blocks reliable multi-agent editing.

### The Problem
Book OS chapter containers and `manuscripts/chapters/` are split. Book OS is intended to be canon, but the most complete chapter text currently lives in manuscript exports. This creates sync ambiguity and makes it harder for Claude Code, Claude Web, and Codex to agree on which chapter text is real.

### The Fix
Run a promotion/recovery pass that promotes current manuscript export files into Book OS chapter containers with backups and verification. This is a file/canon operation, not a prose rewrite.

### Spec
`Spec Archive/SPEC_BOOK_OS_MANUSCRIPT_PROMOTION_RECOVERY_2026-06-02.md`

### Acceptance
- Book OS chapter containers contain the current promoted chapter text.
- Backups exist before every promoted file is changed.
- Manifest/log records source path, target path, backup path, and verification result.
- After promotion, Book OS is again the chapter canon and `manuscripts/chapters/` is derived/export.

### Session Notes
- 2026-06-02: Spec moved to Spec Inbox and added to tracker. No implementation yet.
- 2026-06-02: **CLOSED.** Ch0-Ch8 Book OS chapter containers promoted from manuscript exports with same-folder backups (`*_backup_2026-06-02_pre-promotion-recovery.md`). Ch2 pending/unapplied WB-1/WB-6 proposal preserved in Ch2 status. `MTGOA_BOOK_WORK_TRACKER.md` updated. Promotion log created: `PROMOTION_RECOVERY_LOG_2026-06-02.md`. Spec moved to `Spec Archive/`.

---

## ISSUE 19 — Ch0 Allyship Definition + Self-Sabotage Myths
**Status:** CLOSED — implemented in Book OS canon and archived.
**Priority:** HIGH — Ch0 trust and thesis clarity.

### The Problem
Ch0 needs to answer three load-bearing questions before the reader enters the six Faces: why allyship, why mastery, and why a game. The current chapter catches exhaustion and the bad game, but it still needs a clear definition of allyship and the self-sabotage beliefs that distort allyship into a private trial.

### The Fix
Add a Ch0 revision centered on the definition:

> Allyship is the practice of increasing another person's well-being while protecting the conditions that allow both of you to remain full players in the game.

Then connect distorted allyship to the six self-sabotaging beliefs, so the reader understands why helping can become proof-seeking.

### Spec
`Spec Archive/SPEC_CH0_ALLYSHIP_DEFINITION_AND_SELF_SABOTAGE_MYTHS_2026-06-02.md`

### Acceptance
- Ch0 contains a clear, reader-facing allyship definition.
- Ch0 names how self-sabotage beliefs distort allyship.
- The addition deepens trust without turning into a lecture.
- Ch0 still moves cleanly into the Infinite Arcade/game frame.

### Session Notes
- 2026-06-02: Spec moved to Spec Inbox and added to tracker. No manuscript edits yet.
- 2026-06-03: Ch8 Player comedy pass started in manuscript canon/export: shadow-Player "graduate seminar in motionlessness" line and mode/ego line added to deepen section-level release without naming the Council.
- 2026-06-03: Tightened shadow-Player joke to "detailed marginalia" and added RPG/campaign framing: choose the role the moment asks for; don't bring the same character to every campaign.
- 2026-06-03: Ch7 Sage council pass added the "too many books / new shelf every bruise" objection and answered it with grammar instead of another catalog.
- 2026-06-03: Comedy direction clarified. Governing rule: each milestone/epiphany should be set up as a joke whose punchline is release from the failed allyship game and permission to play a new one. New operating memo: `Spec Inbox/SPEC_COMEDY_SECTION_BUTTONS_AND_RELEASE_RULE_2026-06-03.md`.
- 2026-06-02: 6 Game Master analysis created for the first target (Ch0 Wound 1 / Clown). Analysis file: `Spec Inbox/ISSUE21_CH0_WOUND1_CLOWN_6GM_ANALYSIS_2026-06-02.md`.
- 2026-06-03: Comedic depth audit created after early punch-up pass. Conclusion: current lines work as chapter-edge punch-ups, but the book likely needs section-level comic buttons and more Jerk register later. Analysis file: `Spec Inbox/COMEDIC_DEPTH_AUDIT_2026-06-03.md`.
- 2026-06-02: **CLOSED.** Ch0 Book OS canon updated with the allyship definition, self-sabotage myths, and well-being resistance bridge. Spec moved to `Spec Archive/`.

---

## ISSUE 20 — Well-Being Resistance + Gates as Receptivity Mechanism
**Status:** CLOSED — implemented in Book OS canon and archived.
**Priority:** MEDIUM-HIGH — sharpens the allyship definition and prevents savior logic.

### The Problem
The new allyship definition depends on "increasing another person's well-being," but the book needs to clarify that well-being cannot be installed in someone who is organized around resisting it. Without this, the reader can slide into coercive care, saviorism, resentment, or burnout.

### The Fix
Use the Gates as the mechanism for understanding receptivity. Allyship can increase the conditions for another person's well-being, but it cannot force reception without violating the definition. The helper creates conditions; the other person still has to become available to their own well-being.

### Spec
`Spec Archive/SPEC_WELLBEING_RESISTANCE_AND_GATES_RECEPTIVITY_2026-06-02.md`

### Acceptance
- Ch0/Ch1/early Gates material distinguishes support from forced transformation.
- The book names resistance to well-being without contempt.
- The Gates become a receptivity mechanism, not only a self-diagnosis tool.
- The implementation protects against savior logic and burnout.

### Session Notes
- 2026-06-02: Spec moved to Spec Inbox and added to tracker. No manuscript edits yet.
- 2026-06-02: **CLOSED.** Ch0/Ch1 Book OS canon updated with well-being resistance and Gates receptivity language. Spec moved to `Spec Archive/`.

---

## ISSUE 21 — Council of Joanne's Punch-Up Engine
**Status:** MERGED INTO ISSUE 2 — 2026-06-04. Punch-up engine retained as a diagnostic tool inside the voice/comedy umbrella.
**Priority:** HIGH for Thursday comedy pass; author-side tool, not reader-facing framework.

### The Problem
The manuscript still risks being too polite, abstract, or evasive about the social forces the ideal reader is trying to survive. The comedy pass needs an author-side antagonist diagnostic that sharpens prose without turning the manuscript into caricature.

### The Fix
Use the Council of Joanne's as a punch-up engine during the comedy/voice pass. The Council is not automatically named in the manuscript. It helps the editor ask where care has become control, safety has become surveillance, accountability has become permanent insufficiency, or the reader is obeying the Council instead of playing the game.

### Spec
`Spec Inbox/SPEC_COUNCIL_OF_JOANNES_PUNCH_UP_ENGINE_2026-06-02.md`

### Acceptance
- Comedy pass uses the Council as diagnostic pressure, not as a new concept dump.
- Punch-ups sharpen social reality without mocking actual vulnerability.
- The prose gains bite, specificity, and absurdity while staying in Wendell's voice.
- No manuscript passage names the Council unless Wendell explicitly chooses that move.

### Session Notes
- 2026-06-02: Spec moved to Spec Inbox and added to tracker. No manuscript edits yet.
- 2026-06-04: Merged into Issue 2. The Council remains a diagnostic lens, but it now lives inside the broader voice/comedy pass rather than as its own standalone issue.

---

## ISSUE 22 — Token System Expansion / Two-Currency Ch0 Bridge
**Status:** CLOSED — 2026-06-02. Absorbed into Issue 17 implementation and archived.
**Priority:** MEDIUM-HIGH — overlaps Issue 17 and Ch0 trust architecture.

### The Problem
The token system is a strong Ch0 mechanic, but the section may state the model more than it creates the emotional alchemy event. This overlaps with Issue 17: tokens/tickets need to remain live through the book, not appear as an opening metaphor and disappear.

### The Fix
Use the token system expansion spec to decide whether Ch0 needs two epiphany bridges:

1. Allyship has a finite cost; the reader has been overspending.
2. Energy may be renewable, but the reader has been spending the wrong currency in the wrong game.

Coordinate this with Issue 17 so the token/ticket frame supports the Effective Allyship Formula instead of creating a competing Ch0 expansion.

### Spec
`Spec Archive/SPEC_TOKEN_SYSTEM_EXPANSION.md`

### Analysis
`ISSUE17_22_EFFECTIVE_ALLYSHIP_TOKEN_6GM_ANALYSIS_2026-06-02.md`

### Acceptance
- Ch0 token/ticket material creates felt recognition, not just explanation.
- The token/ticket mechanic remains compatible with Issue 17.
- No redundant expansion: if Issue 17 covers the bridge cleanly, this spec can be archived as absorbed.

### Session Notes
- 2026-06-02: Spec moved to Spec Inbox and added to tracker. Needs reconciliation with Issue 17 before manuscript edits.
- 2026-06-02: 6 Game Master analysis created. Verdict: do not run as separate Ch0 expansion before Friday unless the combined Issue 17 pass fails; likely absorb into Effective Allyship Formula token/ticket layer.
- 2026-06-02: **CLOSED.** Token/ticket bridge folded into Issue 17 and Ch0/Ch1/Ch8 updates. Spec moved to `Spec Archive/`.

---

## ISSUE 23 — Somatic Poetics Manuscript Calibration Pass
**Status:** MERGED INTO ISSUE 10 — 2026-06-04. Awaiting Session 1 source material for manuscript calibration inside the somatic/emotional-register umbrella.
**Priority:** HIGH — needed to translate the new body-voice register into actual manuscript prose

### The Problem
We now have the right direction for `SPEC_SOMATIC_POETICS.md`: evocative body language, not prescriptive feeling language. But the manuscript itself still needs a calibration pass so the new register shows up where it matters instead of remaining a note in the spec system.

### The Fix
Use the Session 1 material to calibrate manuscript passages that most depend on body truth and voice texture:
- **Ch1:** confession / shame-doorway / body-truth passages
- **Ch7:** Sage confession and overreach language
- **Ch8:** Player tone, freedom, and embodied agency

The pass should prioritize poetic, metaphorical body language that evokes awareness without instructing the reader what to feel.

### Prompt Sources
- `Spec Inbox/SOMATIC_POETICS_SESSION_1_PROMPT_PACK_2026-06-04.md`
- `Spec Inbox/SPEC_SOMATIC_POETICS.md`

### Acceptance
- Manuscript prose reads more embodied and alive without becoming clinical or instructional.
- Body language feels like voice, not worksheet language.
- Ch1, Ch7, and Ch8 show the new register clearly enough that future passes can imitate it.

### Session Notes
- 2026-06-04: Backlog item added after Session 1 prompt pack creation. Awaiting full source capture and first calibration pass.
- 2026-06-04: Merged into Issue 10. The manuscript calibration pass still needs to happen, but it now sits under the somatic/emotional-register workstream rather than as its own standalone issue.
- 2026-06-04: First calibration pass landed in Ch1 opening / Forest / origin story; remaining calibration can now key off those edits.
- 2026-06-04: Continued calibration extended through the rest of Ch1, including gate language, the center walk, Try It Now prompts, and the BARs loop.

---

## Session Startup Protocol

At the start of every editorial session:
1. Read this document
2. Ask Wendell: which issue are we working on today?
3. Pull the relevant reference docs before touching the manuscript
4. Follow the backup protocol before any manuscript edits (`EDITORIAL_VERSION_CONTROL.md`)
5. Check `Spec Inbox/` for unimplemented specs and `Spec Archive/` for addressed/superseded specs if an issue appears missing or stale.

---

## Session Log
- 2026-06-02: **Spec Inbox created** — active unimplemented specs moved into `Spec Inbox/`; `Spec Archive/` created for addressed/superseded specs.
- 2026-06-02: **Issue 17 created** — Effective Allyship Formula + token/ticket integration spec added to tracker. Spec later archived after Ch0/Ch1/Ch8 updates.
- 2026-06-02: **Issue 22 created** — Token System Expansion / Two-Currency Ch0 Bridge spec added to tracker. Spec later absorbed into Issue 17 and archived.
- 2026-05-24: **Integration Unit 6 drafted** — Polarity Map inserted in Ch2 after 3-2-1 (`CHAPTER2_SHAMAN_FULL_DRAFT_backup_2026-05-24_pre-polarity.md`). Three worked examples: boundaries/belonging, truth/safety, care/impact. Voice pass deferred.
- 2026-05-24: **Issue 15 created** — Ch6 Integrative Negotiator voice pass deferred to backlog. **Integration Unit 2 drafted** — 3-2-1 practice inserted in Ch2 after WAVE-Spiral (`CHAPTER2_SHAMAN_FULL_DRAFT_backup_2026-05-24_pre-321.md`). Voice pass on 3-2-1 section not yet run.
- 2026-05-18 (morning): **Ch8 voice + structural pass.** Removed teaching-mode bold throughout (Ch2 already done 2026-05-18). Named all 5 modes upfront, made Elder/Outlaw distinct, added Reader Journey table with 1:1 coaching and allyship deck destinations. Removed duplicate paragraph from Designer. Backup: `CHAPTER8_PLAYER_FULL_DRAFT_backup_2026-05-18.md`. **CAUGHT:** edit_file_llm on `/shadow/321` route accidentally received manuscript edit — reverted route to clean state. **Rule:** Never edit a zo.space route and a manuscript file in the same session with the same code_edit pattern.
