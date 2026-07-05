# Paste this into Claude Design

*(Pair with `SALES_LETTER.md` — that file is the copy; this is the layout + design system.)*

---

Design a **long-form sales-letter landing page** (mobile-first, ~430px, scrollable) for **Mastering
the Game of Allyship** — a book + a 120-card oracle deck + a game. The tone is **mythic and earned,
not slick**: this audience distrusts manipulation funnels. Dark, warm, tactile. No countdown timers,
no fake scarcity.

**Design system (BARS Engine):**
- Background: `#0a0908` (warm near-black); radial ember glow top-center
- Surface / cards: `#14151a`; elevated `#1a1712`; hairline borders `rgba(244,242,236,0.09)`
- Text: primary `#f4f2ec` · secondary `#b4afa3` · muted `#7c776c`
- Primary action (buttons/links): liminal purple `#7c3aed`
- Gold (eyebrows, accents): `#c9a84c`
- Element gems (semantic — used on the offer cards): book→water `#3b82c4` · deck→fire `#e05c2e` · handbook→metal `#c0c0c0` · game→wood `#2ecc71` · physical book→earth `#c8a84b`
- Fonts: **Jost** (headings, 600–700) · **Nunito** (body) · **Space Mono** (eyebrows / labels / price)
- Mono eyebrows: 10px, uppercase, letter-spacing .28em, gold

---

## What to design — one scrolling page, these sections in order

1. **Hero.** Gold mono eyebrow ("A book, a deck, and a game…"). Huge Jost headline: *"You already
   care. That was never the problem."* Subhead: *"The problem is that nobody ever taught you the
   moves."* One primary button "Show me the moves ↓" (purple). No stock photo — let the type + ember
   glow carry it.

2. **The problem** (body prose block, ~65ch measure). The freeze/overcorrect/go-quiet paragraph.
   Quiet, close, second-person.

3. **The reframe — "Allyship is a game."** A band with the **four moves** as four small cards in a
   row/grid: Wake Up · Clean Up · Grow Up · Show Up, each with its one-line tagline. Understated,
   not gamified-cartoonish.

4. **Myth quiz module** (interactive card, embedded). A distinct bordered panel: eyebrow "Which myth
   is running you?", a stack of forced-choice buttons, and a result state (myth → truth → reframe →
   "the book takes this apart" CTA). Design the **idle**, **mid-question**, and **result** states.
   *(Wire to the Claude-Design myth quiz.)*

5. **Superpower quiz module** (interactive card, embedded). Same treatment: eyebrow "What are you
   built for?", the seven superpowers named, a "Take the 12-question quiz" CTA, and a **result
   state** that reveals the superpower AND ties to the deck ("the Oracle has your moves" + the
   per-superpower pack). Design idle + result states.

6. **The offer grid.** The heart. A set of **elemental product cards** — each card: element gem glow
   at top, product name (Jost), one-line blurb, price (Space Mono), and a purple "Get it →" button
   (Gumroad). Cards: **Book** (water), **Oracle Deck** (fire), **RPG Handbook** (metal), **The Game
   monthly** (wood), **Physical book** (earth, "preorder"), **Founding Ally Bundle** (gold, patron).
   Make the **Book + Deck** the visual anchors (largest); the rest secondary. Show a "setup pending"
   muted state for any card whose store link isn't ready yet.

7. **Trust block — "Why this isn't another guilt trip."** Author origin-story prose + the honest
   "no countdown, no fake scarcity, built by hand in Portland" lines. Warm, human.

8. **Final CTA + email fallback.** Big purple "Get Mastering Allyship →". Beneath it, a low-key
   email field: "Not ready? Send me Chapter One →".

9. **PS** — italic, muted, the closing paragraph.

**Motion:** minimal — a soft fade/rise on scroll for each section; the quiz result states can
animate in. Respect `prefers-reduced-motion`. Nothing flashy.

**Feel:** a hand-set mythic manifesto that happens to sell — closer to a beautifully typeset zine
page than a SaaS landing page. Type and spacing do the work; the two quiz modules are the only
"interactive-looking" elements.
