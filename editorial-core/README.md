# editorial-core

The shared editorial pipeline: prose scanners, the manifest reader, the reference-band builder, and
the self-check. **This directory is the source of truth.** Projects run copies of it.

Extracted here on 2026-09-09 by a six-face ruling
(`.specify/specs/editorial-core-distribution/six-faces-update-timing.md`). Until then the core lived
inside `mtgoa-manuscript/instruments/` beside ~200 book-specific files, and was kept identical
across projects by hand.

## The split this whole thing rests on

| | |
|---|---|
| **Universal** — `instruments/` | The defect logic. None of it knows a book's name. Owned by the core. |
| **Profile** — `editorial.yaml` and `build_book.py` | What is true of one project: its corpus, targets, banned words, reference bands. Owned by the project. |

`CLOSURE.md` declares exactly which files are which, and how to re-derive the list.

## What the pipeline owes

A hit against a zero target has **two** terminal states: **rewritten** in the prose, or **ledgered**
in `editorial_exceptions.yaml` with a written reason. Both are the pipeline's work. Handing a hit
back to the author — "unresolved", "your call", "flagged for review" — is **not a terminal state**,
and a pass that produces one has failed rather than deferred. The author ratifies and reverts.

Full rule, and the failure that produced it, in `READER_FACES.md` § *The two terminal states*.

## Start here

**Running it on a book:** `USING.md`. **What v17 is and what it is not:** `RELEASE.md`.
The rest of this file is how the thing is put together.

## Consuming it

```bash
python3 editorial-core/init_project.py ../my-book --name "My Book"
```

Optional flags: `--corpus "manuscript/*.md"` where the prose is not in `chapters/`, and
`--prose-section "## Chapter Text" "## Notes"` where each component carries apparatus in the same
file as the prose. The installer copies the closure, drops `build_book.py` and `review.py` into
`instruments/`, stamps `core_version` and computes `core_home`, writes a ledger skeleton, and then
**runs `coherence.py` and shows you the board**. An installer that has not run the board has not
finished.

A fresh project fails the `zero` check the moment it has prose. That is the pipeline working.

**The manual install is gone, and the reason is worth keeping.** A cold-install test on 2026-09-09
found three of its six steps wrong or stale, each one silent: `review.py` was documented into the
project root while `coherence.py` resolves it at `instruments/review.py` — so `wiring`, `pass-wire`
and `orphan` all reported *"not present in this project"* and three checks sat dark; the template
carried `core_version: 1`, so every fresh install opened with a false staleness warning; and the
template's `targets:` were two scanners behind. **A check that reports `n/a` when it should be
running is worse than one that fails.**

Then fill in `editorial.yaml`'s `banned:`, `reader:` and (optionally) `reference:`. Those are the
project's own work and the file says so at each one.

## Versioning

`VERSION` holds the current core version; `instruments/core_meta.py` carries the same number as
`CORE_VERSION`, baked into every copy. **Raise both in the same change** that alters a core
instrument. A project records the version it installed as `core_version:` in its manifest, and
coherence.py compares the two whenever `core_home` is reachable.

**Release severity — ruled 2026-09-09, implemented with `sync_core.py`.** A release that changes
what a measurement *means* is a **validity** release and fails a stale project's board, the way a
`scorer:` mismatch does. A release that adds capability **reports** and waits for the project to
take it. Until the severity field ships, every release reports.

## Dependencies

`instruments/requirements.txt`. PyYAML is what the manifest reading needs; NLTK powers `fragment`
and `antecedent` and its absence turns those two gates off with a message that says so. Everything
else is standard library.

## Current consumers

| project | notes |
|---|---|
| `mtgoa-manuscript` | Also keeps its own `review.py`, `build_book.py` and ~200 book-specific instruments. Declares no reference bands, so `prose_diet` uses its historical baseline. |
| `07 Book OS/the-ai-psychologist` | Reader and genre bands declared; `prose_diet` reads against them. |
