# BARs Integration Spec — Book ↔ App
**For:** MTGOA Editorial Reference + Future App Dev
**Created:** 2026-05-08
**Status:** Design phase — no manuscript or app changes made yet
**Related issue:** DEVELOPMENTAL_ISSUES_TRACKER.md — Issue 3

---

## The Lineage

**Igniting Joy (Book 1):**
- Physical blank-card deck included with or alongside the book
- After each challenge (drawn from the standard 52-card suit deck), reader wrote a BAR card
- BAR = a moment of transformation captured: what happened, what shifted, what was learned
- By end of book: personalized deck of "gold" — evidence of the alchemy
- No app. Pure physical practice.

**MTGOA (Book 2) — The Opportunity:**
- bars-engine app exists and can receive BARs digitally
- App can tag BARs by Face, chapter, Gate
- App can suggest quests based on captured BARs
- BARs captured during reading become starting material for campaign play
- Reader who uses app during reading has a practice before they finish the book

**The Gap:**
The book doesn't tell readers to open the app. Without explicit prompts at the right moments, the app and the book remain parallel experiences instead of one integrated practice.

---

## What a BAR Is in MTGOA Terms

A BAR is a captured moment of significant recognition — the kind that fades if you don't name it.

In the 8 Gates walk: the Gate that cost you something. The one that stopped you. The one you skipped and came back to.

In a Face chapter: the moment you recognized your own pattern. "That's the game I've been playing."

In a "Try It Now" practice: what actually happened when you tried it, not what you expected to happen.

In the Exile/Distortion sections: the moment you recognized yourself in the description of the shadow behavior.

**The BAR format for readers (working draft):**
- What happened / what you noticed / what you recognized *(Behavior)*
- What you felt in your body as it landed *(Affect)*
- What's one thing that's clearer now than it was before *(Reflection)*

This should take 2-3 minutes. The app receives it. It becomes theirs.

---

## Where BAR Moments Belong in the Book

### Structural placement (per chapter):

**8 BAR prompts per chapter — one after each Gate in the 8 Gates walk.**

Each prompt is Gate-specific × Chapter-Face-specific, activating a specific hexagram from the 64-hexagram matrix. The prompt captures what that particular Gate's voice costs in the context of this chapter's Face work.

This replaces the "2-3 per chapter" model. The Reflection Prompts section at the end of each chapter (currently titled "BARs for the [Face] Level") is removed entirely — the 8 gate-embedded prompts ARE the BARs.

**Each BAR prompt:**
- Appears immediately after its Gate's section closes
- Names what this specific Gate does in this specific chapter's context
- Asks for capture in BAR format: what happened / what you felt / what's clearer now
- Points to the app
- Is short — 2-4 sentences in Wendell's voice, not teaching mode

**Hexagram activated per Gate × Chapter intersection:**
See `BARS_ICHING_ARCHITECTURE.md` for the full 64-hexagram matrix. Each prompt's specific character is informed by the hexagram it activates — but the reader does not need to know they're activating a hexagram. The hexagram meaning shapes the *voice* of the prompt, not the instruction.

### Estimated BAR moments per chapter:
- Ch0: TBD (prologue — outside the 8-chapter Later Heaven mapping; BAR introduction here, not 8 gate prompts)
- Ch1–Ch7: 8 each (one per Gate)
- Ch8: TBD (Player does not use standard gate walk format)

Total: ~56 gate-embedded BAR prompts across Ch1-Ch7

---

## The Voice of the BAR Prompt

**NOT teaching mode:**
> "Take a moment to reflect on your experience. Using the BAR format (Behavior, Affect, Reflection), capture what happened in this Gate encounter. This will be valuable data for your allyship practice going forward."

**YES Wendell voice:**
Something closer to:
> *One of those Gates just found you. Name it before it disappears. What happened. What you felt. What's clearer now. Two minutes in the app. It becomes yours.*

Or even shorter:
> *That Gate landed. Capture it. → [bars-engine]*

The voice should match the register of the surrounding prose. Not a sidebar instruction — a natural continuation of the voice.

---

## Design Questions to Resolve

**App-side:**
1. What is the exact URL / entry point for book readers entering BARs? (Needs to be stable enough to print in a book)
2. Does the app have a "book reader" onboarding flow separate from the standard player onboarding?
3. What Face/chapter tagging should the app apply automatically vs. ask the reader to specify?
4. What happens to the BAR after it's captured — what does the reader see? What can they do next?

**Book-side:**
1. Visual treatment: inline text? sidebar element? icon-flagged moment?
2. Should there be a QR code? Or just a URL? (Books with QR codes feel more like textbooks)
3. Does the BAR prompt replace the existing Reflection Prompts at chapter end, or supplement them?
4. How does Ch0 introduce the BAR system to readers who don't know what it is?

**Content-side:**
1. Ch0 needs to introduce BARs as a concept — how does this land in Wendell's voice without feeling like an instruction manual?
2. Should the BAR prompts be the same structure in every chapter, or should they vary by Face?
3. The ideal reader has probably journaled before — how does a BAR differ from journaling in a way that matters?

---

## How BARs Serve the Ideal Reader Specifically

The ideal reader (Green altitude, Enneagram 2) has a strong practice of reflection — journaling, therapy, debriefs. She's good at processing experience into meaning.

What a BAR offers her that she doesn't already have:
- **Timing:** Capturing before processing. The BAR format asks for the felt-sense (Affect) before the interpretation. She's better at interpretation than sensing. The BAR format slows the reflex to immediately make meaning.
- **App persistence:** Her processing usually stays in her head or in journals that don't talk back. The bars-engine app can connect her captured moments to quests and campaigns — giving the reflection somewhere to go.
- **Naming the shadow:** A BAR captured in the Challenger chapter, where she recognized her avoidance of clean "no" — that's the beginning of shadow work. The app knows what Face it came from.

---

## The Igniting Joy Upgrade

| Feature | Igniting Joy | MTGOA |
|---------|-------------|-------|
| BAR medium | Physical blank cards | bars-engine app |
| BAR trigger | After each challenge card | Embedded in chapter flow |
| BAR destination | Personalized physical deck | Player profile, tagged by Face |
| What happens next | Reader has a deck | App suggests quests, connects to campaigns |
| Reader sees | Their own cards | Their BAR timeline + quest suggestions |

The physical deck was elegant. The app is more powerful — but only if the book creates the bridge.

---

## Next Steps

1. **Resolve design questions** (app team + Wendell) — especially the URL/entry point question and onboarding flow
2. **Draft BAR prompt language** in Wendell voice — start with Ch2 Shaman as pilot chapter
3. **Decide visual treatment** — do BAR moments get a distinct visual element in the book layout?
4. **Write Ch0 BAR introduction** — the reader needs to know what a BAR is before they're asked to capture one
5. **Pilot with one chapter** before applying pattern to all chapters
