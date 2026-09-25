# v17 — the release

**Ruled 2026-09-09** by a six-Face pass, cast seed **3306**: PRIMARY 33 *Withdraw* (Heaven over
Mountain, Strategic Retreat), changing lines 2 and 6, RELATING 28 *Undertake the Great* (Critical
Juncture). Value turn: **Strategic Retreat → Critical Juncture**. Mountain's card: *clarity lives
in what you refuse.*

The panel found nine core versions shipped in one day, three new modules since morning, twenty-one
modules total, and two consumers who are both the author's. 28's image is a ridgepole under too
much weight, and the Architect named the ridgepole as the core itself.

---

## The ruling

**1 · The core ships as it stands. Stop building it.**
No new instruments, no new checks. The next core change is a bug the selftest finds, or nothing.

**2 · Build `sync_core.py`, and only that.** ✅ DONE — v17
The one real gap between *installable* and *maintainable*, and a promise already half-made: the
staleness check could detect a stale project and could not fix one. Shipped with the release
severity field that had been declared since morning and never implemented.

**3 · The three `n/a` checks are deferred, not forgotten.**
`reference`, `register` and `orphan` report `n/a` when a project has not declared what they inspect.
Correct — and the same shape that hid the ledger incident, because none of them distinguishes
*undeclared* from *declared and broken*. A v18 item, behind a real third consumer.

**4 · The 1,159 unresolved hits are a book problem, not a core problem.**
Out of the shipping conversation. MTGOA's debt is a launch decision; the AI Psychologist's is a
drafting decision. Neither blocks a third project.

**5 · Prove it with a third install.** ✅ DONE — Flirtcraft, v18
The Challenger's card: a distribution model tested only by its author is untested. Installed cold
into a card-game project — a corpus of `decks/**/*.md` rather than chapters, prose in JSON-adjacent
markdown, no book structure at all. **The install itself worked first try.** What it found is below,
and Sage was right that a third project tests the documentation: two of the three findings are
things two books could not have surfaced.

| found | fix |
|---|---|
| **Fenced code blocks scanned as prose.** `draft_lines` has always skipped them; `find_line` never did — the same draft-clean / book-leaky asymmetry as the front-matter bug, from the same cause. | fixed in v18 |
| **No way to exclude a whole file.** `prose_section` scopes apparatus inside a file; nothing scoped out a file. 15 of Flirtcraft's first 18 hits were its authoring guide. | `exclude:` added in v18 |
| **A user cannot know a ledger key.** Instruments key on the containing sentence after reflow; the `-v` listing truncates. `ledger.py` reports success and the count does not move. | documented in `USING.md`; the real fix is instruments printing their own keys — **open** |

Flirtcraft finished at **`COHERENCE PASS`**: two exclusions declared, one acceptance written with a
reason, zero unresolved.

**Agreement:** all six read the core as done and the debt as separate.
**Split:** Challenger and Sage on whether the third install proves anything. Sage held that the
selftest already proves the install and a third project only tests the *documentation*.
**Challenger carried it** — and that is exactly why `USING.md` now exists.

---

## What v17 is

| | |
|---|---|
| **Install** | `init_project.py` — one command, cold, then runs the board |
| **Verify** | `selftest.py` — 19 assertions, anyone can run it |
| **Update** | `sync_core.py` + `releases.yaml` — with validity/capability severity |
| **Use** | `USING.md` |
| **Write the ledger** | `instruments/ledger.py` — the only supported writer |
| **Modules** | 21 in the closure |

## Verified at release

```
SELFTEST PASS — 19/19 assertions
the-ai-psychologist    every check ok, except the standing `zero` debt
mtgoa-manuscript       every check ok, except the standing `zero` debt
```

Both consumers synced to v17 **using `sync_core.py` itself**, which is the first real exercise of
the upgrade path.

## Known and accepted

- **Two consumers, both the author's.** Item 5 above.
- **Comments are lost on a programmatic ledger write.** `safe_dump` does not preserve them, which
  is why a reason belongs in an entry's `reason:` field. Both books' head comments are already
  duplicated into their entries.
- **`prose_diet` has no honest bandless fallback.** A project with no `reference:` bands gets a
  weaker report than it should. Not blocking.
- **1,159 unresolved hits** across the two books.

## The day's incidents, all in the record

Four defects the pipeline found in itself, each with a control:

| found | control |
|---|---|
| `trailing_and`'s docstring still licensed the pre-zero regime | superseded in the core |
| book mode scanned YAML front matter and editorial notes as prose | `prose_section` + front-matter strip |
| `_BANNED_DEFAULT` shipped one book's vocabulary as the core's default | emptied; the selftest asserts a gate rule needing no project vocabulary |
| an unparseable ledger read as an empty one, board green | `readable` hard check, `ledger.py`, three selftest assertions, `POSTMORTEM_2026-09-09_LEDGER.md` |

The fourth is the one to reread. **The count repeated perfectly and it was wrong**, which is the
only way this pipeline can actually fail.
