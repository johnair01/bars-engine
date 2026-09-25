# -*- coding: utf-8 -*-
"""
draft_lines.py — read arbitrary files into the record shape the instruments expect.

## Why this exists

`specs/GAP_DRAFT_REVIEW_INSTRUMENTS_2026-08-29.md`, after Wendell asked *"how are our
skills not catching this?"* on marketing copy the pass had reported clean:

> `fragment.py` and `antecedent.py` read `-v` and `--write` off `sys.argv` and have no
> FILE branch. They glob `manuscript/ch[1-9].md` regardless of arguments.

Every instrument that scans prose gets its lines from `find_line.surfaces()`, which walks
`build_book.SPINE` — the printed book and nothing else. **That is correct for a book-wide
sweep and useless for a draft**, which is the half of the review that runs before anything
lands.

This module produces the same records from any path, so an instrument gains draft mode by
changing where its `lines` come from and nothing else.

## The record

    {"label": …, "rel": …, "line": n, "surface": "body"|"margin", "text": …, "key": …}

Identical to `find_line.surfaces()`, including the folded `key`, so downstream code cannot
tell the two sources apart.

## What it strips, and why each one would otherwise be reported as prose

**YAML front matter.** `type:`, `tags:`, `source:` are metadata. Scoring them reports the
file's own filing as a fragment, which every one of these notes would fail.

**A commentary header above the last `---`**, for anything under `marginalia/new_prose/`.
`review.py` already reads by this convention and its comment says why: the first run of the
draft path flagged a banned word and a sentence-initial *And* that were both in my notes
about the prose rather than in the prose.

**Fenced code blocks.** A draft that quotes its own HTML would otherwise have every tag
scanned as English.

**Marginalia frames** are marked rather than dropped, exactly as `surfaces()` marks them,
because margin voice has its own rules and the caller decides.
"""
import io, os, re, sys, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, os.pardir)


def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    argv, sys.argv = sys.argv, [name]
    try:
        spec.loader.exec_module(mod)
    finally:
        sys.argv = argv
    return mod


fl = _load("find_line", os.path.join(HERE, "find_line.py"))

FRONT = re.compile(r"\A---\n.*?\n---\n", re.S)
FENCE = re.compile(r"^\s*```")

# Markdown apparatus: a heading, a table row, a block quote, a list item. NOT prose, and every
# instrument filters on it.
#
# **A bullet needs the SPACE after it.** This used to be a bare `startswith(("#","|",">","-","*"))`,
# which treats `**Polarity Map, the** — For two goods that...` as a list item, because the entry
# opens on an asterisk. Every glossary entry in MTGOA begins that way, so the first line of each
# was dropped from the scan; paragraph reflow then joined what was left into a fragment starting
# mid-sentence, and the glossary was effectively unscanned.
#
# Found 2026-09-09 when Wendell rejected `Barry Johnson's, and the distinction under it is his.`
# — which I had classified as a harmless split artifact and suppressed with a lower-case-start
# rule. **It was bad prose, and the rule I added to ignore it was hiding the reason it looked odd.**
# A suppressor over a bug is the thing this pipeline exists to stop.
APPARATUS = re.compile(r"^\s*(?:#{1,6}\s|\||>\s|[-*+]\s|\d+\.\s)")


def is_apparatus(text):
    """A markdown line that is not prose. See APPARATUS."""
    return bool(APPARATUS.match(text))


def paths_from(argv):
    """Positional paths, with the `--write` target removed. The shared argv convention."""
    out, skip = [], False
    for a in argv:
        if skip:
            skip = False
            continue
        if a == "--write":
            skip = True
            continue
        if a.startswith("-"):
            continue
        out.append(a)
    return [p for p in out if os.path.exists(p)]


def body_of(text, rel=""):
    """The prose, with front matter and any commentary header BLANKED rather than removed.

    Blanked, not cut, because the line numbers have to keep pointing at the real file.
    The first version used `sub("")` and every reported site was off by the length of the
    YAML block -- `trailing_and.py` reported `AUTHOR_BIO:40` for a hit that is on line 51,
    and line 40 is the domain at the foot of the bio. A report you cannot navigate from is
    worse than no report, because it sends the reader to innocent prose.
    """
    def blank(m):
        return "\n" * m.group(0).count("\n")
    text = FRONT.sub(blank, text)
    if "new_prose" in rel and "\n---\n" in text:
        head, _sep, tail = text.rpartition("\n---\n")
        text = "\n" * (head.count("\n") + 1) + tail
    return text


def surfaces(paths):
    """`find_line.surfaces()`'s records, read from the given files instead of the spine."""
    out = []
    for p in paths:
        rel = os.path.relpath(os.path.abspath(p), ROOT)
        text = body_of(io.open(p, encoding="utf-8").read(), rel)
        # The project's non-printing lines (v32), same hook as book mode: see find_line.
        drop = fl._nonprinting(text.split("\n"))
        depth, fenced = 0, False
        for n, raw in enumerate(text.split("\n"), 1):
            if n - 1 in drop:
                continue
            line = raw.rstrip()
            if FENCE.match(line):
                fenced = not fenced
                continue
            if fenced:
                continue
            if fl.FRAME_OPEN.search(line):
                depth += 1
                continue
            if fl.FRAME_CLOSE.search(line):
                depth = max(0, depth - 1)
                continue
            if not line.strip():
                continue
            out.append({"label": os.path.basename(p), "rel": rel, "line": n,
                        "surface": "margin" if depth else "body",
                        "text": line, "key": fl.fold(line)})
    return out


def prose(lines):
    """Body paragraphs only — no headings, tables, quotes, list items or numbered steps.

    `density.paragraphs()` does this for the book and cannot be reused: it drops anything
    under 25 words and filters on components that only exist in the spine. A draft is
    often shorter than one of its own paragraphs.
    """
    out = []
    for l in lines:
        t = l["text"].strip()
        if not t or t.startswith(("#", "|", ">", "- ", "* ", ":::", "<")):
            continue
        if re.match(r"^\d+\.\s", t):
            continue
        if l["surface"] != "body":
            continue
        out.append(l)
    return out


def paragraphs(lines):
    """Reflow line-records into paragraph pseudo-records, so a hard-wrapped sentence is never
    split into fragments and no `and`/label at a wrap boundary is counted as a real one.

    A sentence scanner splits on `.!?` WITHIN each record's text. That is correct only when a
    record is a whole paragraph. Parts of this manuscript are one paragraph per line (a record
    is already a paragraph); other parts are hard-wrapped at ~70 columns (a sentence is spread
    over several records, and splitting each record yields fragments). Both are handled here:
    consecutive records — same file, same surface, adjacent source line numbers — are joined
    with a single space into one paragraph. `surfaces()` drops blank lines, so a blank between
    paragraphs is a gap in the numbering, and that gap is the boundary. A file already written
    one paragraph per line passes through unchanged.

    The pseudo-record keeps the FIRST source line's number, so a reported hit still navigates to
    the paragraph's start, and re-folds `key` from the joined text.
    """
    out, cur = [], None
    for l in lines:
        if (cur is not None and l["rel"] == cur["rel"] and l["surface"] == cur["surface"]
                and l["line"] == cur["_end"] + 1):
            cur["text"] += " " + l["text"]
            cur["_end"] = l["line"]
        else:
            if cur is not None:
                out.append(cur)
            cur = dict(l)
            cur["_end"] = l["line"]
    if cur is not None:
        out.append(cur)
    for r in out:
        r["key"] = fl.fold(r["text"])
    return out
