# -*- coding: utf-8 -*-
"""
build_book.py — the corpus, generic edition. Ported from MTGOA 2026-09-04.

In MTGOA this file typesets the whole book and its `SPINE` is a hand-authored list of
components in printed order. That richness is MTGOA's own. The one thing the editorial
scanners need from it is `SPINE`: the ordered list of files that *are* the book, so
`find_line.surfaces()` can walk them. Everything downstream (telling, light_verb,
trailing_and, antecedent, fragment, slop_shapes) reads the book through that one door.

This edition builds `SPINE` from the manifest instead of by hand. `editorial.yaml`'s
`corpus:` globs are the portable statement of "what the book is here" — until now they
were declared but nothing read them. This makes them load-bearing: change the globs,
and every book-wide scanner follows. That is the corpus half of the universal/profile
split from specs/EDITORIAL_PIPELINE_COHERENCE_2026-09-03.md, made real for a second project.

    SPINE entry shape (what find_line.surfaces expects): (kind, label, rel, level)
      kind  — coarse component type, "chapter" here; scanners don't branch on it
      label — the name that prints in a finding ("chapter-01.md")
      rel   — path relative to the project root, the thing actually read
      level — MTGOA's blocker/gap tier; opaque to the scanners, kept for shape parity
"""
import io, os, re, glob, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, os.pardir))

BLOCKER, GAP, OPTIONAL = "BLOCKER", "GAP", "OPTIONAL"


def _load_profile():
    spec = importlib.util.spec_from_file_location("profile", os.path.join(HERE, "profile.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _build_spine():
    """Every file matched by the manifest's corpus globs, in glob order then sorted,
    de-duplicated. rel is relative to ROOT, the way find_line.surfaces reads it."""
    prof = _load_profile()
    globs = prof.corpus([])  # [] default: with no manifest there is deliberately no corpus
    seen, spine = set(), []
    for pattern in globs:
        for path in sorted(glob.glob(os.path.join(ROOT, pattern))):
            rel = os.path.relpath(path, ROOT)
            if rel in seen or not os.path.isfile(path):
                continue
            seen.add(rel)
            spine.append(("chapter", os.path.basename(rel), rel, BLOCKER))
    return spine


SPINE = _build_spine()


# --- kept for interface parity with MTGOA's build_book, in case a ported step calls them ---

META_KEY = re.compile(r"^[a-z][a-z0-9_-]*:.*$", re.M)


def strip_provenance(text):
    """Remove a leading YAML front-matter block (--- ... ---) from a component."""
    if text.startswith("---"):
        parts = text.split("\n---\n", 1)
        if len(parts) == 2:
            return parts[1].lstrip("\n")
    return text


def read(rel):
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path):
        return None
    return strip_provenance(io.open(path, encoding="utf-8").read())


def words(text):
    return len(text.split())


if __name__ == "__main__":
    print("corpus SPINE (%d file(s)) built from editorial.yaml corpus globs:" % len(SPINE))
    for kind, label, rel, level in SPINE:
        print("  %-10s %s" % (kind, rel))
