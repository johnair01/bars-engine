# House voice — reference

The material `SKILL.md` points at. Read it when you need to *make* a sentence rather than
check one.

---

## 1 · The colors — chosen, one per piece, committed to fully

Fourteen moves. **Only these are paint** — everything in the SKILL.md constraints table is
structural and always on.

| # | Color | What it does |
|---|---|---|
| 1 | **Testimony** | your own specific instance, first person, dated and concrete |
| 2 | **Clown** | self as the butt; your own reaction exaggerated to absurdity |
| 3 | **Jerk** | a named behavior inside a scene, teased — never a class of person |
| 4 | **Cult Leader** | satire at the system, distance held, nobody personally blamed |
| 5 | **Parable** | a person, a choice, a cost; ends on the image, never glossed |
| 6 | **Deadpan** | absurd content in a flat, sober, reportorial register |
| 7 | **Conceit** | one word run 4–6× in a sentence, or a rule held for a paragraph |
| 8 | **Reversed order** | name the effect as an established routine, reveal the cause second |
| 9 | **Bathos** | build ceremony, then drop register hard |
| 10 | **Symmetry** | two parties, identical logic, opposite verdicts, no side taken |
| 11 | **Reassignment** | significant private suffering reclassified as standard issue |
| 12 | **Unreconciled** | true cause and false feeling in one sentence, left unresolved |
| 13 | **Ladder** | stacked standalone declaratives with marked dependency |
| 14 | **Break frame** | confess in the open what the text is doing to the reader |

**Rule of commitment.** One color per piece, run all the way. Blending two produces the
average, and the average is the dead copy you started with. Blends happen across a page —
alternating sections — never inside one paragraph.

**For product surfaces specifically:** Testimony, Parable, Deadpan, Reversed order and
Ladder carry the most weight and cost the least. Clown and Jerk need a scene to live in, so
they want a long-form page rather than a button. Break frame is powerful and spends
credibility; once per page at most.

---

## 2 · Diagnosis, before any rewriting

Six checks. Mechanical, fast, and they select the color rather than just condemning.

1. **Who is in it?** A named person acting, or nobody.
2. **Which color is running?** Name it, or write NONE.
3. **Demonstrate or describe?** Is something happening, or is something being explained?
4. **Abstraction nouns in subject position** — count them.
5. **Sentence lengths** — list them. Flag three consecutive over 25 words.
6. **What does it promise, and who keeps the promise?**

A page that answers NONE to 2 and *nobody* to 1 is not badly written. It is unwritten.

---

## 3 · The counters, and the fix that pays for each

| finding | what it usually is | the move |
|---|---|---|
| `expletive` | *It was the second after…*, *There are two ways…* | put a noun in the subject |
| `copula` | *X is Y* as the default sentence | find the verb hiding in the sentence and use it |
| `zombie` | *the maintenance of*, *a recognition that* | turn the noun back into the verb it came from |
| `waste` | `it` / `this` / `that` with no clear antecedent | name the referent, or cut the clause |
| `empty` | `thing` / `part` / `piece` / `way` | name the referent; if you cannot, the sentence does not know what it is about |
| `passive` | a verb with no doer | ask who did it |

**`waste` has a floor as well as a ceiling.** Aim for roughly 0.5–0.9 of baseline. Copy
that almost never says `it` has stopped pointing at anything and reads like a specification.
The ELI5 version of a passage usually scores *worse* on `waste` and *better* to a human,
which is the whole reason the ELI5 step exists.

**A restrictive clause is aggravating, not exculpating.** `the thing that charges the
field` is worse than `the thing`, because the clause is carrying the meaning the noun
refused to.

---

## 4 · The house style sheet, the portable rows

| | |
|---|---|
| **Spelling** | American. `behavior`, `color`, `toward`, `afterward`, `while` (not `whilst`), `among`, `learned`, `gray`, `practice` (noun and verb), `defense`, `license` |
| **Numbers** | spelled out in running prose; numerals for durations, quantities in an exercise, and anything in a table. *thirty seconds*, but *3-2-1* and *120 cards* |
| **Punctuation** | serial comma. Em-dashes unspaced only when the budget allows, and the budget only goes down — prefer a colon, a comma pair, or two sentences |
| **Italics** | for a named move on first use, for a quoted interior line, for emphasis you would hear out loud. Not for scare quotes |
| **Canon capitals** | the six Faces, the five channels, the named moves, the domains. Capitalized when naming the canon, lowercase when describing the activity: *Direct Action* the domain, *taking direct action* the act |
| **Cast** | Ines, Ravi, Nadia, Tomas, Dara, Yusuf, Ana, Meera, Dele, Alan, Ellis, Ade, Femi, Tess, Bea, Ruth, Jo, Imani, Dana, Corin, Irix, Maera — spelled exactly once each |
| **The title** | *Mastering the Game of Allyship*, italicized in prose. The short form is *MTGOA* internally and never customer-facing |

---

## 5 · The lesson that cost the most

Three separate builds in this system reported OK on something wrong, and all three had the
same shape: **the check tested the mechanism instead of the result.**

- A bookmark was verified as "at the page we put it at" — always true — instead of "the
  page it opens says what it says." Thirteen chapter links pointed into the wrong chapter.
- A sample chapter was verified as "contains chapter 1" — also true of the whole book —
  instead of "contains *only* chapter 1." It shipped the entire 400-page book and reported
  SAMPLE OK.
- A file was verified as "named `cover.png`" instead of "is an image." A web rename had
  replaced 4.5 MB of artwork with two bytes of whitespace.

Applied to copy: *"did I run the linter"* is the mechanism. *"does this sentence say
something true that a person can act on"* is the result. **Only the second one is the
check.**
