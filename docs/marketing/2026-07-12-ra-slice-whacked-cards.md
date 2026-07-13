# RA Slice — Whacked Cards (full card face, candidates)

> The four slice cards, whacked end to end: Chapter-0 voice + Whack-Pack cut (compress · concrete ·
> turn · **end on a whack** · play). Player-facing prose only — the grammar (move/face/domain/BAR)
> is untouched. Candidates for your ratification; nothing hits `move-library.ts` until you sign off.
>
> **Finding:** the card renders **"Your move"** (`action`) *and* **"The practice"** (`remediation`).
> On these RA cards `action` was never authored, so it falls back to a generic submove ("Notice
> potential") — weak. This pass sets a real `action` (the do-it-now whack) distinct from
> `remediation` (the keep-doing practice).

---

## 1. `WAKE-RA-ARCHITECT` · **Point**

**Card face (after):**
- **Title:** The Story That Could Land
- **Question (self):** Of everything true here, which one fact would flip someone who disagrees?
- **Your move:** Find the single fact that would flip a skeptic — and lead with only that.
- **The practice:** Cut ten facts down to the one that travels. Do it every time before you post.
- **Flavor:** *Ten correct things bounce off. One true thing lands.*
- **Avoid:** Stacking more facts on a made-up mind · Amplifying the loudest thing, not the truest · Data with no story
- **How it slips:** The truth that doesn't travel · Ten right facts, zero minds changed
- **Applications:** *(the two general ones from the candidates doc)*

**Before → after (changed lines):**
- Question: "What truth, if made visible, would change the most?" → **"…which one fact would flip someone who disagrees?"**
- Your move: ~~generic submove~~ → **"Find the single fact that would flip a skeptic — and lead with only that."**
- Practice (was remediation): "Name the one fact that, if everyone saw it, would change things." → **"Cut ten facts down to the one that travels…"**
- Flavor: *(none)* → **"Ten correct things bounce off. One true thing lands."**
- How it slips: "Missing the story that would move people / Truth that doesn't travel" → **"The truth that doesn't travel / Ten right facts, zero minds changed"**

---

## 2. `SHOW-RA-CHALLENGER` · **Point** — *the template; light touches only*

**Card face (after):**
- **Title:** Say the Thing
- **Question (self):** What's the true thing you keep almost saying?
- **Your move:** Pick the one true sentence you're avoiding. Send it before you close this card.
- **The practice:** Say the true thing while it still costs something — today, to the people who need it.
- **Flavor:** *The naming is the first move.*
- **Avoid:** One more draft · Private clarity · A soft hint instead of the thing
- **How it slips:** The truth that never gets said · A soft hint you'll call brave later
- **Applications:** *(existing two — unchanged)*

**Before → after:**
- Question: "What truth must I actually state — publicly or to someone's face — now?" → **"What's the true thing you keep almost saying?"**
- Your move: ~~generic submove~~ → **"Pick the one true sentence you're avoiding. Send it before you close this card."**
- How it slips: "The truth that never gets said" (1 item) → **+ "A soft hint you'll call brave later"** (pads the single-item list the audit flagged)
- *Title / practice / flavor / avoid unchanged — already at target.*

---

## 3. `OPEN-RA-SHAMAN` · **Witness**

**Card face (after):**
- **Title:** What Seeing Costs
- **Question (self):** What does it cost you to *feel* this, not just know it?
- **Your move:** Before you react, give the truth one breath to land. The breath is the move.
- **The practice:** Feel the hard thing before you speak on it. Skip the breath and you're performing.
- **Flavor:** *Knowing is cheap. Feeling it is the fare.*
- **Avoid:** Explaining instead of feeling · Numbing to the truth · Performing a feeling you skipped
- **How it slips:** Knowing without feeling · Abstraction as armor
- **Applications:** *(the two general Witness ones — before you post / a hard conversation)*

**Before → after:**
- Question: "What do I actually feel when I let this truth land?" → **"What does it cost you to feel this, not just know it?"**
- Your move: ~~generic submove~~ → **"Before you react, give the truth one breath to land. The breath is the move."**
- Practice: "Let the truth land for one breath before you respond." → **"Feel the hard thing before you speak on it. Skip the breath and you're performing."**
- Flavor: *(none)* → **"Knowing is cheap. Feeling it is the fare."** *(ties to the token/fare frame)*
- Avoid: "Intellectualizing / Numbing / Performing feeling" → **"Explaining instead of feeling / Numbing to the truth / Performing a feeling you skipped"**

---

## 4. `GROW-RA-SHAMAN` · **Witness**

**Card face (after):**
- **Title:** The Witness Growing in You  *(optional punchier: **"The Rep You're On"**)*
- **Question (self):** What allyship skill are you clumsy at right now — the one that's actually growing?
- **Your move:** Name the rep you're on — one size bigger than today. Take it once.
- **The practice:** Practice the skill you're still bad at, out loud. Practice beats performance.
- **Flavor:** *The fumble is the useful part.*
- **Avoid:** Faking the finished version · Performing growth · Borrowing someone else's voice
- **How it slips:** Naming the skill you wish you had, not the one you're growing · Performing mastery instead of practicing
- **Applications:** *(the two general Witness ones — the skill you're mid-rep on / online)*

**Before → after:**
- Question: "What capacity to see or speak truth is trying to grow in me?" → **"What allyship skill are you clumsy at right now — the one that's actually growing?"**
- Your move: ~~generic submove~~ → **"Name the rep you're on — one size bigger than today. Take it once."**
- Practice: "Name the seeing or speaking capacity one size bigger than today." → **"Practice the skill you're still bad at, out loud. Practice beats performance."**
- Flavor: *(none)* → **"The fumble is the useful part."**
- Avoid: "Forcing eloquence / Performing growth / Borrowing…" → **"Faking the finished version / Performing growth / Borrowing someone else's voice"**
- How it slips: single item → **two items** (pads the flagged single-item list)

---

## Notes for your read
- **Every card now ends on a whack** — the "Your move" is a do-it-now prod; "The practice" is the
  keep-doing version. Two distinct prods, no filler.
- **Flavor carries the aphorism** (the quotable line) on all four — that's the Whack-Pack signature.
- **Witness cards** (#3, #4) still script no feeling — they show the *shape* and prod; the felt
  content stays the player's.
- **One optional title** flagged (#4). The rest of the titles already land.

## Next
Ratify / tune these (change any word, kill any line). On your OK I write the four into
`move-library.ts` (title/question/action/remediation/flavor/forbidden/failure/applications), run the
QA overlay, and we've got the full-card target locked to scale across the other 26.

---

### Source
- Voice + format: `docs/marketing/2026-07-12-voice-guide-and-revoiced-point-slice.md` (Chapter-0
  lens + Whack-Pack lens). Fields: `src/lib/allyship-deck/types.ts`. Cards: `move-library.ts` `*-RA-*`.
