# The core closure — the files that travel

**Declared 2026-09-09**, when the core was extracted from `mtgoa-manuscript/instruments/` into its
own home. Before this, "the core" was a subset of a 219-file directory that had to be reconstructed
from the import graph every time anyone asked. This file is the answer, and it is **derived rather
than hand-maintained** — see *Re-deriving* below.

## `instruments/` — 17 modules plus one requirements file

Copied into a consuming project's `instruments/`. Owned by the core; `sync_core.py` overwrites these.

| module | why it is in the closure |
|---|---|
| `profile.py` | reads `editorial.yaml` — corpus, targets, banned, reference bands |
| `exceptions.py` | reads `editorial_exceptions.yaml` — the accepted-deviation ledger |
| `corpus_clean.py` | strips non-prose from comp texts before a band is measured |
| `core_meta.py` | `CORE_VERSION` and the core-home version reader |
| `find_line.py` | the corpus surface every scanner reads |
| `draft_lines.py` | the same record shape from arbitrary files, plus paragraph reflow |
| `density.py` | the POS tagger and paragraph filter that `fragment` and `antecedent` need |
| `notstack.py` | the negative-stack pattern `slop_shapes` imports |
| `gate.py` | banned words, sentence-initial And/But, glued em-dashes |
| `prose_diet.py` | the eight distribution features, read against the reference bands |
| `fragment.py` | sentence fragments (needs NLTK) |
| `antecedent.py` | orphan pronouns (needs NLTK) |
| `slop_shapes.py` | the mechanical half of `no-ai-slop` |
| `trailing_and.py` | loose coordination |
| `telling.py` | the copula-label |
| `light_verb.py` | the buried verb |
| `coherence.py` | the pipeline checked against itself |
| `build_bands.py` | measures a reference band from comp texts |
| `requirements.txt` | pypandoc, typst, nltk |

## `templates/` — installed once, then owned by the project

`sync_core.py` leaves these alone after installation. They are the profile half of the split.

| file | why it is project-owned |
|---|---|
| `build_book.py` | builds the SPINE from the project's own `corpus:` globs |
| `editorial.yaml` | the manifest — the one file that varies per project |

Also project-owned once created, and never shipped by the core: `editorial_exceptions.yaml`,
and anything under `project_only:` in the manifest.

## What is deliberately outside the closure

`mtgoa-manuscript/instruments/` holds roughly 200 further files — chapter-specific one-off scripts,
`agency_grep.py` and its registry, the PDF/EPUB builders, MTGOA's own hand-authored `review.py` and
`build_book.py`. All of it is welded to one book. None of it travels.

## Re-deriving this list

The closure is the transitive import graph of the entry points, and it can be recomputed rather than
trusted:

```bash
python3 - <<'PY'
import os, re
CORE = "editorial-core/instruments"
ENTRY = ["gate","prose_diet","fragment","antecedent","slop_shapes","trailing_and","telling",
         "light_verb","coherence","build_bands","build_book"]
PAT = [re.compile(r'spec_from_file_location\(\s*["\'](\w+)["\']'),
       re.compile(r'os\.path\.join\(HERE,\s*["\'](\w+)\.py["\']\)'),
       re.compile(r'_load(?:_mod)?\(\s*["\'](\w+)["\']')]
seen, stack = set(), list(ENTRY)
while stack:
    n = stack.pop()
    if n in seen: continue
    p = os.path.join(CORE, n + ".py")
    if not os.path.exists(p): continue
    seen.add(n)
    src = open(p, encoding="utf-8", errors="ignore").read()
    for pat in PAT:
        for d in pat.findall(src):
            if os.path.exists(os.path.join(CORE, d + ".py")): stack.append(d)
print(sorted(seen))
PY
```

Run it after adding or removing a core module. A module the graph reaches that this file omits is a
closure that has drifted from the code, which is the failure this document exists to catch.

**`build_book` appears in the derivation and lives in `templates/`.** `find_line` imports it, so a
project needs it in `instruments/` — the core ships it as a template because its *content* is the
project's corpus, and sync must leave it alone.
