# -*- coding: utf-8 -*-
"""
Find a line from the printed page back in canon, and file it as a note.

Wendell reads the PDF and pastes the lines that do not work. A pasted line has no
file and no line number, and it has been through a typesetter on the way — curly
quotes, an em-dash with no spaces, a hyphen where the source has none, a line
broken across a page. Searching for it literally fails on all four.

    python3 instruments/find_line.py "the sentence you pasted"
    python3 instruments/find_line.py -              # a blob on stdin, one per line
    python3 instruments/find_line.py - --file NOTES.md   # and append them as rows

## What it searches

Exactly what prints: the components in `build_book.py`'s spine, in spine order.
A line found in `drafts/` or `chapters/` would be a line the reader never saw.

It reports the surface too — **body** or **margin** — because they are different
voices with different rules, and a note about the annotator's hand is not a note
about Wendell's.

## Matching

Three passes, stopping at the first that hits:

  exact       after normalising quotes, dashes, and runs of whitespace
  fragment    the longest run of words that appears exactly once in the book,
              which is what catches a line the typesetter broke or hyphenated
  nearest     difflib against every sentence, reported with a score so a bad
              match announces itself rather than being quietly accepted

A line that matches in more than one place is reported with all of them and left
for a person. That is a real signal — `dupes.py` exists because sentences have
been duplicated across chapters before.
"""
import io, os, re, sys, glob, difflib, datetime, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, os.pardir)

DEFAULT_NOTES = os.path.join(ROOT, "editorial_reports",
                             datetime.date.today().isoformat(), "READ_NOTES.md")


def _load_build_book():
    spec = importlib.util.spec_from_file_location(
        "build_book", os.path.join(HERE, "build_book.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


bb = _load_build_book()


def _load_profile():
    """The manifest reader, or None where the project has no editorial.yaml."""
    try:
        spec = importlib.util.spec_from_file_location(
            "profile", os.path.join(HERE, "profile.py"))
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod if mod.exists() else None
    except Exception:
        return None


_prof = _load_profile()
SCORED_FRAMES = set(_prof.scored_frames([]) if _prof and hasattr(_prof, "scored_frames") else [])

# What a typesetter does to a line on the way to the page, undone.
FOLD = {
    "‘": "'", "’": "'", "“": '"', "”": '"',
    "—": "-", "–": "-", "−": "-", "‐": "-", "­": "",
    "…": "...", " ": " ", "​": "",
}

FRAME_OPEN = re.compile(r"<!-- (MARGINALIA|EPIGRAPH-BYLINE|HANDBOOK|SIGNATURE|POSTCARD) -->")
FRAME_CLOSE = re.compile(r"<!-- /(MARGINALIA|EPIGRAPH-BYLINE|HANDBOOK|SIGNATURE|POSTCARD) -->")

# ── What counts as prose in a component file ────────────────────────────────────
#
# FIXED 2026-09-09. `surfaces()` read every line of every component, so YAML front
# matter and any editorial apparatus in the same file were scanned as prose by every
# instrument on the board. `fragment` made it visible the hour it was switched on —
# `title: "Appendix C: Petition of Candidature" number: 91 pov: kuiper` counted as a
# fragment — but the leak was never specific to fragment: gate, telling, light_verb
# and trailing_and had all been counting it.
#
# `draft_lines.body_of` had blanked front matter since the start. Book mode, the mode
# that gates the board, was the one still reading it.
#
# Front matter is universal, so it is handled here. Where the prose sits inside a
# larger file is the project's business, declared as `prose_section:` in the manifest:
#
#     prose_section:
#       begin: "## Chapter Text"     # scanning starts on the line AFTER this
#       end:   "## Notes"            # and stops on the line BEFORE this
#
# A project that declares nothing keeps the old whole-file behaviour, and a component
# missing the `begin` marker is scanned whole rather than silently skipped — an
# unscanned chapter is a worse failure than an over-scanned one.
FRONT_FENCE = re.compile(r"^---\s*$")

# A fenced code block is not prose. `draft_lines.surfaces()` has skipped these since it was
# written; `find_line.surfaces()` never did — the same draft-clean / book-leaky asymmetry as the
# front-matter bug fixed earlier on 2026-09-09, and from the same cause: two code paths for
# reading prose, one of them treated.
#
# Found by the third install (Flirtcraft, 2026-09-09), which is a project with shell commands in
# its writing guide. A book rarely contains a code block, so two consumers could not surface this
# and a third did on contact.
CODE_FENCE = re.compile(r"^\s*```")

# A whole-line HTML comment that is not a frame marker (`<!-- SECTION 3 -->`, `<!-- LETTER -->`)
# never prints. Added v32, 2026-09-10: MTGOA's section markers were 60 of fragment.py's 251 hits,
# each `<!-- SECTION N -->` read as a four-word sentence with no verb. `draft_lines.prose()` has
# dropped `<` lines since it was written; book mode never did. Frame markers are matched first
# and keep their meaning.
COMMENT_LINE = re.compile(r"^\s*<!--.*-->\s*$")

# WHAT THE PROJECT'S BUILD DROPS ON THE WAY TO THE PAGE, added v32, 2026-09-10.
#
# `surfaces()` says it reads "exactly what prints", and it read editorial metadata that never
# does. MTGOA's appendices open with `**Status:**`, `**Authority:**` and `**Location in book:**`
# lines that `build_book.strip_provenance` removes before typesetting: 19 lines, every one of them
# scanned as body prose by every instrument. One became a "fragment": `De-somatized per the
# no-somatic-prescription directive.`, the tail of a production note.
#
# Which lines are provenance is the project's business, so the core asks rather than guesses: if
# the project's `build_book.py` defines `nonprinting(lines)`, returning 0-based indices of lines
# the build removes, those lines are blanked here. A project without the hook scans as before.
_NONPRINT = getattr(bb, "nonprinting", None)


def _nonprinting(lines):
    """0-based indices of `lines` the project's build removes, or an empty set."""
    return set(_NONPRINT(lines)) if _NONPRINT else set()


def fold(text):
    for a, b in FOLD.items():
        text = text.replace(a, b)
    # Markdown emphasis is invisible on the page, so a pasted line never has it.
    text = re.sub(r"\*{1,3}|_{1,3}|`", "", text)
    return re.sub(r"\s+", " ", text).strip().lower()


def prose_text(path):
    """One component's PROSE, front matter and apparatus blanked, line numbers preserved.

    Public because gate.py reads component files directly rather than through surfaces(), so it
    did not inherit the 2026-09-09 scoping fix. The selftest caught it: a fixture whose front
    matter read `title: Fixture` was being counted as prose. Blanked rather than cut, so a
    reported line number keeps pointing at the real file.
    """
    lines = io.open(path, encoding="utf-8").read().split("\n")
    first, last = prose_span(lines)
    drop = _nonprinting(lines)
    out, fenced = [], False
    for i, l in enumerate(lines):
        if not (first <= i < last) or i in drop:
            out.append("")
            continue
        if COMMENT_LINE.match(l) and not (FRAME_OPEN.search(l) or FRAME_CLOSE.search(l)):
            out.append("")
            continue
        if CODE_FENCE.match(l):
            fenced = not fenced
            out.append("")
            continue
        out.append("" if fenced else l)
    return "\n".join(out)


def prose_span(lines):
    """(first, last) 0-based indices of the prose in one component's lines.

    Strips YAML front matter always, and narrows to the manifest's `prose_section`
    when one is declared and its `begin` marker is present. See the note above.
    """
    first, last = 0, len(lines)

    # Front matter: a `---` fence on line 1, up to the next one.
    if lines and FRONT_FENCE.match(lines[0]):
        for i in range(1, len(lines)):
            if FRONT_FENCE.match(lines[i]):
                first = i + 1
                break

    sec = _prof.prose_section() if _prof else None
    if not sec:
        return first, last

    begin, end = sec.get("begin"), sec.get("end")
    if begin:
        for i in range(first, last):
            if lines[i].strip() == begin:
                first = i + 1
                break
        else:
            return first, last      # marker absent: scan the component whole
    if end:
        for i in range(first, last):
            if lines[i].strip() == end:
                last = i
                break
    return first, last


def surfaces():
    """Every printed line, with where it is and which voice it is in."""
    out = []
    for kind, label, rel, level in bb.SPINE:
        if rel is None or _excluded(rel):
            continue
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            continue
        lines = io.open(path, encoding="utf-8").read().split("\n")
        first, last = prose_span(lines)
        drop = _nonprinting(lines)
        depth, fenced, frames = 0, False, []
        for i in range(first, last):
            line = lines[i]
            n = i + 1                       # 1-based, still the real file line
            if i in drop:
                continue
            if CODE_FENCE.match(line):
                fenced = not fenced
                continue
            if fenced:
                continue
            m = FRAME_OPEN.search(line)
            if m:
                depth += 1
                frames.append(m.group(1))
                continue
            if FRAME_CLOSE.search(line):
                depth = max(0, depth - 1)
                frames = frames[:-1]
                continue
            if not line.strip() or COMMENT_LINE.match(line):
                continue
            # A scored frame (the manifest's `scored_frames:`) is read as body prose: the box
            # prefix comes off, a bare `>` spacer is a paragraph gap, and the record says
            # `boxed` so its hits are ledgered as notes rather than rewritten. See profile.
            if depth and frames and frames[-1] in SCORED_FRAMES:
                text = re.sub(r"^\s*>\s?", "", line)
                if not text.strip():
                    continue
                out.append({"label": label, "rel": rel, "line": n, "surface": "body",
                            "boxed": frames[-1], "text": text, "key": fold(text)})
                continue
            out.append({"label": label, "rel": rel, "line": n,
                        "surface": "margin" if depth else "body",
                        "text": line, "key": fold(line)})
    return out


def _excluded(rel):
    """Does this component match an `exclude:` glob in the manifest?

    Added 2026-09-09 by the third install. `prose_section` scopes apparatus INSIDE a file; this
    scopes out a whole file. Flirtcraft keeps its card decks and its authoring guide in the same
    directory, and 15 of that project's first 18 hits were the guide — a board made almost
    entirely of text nobody will ever read. A glob narrow enough to exclude it by hand breaks the
    moment a card is added, which is how a corpus definition rots.
    """
    import fnmatch
    for pat in (_prof.exclude() if _prof and hasattr(_prof, "exclude") else []):
        if fnmatch.fnmatch(rel, pat) or fnmatch.fnmatch(os.path.basename(rel), pat):
            return True
    return False


def corpus_paths():
    """The files that make up the book as `(kind, path)` in spine order — the one corpus
    definition every instrument shares. `kind` is the spine's component type ("chapter",
    "appendix", "front", "back", "component"), which lets a caller bucket without hardcoding a
    directory name. It comes from build_book.SPINE: for a real book that is the typeset
    spine (accurate, shipping-only — no backups, retired drafts or unshipped appendices); for a
    generic project it is the SPINE build_book builds from editorial.yaml's `corpus` globs. Either
    way an instrument that calls this scans exactly what telling/trailing_and/etc. scan, in any
    project, instead of globbing a hardcoded `manuscript/` that another book does not have."""
    out = []
    for kind, _label, rel, _level in bb.SPINE:
        if not rel or _excluded(rel):
            continue
        p = os.path.join(ROOT, rel)
        if os.path.exists(p):
            out.append((kind, p))
    return out


def words(s):
    return [w for w in fold(s).split(" ") if w]


def find(query, lines):
    """(how, [hits]) — exact, then longest unique fragment, then nearest."""
    key = fold(query)
    if not key:
        return "empty", []

    hits = [l for l in lines if key and key in l["key"]]
    if hits:
        return "exact", hits

    # A line the typesetter broke arrives as two halves, or with a hyphen the
    # source never had. The longest run of its words that appears exactly once is
    # what survives that, and it is far more reliable than a similarity score.
    ws = words(query)
    for span in range(len(ws), 3, -1):
        for start in range(0, len(ws) - span + 1):
            frag = " ".join(ws[start:start + span])
            found = [l for l in lines if frag in l["key"]]
            if len(found) == 1:
                return "fragment(%d words)" % span, found
            if len(found) > 1:
                return "fragment(%d words, %d places)" % (span, len(found)), found

    scored = sorted(lines, key=lambda l: difflib.SequenceMatcher(
        None, key, l["key"]).ratio(), reverse=True)[:3]
    best = difflib.SequenceMatcher(None, key, scored[0]["key"]).ratio() if scored else 0
    return "nearest(%.0f%%)" % (best * 100), scored[:1] if best > 0.55 else []


def row(note_id, query, how, hit):
    where = "%s:%d" % (hit["rel"], hit["line"]) if hit else "—"
    label = "%s · %s" % (hit["label"], hit["surface"]) if hit else "NOT FOUND"
    quoted = (hit["text"] if hit else query).replace("|", "\\|").strip()
    return "| %s | %s | %s | %s | | | open |" % (note_id, label, where, quoted)


def main():
    # Parse positionally, and consume the value after `--file`. The first version
    # took every non-`--` token as a query, so `--file NOTES.md` searched the book
    # for "NOTES.md", found nothing, and filed a NOT FOUND row naming the notes
    # file itself.
    argv, args, notes = sys.argv[1:], [], None
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--file":
            notes = argv[i + 1] if i + 1 < len(argv) else DEFAULT_NOTES
            i += 2 if i + 1 < len(argv) else 1
            continue
        if a.startswith("--file="):
            notes = a.split("=", 1)[1] or DEFAULT_NOTES
        elif not a.startswith("--"):
            args.append(a)
        i += 1

    if not args:
        sys.stderr.write(__doc__.split("## What it searches")[0])
        return 1

    if args[0] == "-":
        blob = sys.stdin.read()
        # One note per line, but a pasted paragraph is one note. Blank lines split.
        queries = [q.strip() for q in re.split(r"\n\s*\n", blob) if q.strip()]
        queries = [re.sub(r"\s+", " ", q) for q in queries]
    else:
        queries = args

    lines = surfaces()
    print("searching %d printed lines across %d components\n"
          % (len(lines), len({l["label"] for l in lines})))

    rows, misses = [], 0
    for i, q in enumerate(queries, 1):
        how, hits = find(q, lines)
        nid = "N%02d" % i
        print("%s  %s" % (nid, q[:96] + ("…" if len(q) > 96 else "")))
        if not hits:
            misses += 1
            print("     NOT FOUND (%s) — check the paste, or it may be front matter "
                  "the spine does not carry\n" % how)
            rows.append(row(nid, q, how, None))
            continue
        for h in hits[:4]:
            print("     %-9s %-28s %-6s %s" % (
                how, "%s:%d" % (h["rel"], h["line"]), h["surface"],
                h["text"][:80] + ("…" if len(h["text"]) > 80 else "")))
        if len(hits) > 1:
            print("     %d places — a person has to pick, and a real duplicate is a "
                  "finding in itself" % len(hits))
        print()
        rows.append(row(nid, q, how, hits[0]))

    if notes:
        os.makedirs(os.path.dirname(notes), exist_ok=True)
        new = not os.path.exists(notes)
        with io.open(notes, "a", encoding="utf-8") as fh:
            if new:
                fh.write("# Read-through notes\n\n"
                         "Filed by `instruments/find_line.py`. One row per line "
                         "Wendell flagged.\n\n"
                         "| ID | Component · surface | Location | Line as it stands |"
                         " Why it does not work | Replacement | Status |\n"
                         "|---|---|---|---|---|---|---|\n")
            fh.write("\n".join(rows) + "\n")
        print("filed %d row(s) -> %s" % (len(rows), os.path.relpath(notes, ROOT)))

    if misses:
        print("\n%d of %d not found." % (misses, len(queries)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
