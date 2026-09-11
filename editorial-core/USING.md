# Using the editorial pipeline

For the person running it on their own book. `README.md` is what the thing *is*; this is what you
*do*.

---

## The one idea

**Every scanner has a target of zero.** A hit is a defect until it is either **rewritten** in the
prose or **accepted** in the ledger with a reason written down. Those are the only two endings. A
hit that is neither stays on the board, and the board stays red.

Zero is deliberate and it replaced something worse. The pipeline used to score each book against
its own measured rate, which meant a habit became the standard as soon as it was frequent enough.
Zero plus a ledger says the opposite: **the exceptions are the interesting part, and they get
written down one at a time.**

---

## Install

```bash
python3 editorial-core/init_project.py ../my-book --name "My Book"
```

Two flags matter:

| flag | when |
|---|---|
| `--corpus "manuscript/*.md"` | your prose is not in `chapters/`. `**` recurses. |
| `--prose-section "## Chapter Text" "## Notes"` | each file carries apparatus around the prose — an outline above, notes below |

That second one is worth getting right. Without it, every instrument counts your YAML front matter
and your editorial notes as writing.

The installer runs the board and shows you the result. **A fresh project fails the `zero` check as
soon as it has prose. That is the pipeline working**, not a problem with your install.

### Then fill in three things

Open `editorial.yaml`:

- **`banned:`** — words this book does not use. Yours alone; the core ships none.
- **`reader:`** — who reads this book. Needed only for reader passes (see below).
- **`reference:`** — comp-title bands for `prose_diet`. Optional.

And one more, whenever your prose directory also holds working documents:

```yaml
exclude:
  - "WRITING-GUIDE.md"     # how to write a card, not a card
```

`prose_section` scopes apparatus *inside* a file; `exclude` scopes out a whole file, matched
against the project-relative path and against the basename. **On the third install, 15 of the
first 18 hits were an authoring guide sitting beside the deck it described.** Narrowing the
`corpus:` glob by hand to dodge such a file works until someone adds a file.

### Check it yourself

```bash
python3 editorial-core/selftest.py
```

Installs into a throwaway directory, plants one defect per scanner, and asserts each fires — plus
that the ledger silences a hit, that a corrupt ledger fails the board, and that clean prose comes
back clean. **19 assertions.** Nobody has to take a summary on trust, including you.

---

## The daily loop

### 1. Run the board

```bash
python3 instruments/coherence.py
```

Every check, then the findings. The line to read is the last one.

| check | what it means when it complains |
|---|---|
| `zero` | you have unresolved hits. **This is the working number.** |
| `readable` | your ledger will not parse. Everything else is unreliable until this is green. |
| `ledger` | an acceptance no longer matches any sentence — you rewrote a kept line |
| `gates` | an instrument is off because NLTK is missing |
| `core` | your core is behind. `LOOK` means safe to defer; `FAIL` means counts moved |
| `wiring` / `orphan` / `pass-wire` | an instrument is declared but not wired, or wired but missing |

### 2. Look at one instrument

```bash
python3 instruments/trailing_and.py -v          # every site, book-wide
python3 instruments/trailing_and.py draft.md    # one file, before it lands
```

Every scanner takes both shapes. The last line is always the machine summary:

```
EDITORIAL trailing_and unresolved=12 accepted=4 total=16 target=0
```

### 3. Resolve each hit — rewrite, or accept

**Rewrite** in the prose. If your chapters are generated from a manuscript file, edit the
manuscript and re-run your sync script; editing the generated file gets overwritten.

**Accept** when the sentence should stand:

```bash
python3 instruments/ledger.py accept trailing_and \
  --quote "A practitioner arrived at a door with a bag, took a spare room, ate at the family's table, and left when the case was done." \
  --reason "Serial predicates — four verbs in series on one subject, not two coordinate clauses."
```

**Never hand-edit `editorial_exceptions.yaml`, and never edit it with a script that manipulates
text.** A `str.replace` on a key name matched inside a comment on 2026-09-09 and silently killed 23
acceptances while the board still read clean. `ledger.py` parses, mutates and re-serialises, and
refuses to write a file that will not parse. The whole story is in
`POSTMORTEM_2026-09-09_LEDGER.md`.

#### Getting the quote right

**The quote must be the sentence the instrument keys on, and that is not always the line you see
in the listing.** Several instruments key on the *containing sentence* after paragraph reflow, so a
`-v` listing — which truncates at 130 characters and may show a fragment or a whole paragraph —
is not a source you can copy from.

**The symptom is silent:** `ledger.py` reports `accepted 1 of 1` because it wrote the entry
successfully, and the instrument's `accepted=` count does not move, because nothing matched.

So check after every acceptance:

```bash
python3 instruments/slop_shapes.py | tail -1
```

If `accepted=` did not go up, the quote is wrong. Widen or narrow it to the full sentence — from
the preceding full stop to the next one — and try again. `ledger.py remove` takes the bad entry
back out.

*This is the sharpest rough edge in the pipeline, found by the third install. It wants instruments
that print their own ledger keys; until then, verify every acceptance.*

#### A rewrite must name the relation, not drop the comma

**`trailing_and` needs the comma. `polysyndeton` needs two links. A single bare `and` joining two
clauses is invisible to both** — 4.3% of MTGOA's sentences sit in that gap, and it is the easy way
to make a hit disappear without repairing anything.

Caught 2026-09-09. A six-chapter refrain read *"The view has four domains, and one cheap habit that
is none of them."* My repair was *"…imitates them and is none of them"* — comma gone, board clean,
**and the same `and` still refusing to say that the relation is concession.** Wendell: *"the and is
none of them is a defect. This is another dangling and."*

It now reads *"One cheap habit imitates all four without being any of them."* `without` commits.

**The test after any rewrite:** the count went down, but did the sentence say how its two halves
relate? If the answer is still *here is another one*, the defect moved rather than resolved. `and`
is honest joining like with like — two nouns, two adjectives, two steps of one action. It is a dodge
wherever the real relation is cause, concession, sequence or consequence.

Two rules for a good reason:

- **Name the shape, not the feeling.** *"Serial predicates, one subject, four verbs"* survives;
  *"this one reads better"* tells the next reader nothing.
- **A false positive is a legitimate acceptance.** If the regex caught something the rule never
  meant — a noun series, a quoted line, a form field — say which, and accept it. That is a
  resolution.

**One thing that is never a reason: a scanner bug.** If the hit is wrong because the instrument is
wrong, fix the instrument. A ledger entry over a bug hides the bug permanently, and the next
sentence it mis-flags will look accepted too.

### 4. Confirm

```bash
python3 instruments/coherence.py
```

`zero` shrinks. When an instrument reaches zero it drops off the findings list.

---

## Verify a whole ledger

```bash
python3 instruments/ledger.py check
```

Parses the file and prints what each instrument holds. Run it after anything unusual.

---

## The reading layer

The instruments count. They have no reader, and a count cannot tell you that a chapter lost
someone on page four. Two agent passes sit above them, described in `READER_FACES.md`:

- **An ICA pass** reads one chapter as the person in your `reader:` block and reports the
  experience — where they leaned in, where they nearly stopped.
- **A six-Face pass** convenes on that chapter with the counts and the reading both in front of it,
  and rules on what the work is doing.

Rulings land in the prose or in the ledger. **They never change the board**, because a reading
varies run to run and the board holds because it repeats.

---

## Updating the core

```bash
python3 editorial-core/sync_core.py ../my-book            # what would change
python3 editorial-core/sync_core.py ../my-book --apply    # do it
```

It overwrites the shared modules and **never touches** `editorial.yaml`,
`editorial_exceptions.yaml`, `build_book.py` or `review.py`. Those are yours.

Every release is one of two kinds:

| | |
|---|---|
| **capability** | something new exists; nothing already counted moved. `core` reports; take it whenever. |
| **validity** | the same prose now produces a different number. `core` **fails your board** until you sync. |

The dry run names every pending release and its kind, so a number moving under you is never a
surprise. After a validity sync, expect counts to shift and check `ledger` — a sentence that stops
being reported leaves its acceptance stale.

---

## When something looks wrong

**A count you do not believe.** Run the instrument with `-v` and read the sites. Most surprises are
one of three things: apparatus being scanned (set `prose_section`), a regex catching a shape the
rule never meant (accept it, naming the shape), or a real defect you had not noticed.

**A check reading `n/a`.** It means the project has not declared the thing that check inspects.
That is usually correct — and it is also the shape that hid a live bug once, so if you *did*
declare it, the declaration is not being found.

**The board green and the counts wrong.** Check `readable` first. An unparseable ledger used to
read as an empty one.

---

## The files, and who owns them

| | owner | synced? |
|---|---|---|
| `instruments/*.py` (the closure) | the core | **yes, overwritten** |
| `instruments/build_book.py`, `instruments/review.py` | you | no |
| `editorial.yaml` | you | no |
| `editorial_exceptions.yaml` | you | no — and write it only through `ledger.py` |

`CLOSURE.md` lists exactly which modules travel, and how that list is re-derived from the import
graph rather than maintained by hand.
