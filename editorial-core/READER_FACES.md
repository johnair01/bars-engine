# The reading layer and the judging layer

**The ICA agent reads. The six Faces judge.**

**Wendell, 2026-09-09:** *"a batch scanner has no reader… We should be able to spin up reader agents
who are fluent in our rules but are also able to take the perspective of people looking to get
things out of the text."* And then the correction that shapes this file: *"We don't need the readers
to be characters. But we DO need them to be the 6 game masters."*

## Faces travel; Heads do not

| | what it is | where it lives |
|---|---|---|
| **The six Faces** — Shaman, Challenger, Regent, Architect, Diplomat, Sage | a portable lens set | **the core.** Six-face passes already run on Flirtcraft, the library ontology drift, story-skills orchestration and the CYOA campaign — none of them MTGOA |
| **The Heads of School** — Maera Voss, Corin Ash, Sera Quill, Irix Vale, Elian Cross, Thalen Orr | MTGOA's incarnation of the Faces, in-world | **that project.** Their names appear only inside `mtgoa-manuscript`, including in the chapters |

Same split as `instruments/` versus `editorial.yaml`: the lens is universal, the costume is the
project's. **The Faces need no character to do their work, and the reader needs no Face.**

## Two agents, and they are not the same agent

**Wendell, 2026-09-09:** *"each work would need to build an ICA agent that's separate from the 6
faces that are doing the structural voice."*

An earlier draft of this file had `reader agent = ICA × Face`. That was wrong, and it contradicted
the ruling it was built from — the faces pass had already held that the reader **is not** a Face and
that its report is *evidence the Faces weigh*. Putting the reader's experience through a Face lens
re-imports the ontology the ruling had just kept out.

| | **the ICA agent** | **the six Faces** |
|---|---|---|
| job | reads as a person who wants something from the book | structural voice — judges what the work is doing |
| unit | one per work, **built** for that work | one set, universal |
| lives in | the project (`reader:` in `editorial.yaml`) | the core |
| speaks | felt experience, in the reader's own words | structural judgment, each Face its own question |
| knows | what it came for, what it will do Monday, what it is tired of | the craft, the rules, the book's commitments |

**The ICA is outside the Face system on purpose.** It is the only voice in the pipeline whose reason
for reading comes from a life rather than from the book's own categories, which is what lets it
report a failure no Face has a name for — *twice I nearly put it down* is not a Face category, and
an ICA agent produced it while six lenses would not have gone looking.

## How the three layers meet

1. **The instruments count.** Deterministic, reproducible, and the only thing that touches the board.
2. **The ICA agent reads.** One pass, one chapter, felt experience anchored to the page.
3. **The six Faces judge**, weighing the counts and the reading together. Structural voice: what the
   work is doing, what it commits to, what carries load, what is being dodged.
4. **Rulings land in the ledger** — sentence-keyed, so the deterministic layer reads them back and
   stays deterministic.

Each layer sees what the one before it cannot. A count has no reader; a reader has no structure; a
Face has no life outside the book.

## The two terminal states

**Wendell, 2026-09-09:** *"If the editorial system can't change what are clearly violations then it's
not working. I can ratify changes, but if the system simply refuses to make the changes by saying
something is mine then it's not working."*

A hit against a zero target has **exactly two** terminal states:

| | | who does it |
|---|---|---|
| **REWRITTEN** | the prose changes and the hit stops existing | the pipeline |
| **LEDGERED** | the sentence stands, with a written reason, and the scanner stops counting it | the pipeline |

**There is no third.** "Returned to the author", "goes to you unresolved", "flagged for your
decision" and "the panel declines" are all the same move wearing different clothes, and the move is
prohibited. **The author ratifies and reverts; the author does not do the remediation.**

**A zero target is the decision, already made.** It was set deliberately, against measured baselines
that were thrown out for being self-justifying. When a scanner reports a hit, nothing remains to be
decided about *whether* it is a defect — only how it resolves. Re-opening that question at ruling
time silently restores the baseline the target replaced.

### The failure this section exists to stop

On chapter-01 of *The AI Psychologist*, 24 trailing-ands stood against `target=0` while the ICA
reported feeling none of them. The pass ruled that the two layers disagreed and **handed the 24 back
with a command to run.** Three errors stacked:

1. **The deterministic layer was overruled by an impression.** A reader failing to notice a defect is
   evidence about the reader. The counting layer exists because readings vary and counts repeat — so
   *not felt* is the expected report on a well-executed defect, never a refutation of it.
2. **Deferral was dressed as rigour.** *"The Faces decline to break that tie without a second
   reader"* sounds like restraint and functions as a refusal to work. A Face may **abstain on its own
   question** — that is the honest-abstention rule below. The panel may not abstain from resolving a
   hit.
3. **The output was a menu.** A list of line numbers plus an invitation is the thing this whole
   system was built to stop producing.

### When the panel is genuinely unsure

**Rewrite anyway, and make the original recoverable.** Apply the change, quote the before and after
in the record, and the author reverts the ones he wants back. An applied rewrite he can reject costs
him one line; an unapplied list costs him the whole job. The uncertainty is real and it is still the
pipeline's to carry.

The **only** thing that legitimately reaches the author untouched is a question a rewrite cannot
answer — a fact about the world, a rule of the built world, a thing the book has not decided yet.
That is a **world question**, not an unresolved hit, and it is filed as one.

## Building a work's ICA agent

Each work builds its own, from the `reader:` block:

- **who** — the person, concretely enough to be one person rather than a segment
- **came_for** — what they want out of this book
- **monday** — what they should be able to do afterward
- **tired_of** — what they have had enough of, which is where the book will lose them fastest
- **channels** — `use` for practical nonfiction, `fiction` for `reader-sim`'s originals

A work with no `reader:` block gets a stated default and the report says so, per `reader-sim`. A
segment is not a persona: *"DEI practitioners"* cannot nearly put a book down, and one woman on a
train can.

## The ICA has an altitude, and is never only at it

**Wendell, 2026-09-09:** *"We CAN situate an ICA with altitude, but they are never just at ONE
altitude because of transcend and include. Anyone below sage isn't going to be able to interpret
their lower levels except through the lens of the level they are at and everything else shows up as
shadow."*

The six Faces are altitudes as well as lenses — Shaman/Magenta, Challenger/Red, Regent/Amber,
Architect/Orange, Diplomat/Green, Sage/Teal. So an ICA is not a point on that ladder. It is a
**centre of gravity with every altitude beneath it included**, and included badly wherever the
integration never happened.

**Below Sage, a reader reads their own lower altitudes through the altitude they are standing on.**
Whatever refuses to translate arrives as shadow. For a Diplomat-centred reader:

| altitude | how the material arrives to her |
|---|---|
| **Sage** — above | cannot be seen clearly. Reads as aspiration, or as detachment and above-it-all |
| **Diplomat** — at | native. Reads as simply true, and therefore hardest to question |
| **Architect** — below | through Green: cold, technocratic, reducing people to a system |
| **Regent** — below | through Green: hierarchy, gatekeeping, *who made you the authority* |
| **Challenger** — below | through Green: aggression, harm. Her own Red returns as the swallowed no, resentment, the polite version of a fight |
| **Shaman** — below | through Green: woo, or essentialising. Her own Magenta returns as belonging-hunger |

**Shadow activation is signal, not failure.** In a developmental book the passage that trips the
reader's shadow is the passage doing the work. The reading question is whether it helps her see and
own what got tripped, or trips it and walks away — and only a reader positioned at an altitude can
report the difference. A generic reader feels dislike. A situated one can say *this is mine.*

**This is also why the ICA and the Faces stay separate agents.** The Faces hold the whole ladder and
can name an altitude from outside it. The ICA stands on one rung, with a distorted view downward and
no clear view up. The Faces judge with range; the ICA reports from position, and the position is the
part no lens can supply.

## What the work owes the reader

An ICA has a **centre of gravity** and the work has a **direction**. MTGOA's reader is a
Diplomat-level femme carrying Diplomat-flavoured shadows of everything below, and the book exists to
help her see and own those shadows so she can grow to Sage. That is a developmental claim, and it is
checkable: does this chapter give her a rung, or only a description of the ladder?

A project may start generic — `altitude: unset` is honest on day one. It should not stay there,
because a work with no direction of growth cannot be asked whether it achieved one.

## The six lenses — the structural voice

These are the **judging** panel, not the readers. Each asks the one question no other asks, of the
work rather than of the sentence, weighing the instrument counts and the ICA's report together.

| | Face | judges | the reading it will reach for |
|---|---|---|---|
| 🧙 | **Shaman** | the charge underneath — what the passage is actually about, and where the reader's state changed before they understood why | *"Something happened to me at that line and I read it twice."* |
| ⚔️ | **Challenger** | where the writing flinches, dodges, or argues with somebody absent; what it refuses to say plainly | *"He keeps arguing with somebody who isn't in the room."* |
| 🏛️ | **Regent** | what was promised earlier and whether this keeps faith with it; what the passage commits the book to | *"He told me something different two chapters ago and never came back to it."* |
| 🏗️ | **Architect** | load and sequence — whether this passage carries something no other carries, and whether it causes the next thing or merely precedes it | *"This said the same thing as the last one, longer."* |
| 🌿 | **Diplomat** | who is in the passage, whose standing moves, and whether the reader is addressed or handled | *"I started to feel handled."* |
| 🧠 | **Sage** | whether this is the right question for the passage to be asking, and what the whole adds up to | *"I finished it and could not say what it was for."* |

## Reward channels — the ICA agent's, not the Faces'

`reader-sim`'s channels are fiction-shaped — transportation, social simulation. A reader of a
practical nonfiction book is doing something else, so an ICA agent on this kind of book tracks:

- **Use** — could I do this on Monday? Where did the method become gettable, and where did it stay a
  description of a method?
- **Belief** — do I trust him here? Where did he pay for a claim, and where did he ask me to take one?
- **Cost** — what did reading this take out of me, and was the passage worth the toll?
- **Recognition** — where did I see myself, and where did I feel described by a stranger?
- **Stay** — did I want to keep going? Where did I nearly stop?

Fiction projects keep `reader-sim`'s original channels. The manifest says which.

## Running a pass

1. **ICA agent, one chapter.** Read the `reader:` block, read the chapter once start to finish,
   report the experience in order, anchored, in the reader's own words. No Face lens.
2. **Faces convene** on that chapter with two things in front of them: the instrument counts and the
   ICA's report. Each speaks to its own question; honest abstentions over padding.
3. **Rulings to the prose or to the ledger**, never to the board and never back to the author. A
   reading varies run to run; the board holds because it repeats. Every hit the pass touched leaves
   it in one of *The two terminal states* above, and the record says which for each.

One ICA pass plus one Face convening, on one chapter, is the unit. Six Faces on a whole book is the
version that gets abandoned.
