# Post-mortem — the silently emptied ledger

**2026-09-09.** MTGOA's `editorial_exceptions.yaml` stopped parsing during an automated edit.
Twenty-three acceptances went dead. `coherence` reported `ledger  ok  clean` throughout.

Caught within one command, by reading a count that did not move. Nothing was lost — the entries
were still in the file, structurally orphaned. Total exposure was a few minutes inside one session.

---

## What happened

| | |
|---|---|
| **Impact** | 9 `slop_shapes` + 14 `polysyndeton` acceptances read as absent. Both counts silently inflated. |
| **Detection** | Manual. A `polysyndeton` acceptance count stayed at `0` after a write that should have moved it. |
| **Board's report** | `ledger  ok  clean`. **The board was green over a dead ledger.** |
| **Data loss** | None. |

## Root cause

A script inserted a new block with:

```python
t.replace("trailing_and:", block + "\n\ntrailing_and:", 1)
```

The ledger's header carries commented examples of the file format, and one of them ends
`#   trailing_and:`. **That is the first occurrence of the substring in the file.** The block was
spliced in after the `#   ` prefix, so its key line became `#   polysyndeton:` — commented out —
while its list entries stayed at top level with no parent key. Orphaned list items are not valid
YAML.

Verified by reproduction rather than inference. **My first written explanation of this incident was
wrong**: I reported the cause as a too-greedy cleanup regex in the follow-up script. The minimal
reproduction of that regex parsed fine, which is what sent me back to the header.

### Three failures in series

Each is ordinary alone. The incident needed all three.

| | failure | effect |
|---|---|---|
| 1 | a substring match that landed in a comment | a structurally broken file |
| 2 | `except Exception: {}` in `exceptions.py` | broken read as empty |
| 3 | `check_ledger` only looks for *stale* entries | nothing to call stale when it reads none |

**Failure 2 is the one that turned a loud error into a silent one.** A corrupt file, an absent file
and an empty file are three different states, and the code collapsed them into one.

**Failure 3 is the one this pipeline should be least willing to forgive.** The whole argument for
the deterministic layer is that counts repeat and readings do not. A check that cannot tell *"no
exceptions"* from *"the exceptions file is broken"* breaks that argument at the root: the count
repeated perfectly, and it was wrong.

### Why it was mine to make

I was editing a structured data file with string operations. Every specific bug above follows from
that one decision. A YAML parser cannot mistake a comment for a key; `str.replace` has no idea what
a comment is.

The pressure that produced it is worth naming, because it will recur: I was writing throwaway
scripts to move quickly through a batch of ledger entries, and a throwaway script felt like it did
not need the care a committed module gets. **The file it writes is not throwaway.**

## Contributing factors

- **Truncated output used as data.** The first version of the same script took its ledger keys from
  `polysyndeton.py -v` stdout, which truncates sentences at 130 characters. Every key matched
  nothing. That failure is what prompted the second script and the cleanup that broke the file.
  Machine-readable data should never be scraped from a human-readable listing.
- **No validation before write.** Nothing parsed the result.
- **No backup.** The file is untracked by git, so there was no history to fall back on.
- **Non-atomic write.** An interruption mid-write would have left a partial file.

## What changed

| | control | verified by |
|---|---|---|
| 1 | **`readable` — a hard check ahead of `ledger`.** Fails the board when the ledger will not parse. | negative test: broke the file on purpose, read `FAIL`, then `ok` on restore |
| 2 | **`exceptions.py` records the parse error** instead of swallowing it. Absent, empty and corrupt are now three distinct states. | `exceptions.error()` |
| 3 | **`instruments/ledger.py` — the only supported writer.** Parses, mutates the object, round-trips through `safe_load` in memory, writes atomically via `os.replace`, keeps one `.bak`. | selftest asserts a write still parses |
| 4 | **Selftest coverage for this incident class.** Three new assertions: a corrupt ledger fails, it passes again once repaired, and `ledger.py` writes a parseable file. | `selftest.py` — 19/19 |
| 5 | **`--file` takes a TSV**, and the help text says why never to paste from a `-v` listing. | — |

Run it yourself:

```bash
python3 editorial-core/selftest.py -v
```

## The rule that comes out of this

**Never edit a structured file with string operations.** Not YAML, not JSON, not a manifest — not
in a committed module and not in a five-line script. Parse it, change the object, serialise it, and
check the result parses before it reaches disk. `instruments/ledger.py` is where that is
implemented for this file; anything else that writes structured data owes the same treatment.

**And a check that reports `ok` must be able to distinguish "nothing to report" from "I could not
look."** Every remaining check in `coherence.py` should be read against that question. `reference`,
`register` and `orphan` report `n/a` when a project has not declared the thing they check — which
is correct — but the same shape would hide a *broken* declaration, and none of them currently
tells those apart.

## Cost, honestly

The `safe_dump` round trip does not preserve comments. Block-level notes in a ledger are lost the
next time `ledger.py` writes it. This is why a reason belongs in an entry's `reason:` field: the
field survives a rewrite and a comment above it does not. The existing per-head comment blocks in
both books' ledgers will be lost on their next programmatic write, and their substance is already
duplicated into each entry's `reason:`.
