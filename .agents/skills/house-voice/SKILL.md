---
name: house-voice
description: Wendell's house voice and editorial pass for anything a customer reads — landing pages, UI microcopy, emails, Gumroad descriptions, wiki entries, error states. Run it after writing or rewriting customer-facing prose and before it ships. Use when the user asks whether copy sounds right, reads as AI, is too long, or is off-brand; or mentions house voice, tone, the style sheet, or the voice lint.
---

# House voice

The editorial system that produced *Mastering the Game of Allyship*, reduced to the portion
that applies to product copy. The book ran nine chapters through it; the rules below are
the ones that survived contact with a reader.

**Scope: anything a customer reads.** Landing pages, buttons, empty states, error
messages, emails, Gumroad descriptions, wiki entries, quest text a human wrote.

**Not this skill:** internal docs, commit messages, code comments, and AI-generated quest
prose — that last one belongs to `narrative-quality`, which has its own feedback loop and
its own KB. If you are generating quest text, use that. If a person wrote it and a
customer will read it, use this.

---

## Run it in this order

### 0 · ELI5 first — write it twice

Before drafting in voice, write the same copy the way you would explain it to a
five-year-old. Plain words, a person doing something, no house vocabulary. Then write the
real version and keep the ELI5 open beside it.

Two results fall out, and both are cheap:

- **If you cannot write the ELI5, you do not have the copy yet.** Stop and work out what
  it says before spending words on how it says it.
- **The diff between the two is the audit.** Every word in the real version that is not in
  the ELI5 is either doing work or it is decoration. Ask which, one at a time.

### 1 · The lint — hard findings are defects, not opinions

```bash
python3 tools/voice_lint.py "src/app/**/*.tsx" --strict
```

It reads TSX and reports only on customer-visible strings, so it lints the copy and not
the code. **Every HARD hit is a defect.** Fix it; do not argue with it.

| rule | what it catches |
|---|---|
| `banned` | `rooms`, `quiet`, `genuinely`, `things` — the four words that always mean a sentence is dodging |
| `andbut` | sentence-initial *And* / *But* |
| `emdash` | glued em-dashes; the budget only ratchets down |
| `stacks` | negation stacks |
| `A0` | narrating the reader's unnamed history back to her as fact |
| `prodtag` | `[ URL / QR ]` and friends — these ship |
| `empty-head` | `the thing`, `this part`, `that piece` — name the referent |

**If a banned word is the word the sentence wants, the sentence is wrong, not the word.**
The ban exists to force a rebuild. Swapping in a synonym that does not quite fit
(`quiet` → `careful`) evades the work the ban was there to cause, and the linter will pass
it.

The SOFT numbers are ratios against the book's own measured baseline. Over **1.30** means
read the sites; it does not mean the sentence is wrong. **A ratio under ~300 words is
noise** — score a page, never a button.

### 2 · The slop pass

Run the `no-ai-slop` skill on the draft, **against its `eval.md` and not only its pattern
list**. The pattern list finds bad sentences. `eval.md` check 1 — *does the edit preserve
the point without adding claims, examples, or stats* — finds invented ones, which is the
failure that actually reaches customers.

Then re-run the lint, because a slop edit changes the numbers.

### 3 · The stance pass — five questions no counter can ask

These are a reading. Run them after the counters come back clean, not instead.

1. **Person.** Who is being spoken to? A page that drifts from *you* to *a team* to *we*
   has changed who is in the conversation. `grep -nE '\b(we|us|our)\b'` and ask whether this
   surface uses first person plural at all.
2. **Doer.** Who is doing the verb? The passive counter misses get-passives —
   `grep -nE '\b(gets?|got|getting) +\w+(ed|en)\b'`. *What gets protected* traded a doer
   for nothing.
3. **Borrowed move.** Is this a named move from the book, used without naming it? The book
   owns ~30 named moves. Performing one unnamed in marketing copy teaches it at the wrong
   altitude and spends the book's material for free.
4. **Back-pointer.** Does an opening *That / This / It* point at something recoverable?
   Inside a paragraph, fine. Across a section, or pointing at a whole preceding paragraph,
   not fine. **Fixing a vague pointer by writing another one is the default mistake.**
   Usually the fix is to delete the bridge and let the first real sentence carry the link.
5. **Promise.** Does this claim something the product does? If the copy says it, something
   has to do it. A tagline the book never earns is the same defect as a feature the app
   does not have.

---

## The constraints — always on, never chosen

From the book's revision instrument. These are not stylistic options.

| | |
|---|---|
| **Hero / guide** | the reader is the hero, we are the guide who already walked it. Never narrate her interior. |
| **Ranking, not denying** | a negation is legal only if the negated claim is still true when the sentence ends |
| **Mechanism visible** | simple language for the promise, exact language for the mechanism |
| **No Orange substrate** | no urgency, scarcity, achievement or attention-anxiety as the engine. No countdown timers, no "only 3 left", no manufactured FOMO. This is the one that most marketing copy fails, and it fails the book's whole argument at the same time. |
| **Beat placement** | fragments carry beats, never claims, and only in landing position |
| **Assert capacities, not pathologies** | *You are the one who moves* is a claim the work has earned. *You know the loop* claims she has a recurring private failure, which nothing has earned. |

**The characteristic failure of any repair pass**, and it is worse than the defect it
fixes: promoting an abstraction out of a subject slot needs a new subject, and the nearest
one is always the reader. *A familiar loop keeps running* becomes *You know the loop*, the
counters all improve, and the sentence is now a lie about somebody's life.

Four legal subjects when the abstraction has to go: a conditional; an open menu (*a
meeting, or a group chat, or a Sunday dinner*); a third party who really acts; or nobody —
cut it, because a state report with no doer is usually a sentence the page does not need.

---

## Two notes about this repo specifically

**The ladder is named here on purpose.** The book conceals that the six Faces are integral
altitudes — that concealment is a deliberate reading experience and it holds inside the
book's prose. This product names Spiral Dynamics and Integral Theory openly in the wiki and
the glossary, and that is correct. **Do not "fix" the wiki to match the book, and do not
import the book's concealment into surfaces that teach the model directly.** The rule is
scoped to book prose.

**The seven Heads do not come with this.** Maera Voss and the other headmasters are
in-world authors of in-world documents. A product surface speaking in a fictional
headmaster's voice is a category error — the customer has not opted into the fiction yet.
What ports is Wendell's own register, which is what `reference.md` describes.

---

## Never ship unreviewed copy

Copy pasted into a PR description, a Slack message, or a review comment is copy. A
candidate line written inline gets the same pass as a file: write it down, lint it, then
paste it. **Composing in the reply is where the check gets skipped, every time.**

Show the before/after for any edit to copy that already shipped. A counter finds
candidates; only a person approves them. Quote the whole sentence, not the fragment the
counter highlighted — the fragment is enough to find an edit and not enough to judge one.
